import { supabase } from "@/integrations/supabase/client";
import type { Campaign, Post, SocialAccount } from "./sosial";

const seedIds = new Set(["CMP-015", "CMP-014"]);

export async function loadSocialCampaigns(): Promise<Campaign[] | null> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("social_campaigns")
    .select("snapshot")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .map((row) => row.snapshot as unknown as Campaign)
    .filter((item) => item && typeof item.id === "string");
}

/**
 * Saves each campaign and all child records through one PostgreSQL RPC transaction.
 * The database derives ownership from auth.uid(); no client-supplied user_id is trusted.
 */
export async function persistSocialCampaigns(
  campaigns: Campaign[],
  accounts: SocialAccount[],
) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return;

  const realCampaigns = campaigns.filter((campaign) => !seedIds.has(campaign.id));

  for (const campaign of realCampaigns) {
    const targets = campaign.accounts.map((accountKey) => {
      const account = accounts.find((item) => item.id === accountKey);
      return {
        account_key: accountKey,
        platform: account?.platform ?? accountKey.split(":")[0] ?? "",
        handle: account?.handle ?? accountKey.split(":").slice(1).join(":"),
        snapshot: account ?? { id: accountKey },
      };
    });

    const posts = campaign.posts.map((post: Post) => ({
      legacy_post_id: post.id,
      account_key: post.accountId,
      asset_id: post.assetId,
      platform: post.platform,
      scheduled_date: post.date || null,
      scheduled_time: post.time || null,
      caption: post.caption,
      prep_status: post.prep,
      execution_status: post.exec,
      published_url: post.actual ?? null,
      error_message: post.reason ?? null,
      snapshot: post,
    }));

    const approvals = (campaign.approvals ?? []).map((approval) => ({
      decision: approval.decision,
      actor: approval.actor,
      note: approval.note ?? null,
      snapshot: approval,
    }));

    const history = campaign.history.map((entry) => ({
      event_text: entry.text,
      snapshot: entry,
    }));

    const { error } = await supabase.rpc("persist_social_campaign_atomic", {
      p_campaign: campaign,
      p_targets: targets,
      p_posts: posts,
      p_approvals: approvals,
      p_history: history,
    });
    if (error) throw error;
  }
}
