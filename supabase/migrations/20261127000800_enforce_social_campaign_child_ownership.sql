-- Enforce that child rows always belong to the same owner as their campaign.
-- RLS on child.user_id alone is not sufficient to prevent cross-owner campaign references.
alter table public.social_campaigns
  add constraint social_campaigns_id_user_id_key unique (id, user_id);

alter table public.social_campaign_targets
  drop constraint if exists social_campaign_targets_campaign_id_fkey,
  add constraint social_campaign_targets_campaign_owner_fkey
    foreign key (campaign_id, user_id)
    references public.social_campaigns (id, user_id)
    on delete cascade;

alter table public.social_campaign_posts
  drop constraint if exists social_campaign_posts_campaign_id_fkey,
  add constraint social_campaign_posts_campaign_owner_fkey
    foreign key (campaign_id, user_id)
    references public.social_campaigns (id, user_id)
    on delete cascade;

alter table public.social_campaign_approvals
  drop constraint if exists social_campaign_approvals_campaign_id_fkey,
  add constraint social_campaign_approvals_campaign_owner_fkey
    foreign key (campaign_id, user_id)
    references public.social_campaigns (id, user_id)
    on delete cascade;

alter table public.social_campaign_history
  drop constraint if exists social_campaign_history_campaign_id_fkey,
  add constraint social_campaign_history_campaign_owner_fkey
    foreign key (campaign_id, user_id)
    references public.social_campaigns (id, user_id)
    on delete cascade;
