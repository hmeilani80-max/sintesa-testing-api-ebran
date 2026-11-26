-- Never leave a stale risk label on a finding whose evidence is insufficient.
create or replace function public.clear_stale_situasi_finding_risk()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.data_quality='insufficient' then
    new.risk := null;
    new.warning_status := 'Data belum cukup';
    new.risk_score := null;
  end if;
  return new;
end $$;

drop trigger if exists situasi_findings_clear_stale_risk on public.situasi_system_findings;
create trigger situasi_findings_clear_stale_risk
before insert or update of data_quality on public.situasi_system_findings
for each row execute function public.clear_stale_situasi_finding_risk();

revoke all on function public.clear_stale_situasi_finding_risk() from public,anon,authenticated;

-- Re-evaluate existing rows after the guard trigger is installed.
update public.situasi_system_findings set data_quality='insufficient' where data_quality='insufficient';
