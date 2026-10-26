import { supabase } from "@/integrations/supabase/client";
import type { Campaign, Post, SocialAccount } from "./sosial";

const db = supabase as any;
const seedIds = new Set(["CMP-015", "CMP-014"]);

export async function loadSocialCampaigns(): Promise<Campaign[] | null> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;
  const { data, error } = await db.from("social_campaigns").select("snapshot").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: { snapshot: Campaign }) => row.snapshot).filter((item: Campaign) => item && typeof item.id === "string");
}

/** Persists user-created campaigns only; never migrates demo seed campaigns into a user's real workspace. */
export async function persistSocialCampaigns(campaigns: Campaign[], accounts: SocialAccount[]) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = auth.user;
  if (!user) return;
  const realCampaigns = campaigns.filter((campaign) => !seedIds.has(campaign.id));
  for (const campaign of realCampaigns) {
    const { data: parent, error: parentError } = await db.from("social_campaigns").upsert({
      user_id: user.id,
      legacy_id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      approval_status: campaign.approval,
      production_id: campaign.productionId,
      content_ids: campaign.contentIds,
      purpose: campaign.purpose,
      direction: campaign.direction,
      platforms: campaign.platforms,
      timing: campaign.timing,
      staggered: campaign.staggered,
      submitted_by: campaign.submittedBy ?? null,
      submitted_at: campaign.submittedAt ?? null,
      submitted_day: campaign.submittedDay ?? null,
      snapshot: campaign,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,legacy_id" }).select("id").single();
    if (parentError) throw parentError;
    const campaignId = parent.id as string;

    for (const table of ["social_campaign_targets", "social_campaign_posts", "social_campaign_approvals", "social_campaign_history"]) {
      const { error } = await db.from(table).delete().eq("campaign_id", campaignId);
      if (error) throw error;
    }
    const targets = campaign.accounts.map((accountKey) => {
      const account = accounts.find((item) => item.id === accountKey);
      return { user_id: user.id, campaign_id: campaignId, account_key: accountKey, platform: account?.platform ?? accountKey.split(":")[0] ?? "", handle: account?.handle ?? accountKey.split(":").slice(1).join(":"), snapshot: account ?? { id: accountKey } };
    });
    if (targets.length) {
      const { error } = await db.from("social_campaign_targets").insert(targets);
      if (error) throw error;
    }
    const posts = campaign.posts.map((post: Post) => ({
      user_id: user.id, campaign_id: campaignId, legacy_post_id: post.id, account_key: post.accountId,
      asset_id: post.assetId, platform: post.platform, scheduled_date: post.date || null, scheduled_time: post.time || null,
      caption: post.caption, prep_status: post.prep, execution_status: post.exec,
      published_url: post.actual ?? null, error_message: post.reason ?? null, snapshot: post,
      updated_at: new Date().toISOString(),
    }));
    if (posts.length) {
      const { error } = await db.from("social_campaign_posts").insert(posts);
      if (error) throw error;
    }
    const approvals = (campaign.approvals ?? []).map((approval) => ({
      user_id: user.id, campaign_id: campaignId, decision: approval.decision, actor: approval.actor,
      note: approval.note ?? null, snapshot: approval,
    }));
    if (approvals.length) {
      const { error } = await db.from("social_campaign_approvals").insert(approvals);
      if (error) throw error;
    }
    const history = campaign.history.map((entry) => ({
      user_id: user.id, campaign_id: campaignId, event_text: entry.text, snapshot: entry,
    }));
    if (history.length) {
      const { error } = await db.from("social_campaign_history").insert(history);
      if (error) throw error;
    }
  }
}
