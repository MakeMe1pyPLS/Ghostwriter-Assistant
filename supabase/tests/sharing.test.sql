-- Permission-boundary test for sharing a client workspace (migration 20261105_share_client_workspaces).
-- Run it against a database that already has the migration. It makes its own users and workspaces
-- inside ONE statement that always ends with an error, so nothing is ever saved. The error message
-- is the report: every line says PASS or FAIL, and the last line says how many failed.
--   psql "$DATABASE_URL" -f supabase/tests/sharing.test.sql
-- Generated from the checks below; edit with care.
do $test$

declare
  r text := '';
  n int;
  j jsonb;
  inv uuid;
  cnt int;
begin
  -- fixtures (rolled back at the end)
  insert into auth.users (id, email, email_confirmed_at, aud, role) values
    ('00000000-0000-0000-0000-0000000000a1','consultant@example.test',now(),'authenticated','authenticated'),
    ('00000000-0000-0000-0000-0000000000a2','client@example.test',now(),'authenticated','authenticated'),
    ('00000000-0000-0000-0000-0000000000a3','stranger@example.test',now(),'authenticated','authenticated'),
    ('00000000-0000-0000-0000-0000000000a4','unconfirmed@example.test',null,'authenticated','authenticated');
  insert into public.workspaces (owner_id, id, kind, name, meta, growth, dashboard) values
    ('00000000-0000-0000-0000-0000000000a1','own','own','Consultant own','{}','{}','{}'),
    ('00000000-0000-0000-0000-0000000000a1','c1','client','Acme Foods',
       '{"industryId":"retail","status":"Active","notes":["PRIVATE consultant note"],"contactEmail":"boss@acme.test","contactName":"Boss"}',
       '{"profile":{"businessName":"Acme"},"plan":null,"integrations":{"teamsWebhook":"https://hooks.example/secret"},"actions":[{"id":"a1","title":"Fix returns","status":"todo","notes":"PRIVATE action note"}]}',
       '{"datasetLibrary":[],"activeDatasetBySector":{},"selectedSector":"ecommerce","secretThing":"x"}'),
    ('00000000-0000-0000-0000-0000000000a1','c2','client','Other client','{}','{"actions":[]}','{}');

execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a3','role','authenticated','email','stranger@example.test')::text, true);
r := r || case when ((select count(*) = 0 from public.workspaces)) then 'PASS ' else 'FAIL ' end || 'stranger sees none of the consultant''s workspaces' || E'\n';
r := r || case when ((select public.shared_workspace('00000000-0000-0000-0000-0000000000a1','c1') is null)) then 'PASS ' else 'FAIL ' end || 'stranger gets nothing from shared_workspace' || E'\n';
r := r || case when ((select count(*) = 0 from public.shared_with_me())) then 'PASS ' else 'FAIL ' end || 'stranger sees empty shared list' || E'\n';
begin execute 'select public.invite_to_workspace(''c1'',''x@example.test'')'; r := r || 'FAIL (should have been refused) stranger cannot invite to someone else''s workspace' || E'\n'; exception when others then r := r || 'PASS stranger cannot invite to someone else''s workspace' || E'\n'; end;
begin execute 'insert into public.workspace_members (owner_id, workspace_id, user_id, email) values (''00000000-0000-0000-0000-0000000000a1'',''c1'',''00000000-0000-0000-0000-0000000000a3'',''stranger@example.test'')'; r := r || 'FAIL (should have been refused) stranger cannot write members directly' || E'\n'; exception when others then r := r || 'PASS stranger cannot write members directly' || E'\n'; end;
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','email','consultant@example.test')::text, true);
perform public.invite_to_workspace('c1', '  Client@Example.test ');
perform public.invite_to_workspace('c1', 'unconfirmed@example.test');
begin execute 'select public.invite_to_workspace(''c1'',''consultant@example.test'')'; r := r || 'FAIL (should have been refused) cannot invite yourself' || E'\n'; exception when others then r := r || 'PASS cannot invite yourself' || E'\n'; end;
begin execute 'select public.invite_to_workspace(''c1'',''not-an-email'')'; r := r || 'FAIL (should have been refused) rejects a bad email' || E'\n'; exception when others then r := r || 'PASS rejects a bad email' || E'\n'; end;
begin execute 'select public.invite_to_workspace(''own'',''a@example.test'')'; r := r || 'FAIL (should have been refused) cannot share the own workspace' || E'\n'; exception when others then r := r || 'PASS cannot share the own workspace' || E'\n'; end;
begin execute 'select public.invite_to_workspace(''nope'',''a@example.test'')'; r := r || 'FAIL (should have been refused) cannot share a workspace that does not exist' || E'\n'; exception when others then r := r || 'PASS cannot share a workspace that does not exist' || E'\n'; end;
r := r || case when ((select count(*) = 2 from public.workspace_invites)) then 'PASS ' else 'FAIL ' end || 'owner sees two pending invites' || E'\n';
r := r || case when ((select count(*) = 1 from public.workspace_invites where email = 'client@example.test')) then 'PASS ' else 'FAIL ' end || 'invite email was normalised' || E'\n';
begin execute 'insert into public.workspace_members (owner_id, workspace_id, user_id, email) values (''00000000-0000-0000-0000-0000000000a1'',''c1'',''00000000-0000-0000-0000-0000000000a3'',''x'')'; r := r || 'FAIL (should have been refused) owner cannot insert members directly' || E'\n'; exception when others then r := r || 'PASS owner cannot insert members directly' || E'\n'; end;
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a2','role','authenticated','email','client@example.test')::text, true);
r := r || case when ((select public.shared_workspace('00000000-0000-0000-0000-0000000000a1','c1') is null)) then 'PASS ' else 'FAIL ' end || 'invitee sees nothing before accepting' || E'\n';
r := r || case when ((select count(*) = 0 from public.workspace_invites)) then 'PASS ' else 'FAIL ' end || 'invitee cannot see invites table rows' || E'\n';
cnt := public.accept_my_invites();
r := r || case when (cnt = 1) then 'PASS ' else 'FAIL ' end || 'accepting joins one workspace' || E'\n';
cnt := public.accept_my_invites();
r := r || case when (cnt = 0) then 'PASS ' else 'FAIL ' end || 'accepting twice joins nothing more' || E'\n';
r := r || case when ((select count(*) = 1 from public.shared_with_me() where name = 'Acme Foods' and role = 'viewer')) then 'PASS ' else 'FAIL ' end || 'shared list has the workspace' || E'\n';
j := public.shared_workspace('00000000-0000-0000-0000-0000000000a1','c1');
r := r || case when (j is not null and j->>'name' = 'Acme Foods') then 'PASS ' else 'FAIL ' end || 'viewer gets the workspace' || E'\n';
r := r || case when (j->'growth'->'actions'->0->>'title' = 'Fix returns') then 'PASS ' else 'FAIL ' end || 'action titles are included' || E'\n';
r := r || case when (not (j::text like '%PRIVATE action note%')) then 'PASS ' else 'FAIL ' end || 'action notes are removed' || E'\n';
r := r || case when (not (j::text like '%PRIVATE consultant note%')) then 'PASS ' else 'FAIL ' end || 'consultant''s private client notes are removed' || E'\n';
r := r || case when (not (j::text like '%boss@acme.test%')) then 'PASS ' else 'FAIL ' end || 'client contact details are removed' || E'\n';
r := r || case when (not (j::text like '%hooks.example%')) then 'PASS ' else 'FAIL ' end || 'webhook addresses are removed' || E'\n';
r := r || case when (not (j::text like '%secretThing%')) then 'PASS ' else 'FAIL ' end || 'unlisted dashboard fields are removed' || E'\n';
r := r || case when ((select count(*) = 0 from public.workspaces)) then 'PASS ' else 'FAIL ' end || 'viewer cannot read the workspaces table' || E'\n';
execute 'update public.workspaces set name = ''Hacked'' where owner_id = ''00000000-0000-0000-0000-0000000000a1'''; get diagnostics n = row_count; r := r || case when n = 0 then 'PASS ' else 'FAIL ' end || 'viewer cannot update a workspace (rows: ' || n || ')' || E'\n';
execute 'delete from public.workspaces where owner_id = ''00000000-0000-0000-0000-0000000000a1'''; get diagnostics n = row_count; r := r || case when n = 0 then 'PASS ' else 'FAIL ' end || 'viewer cannot delete a workspace (rows: ' || n || ')' || E'\n';
begin execute 'insert into public.workspaces (owner_id, id, kind, name) values (''00000000-0000-0000-0000-0000000000a1'',''zz'',''client'',''x'')'; r := r || 'FAIL (should have been refused) viewer cannot insert into the owner''s account' || E'\n'; exception when others then r := r || 'PASS viewer cannot insert into the owner''s account' || E'\n'; end;
begin execute 'insert into public.audit_log (owner_id, kind, summary) values (''00000000-0000-0000-0000-0000000000a1'',''shared-view'',''x'')'; r := r || 'FAIL (should have been refused) viewer cannot write the history' || E'\n'; exception when others then r := r || 'PASS viewer cannot write the history' || E'\n'; end;
begin execute 'update public.audit_log set summary = ''x'''; r := r || 'FAIL (should have been refused) viewer cannot edit the history' || E'\n'; exception when others then r := r || 'PASS viewer cannot edit the history' || E'\n'; end;
r := r || case when ((select count(*) = 0 from public.audit_log)) then 'PASS ' else 'FAIL ' end || 'viewer cannot read the owner''s history' || E'\n';
r := r || case when ((select public.shared_workspace('00000000-0000-0000-0000-0000000000a1','c2') is null)) then 'PASS ' else 'FAIL ' end || 'other workspace stays hidden' || E'\n';
perform public.shared_workspace('00000000-0000-0000-0000-0000000000a1','c1');
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a4','role','authenticated','email','unconfirmed@example.test')::text, true);
cnt := public.accept_my_invites();
r := r || case when (cnt = 0) then 'PASS ' else 'FAIL ' end || 'unconfirmed email cannot claim an invite' || E'\n';
r := r || case when ((select public.shared_workspace('00000000-0000-0000-0000-0000000000a1','c1') is null)) then 'PASS ' else 'FAIL ' end || 'unconfirmed email gets nothing' || E'\n';
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','email','consultant@example.test')::text, true);
r := r || case when ((select count(*) = 2 from public.audit_log where kind = 'invite-sent')) then 'PASS ' else 'FAIL ' end || 'history has 2 invites' || E'\n';
r := r || case when ((select count(*) = 1 from public.audit_log where kind = 'member-joined')) then 'PASS ' else 'FAIL ' end || 'history shows the join' || E'\n';
r := r || case when ((select count(*) = 1 from public.audit_log where kind = 'shared-view')) then 'PASS ' else 'FAIL ' end || 'repeat views in an hour are logged once' || E'\n';
begin execute 'update public.audit_log set summary = ''x'''; r := r || 'FAIL (should have been refused) owner cannot edit the history' || E'\n'; exception when others then r := r || 'PASS owner cannot edit the history' || E'\n'; end;
begin execute 'delete from public.audit_log'; r := r || 'FAIL (should have been refused) owner cannot delete from the history' || E'\n'; exception when others then r := r || 'PASS owner cannot delete from the history' || E'\n'; end;
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a3','role','authenticated','email','stranger@example.test')::text, true);
r := r || case when ((select count(*) = 0 from public.audit_log)) then 'PASS ' else 'FAIL ' end || 'stranger sees no history' || E'\n';
-- remove / revoke attempts
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a3','role','authenticated','email','stranger@example.test')::text, true);
perform public.remove_workspace_member('00000000-0000-0000-0000-0000000000a1','c1','00000000-0000-0000-0000-0000000000a2');
select i.id into inv from public.workspace_invites i limit 1;
r := r || case when (inv is null) then 'PASS ' else 'FAIL ' end || 'stranger cannot see invites to revoke' || E'\n';
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','email','consultant@example.test')::text, true);
r := r || case when ((select count(*) = 1 from public.workspace_members)) then 'PASS ' else 'FAIL ' end || 'member survived the stranger''s removal attempt' || E'\n';
select i.id into inv from public.workspace_invites i where i.email = 'unconfirmed@example.test';
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a3','role','authenticated','email','stranger@example.test')::text, true);
perform public.revoke_workspace_invite(inv);
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','email','consultant@example.test')::text, true);
r := r || case when ((select count(*) = 1 from public.workspace_invites)) then 'PASS ' else 'FAIL ' end || 'stranger could not revoke the invite' || E'\n';
perform public.revoke_workspace_invite(inv);
r := r || case when ((select count(*) = 0 from public.workspace_invites)) then 'PASS ' else 'FAIL ' end || 'owner revoked the invite' || E'\n';
execute 'reset role'; perform set_config('request.jwt.claims','',true);
insert into public.workspace_invites (owner_id, workspace_id, email, expires_at) values ('00000000-0000-0000-0000-0000000000a1','c2','stranger@example.test', now() - interval '1 day');
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a3','role','authenticated','email','stranger@example.test')::text, true);
cnt := public.accept_my_invites();
r := r || case when (cnt = 0) then 'PASS ' else 'FAIL ' end || 'expired invite is ignored' || E'\n';
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','email','consultant@example.test')::text, true);
perform public.remove_workspace_member('00000000-0000-0000-0000-0000000000a1','c1','00000000-0000-0000-0000-0000000000a2');
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a2','role','authenticated','email','client@example.test')::text, true);
r := r || case when ((select public.shared_workspace('00000000-0000-0000-0000-0000000000a1','c1') is null)) then 'PASS ' else 'FAIL ' end || 'removed viewer loses access' || E'\n';
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','email','consultant@example.test')::text, true);
r := r || case when ((select count(*) = 1 from public.audit_log where kind = 'member-removed')) then 'PASS ' else 'FAIL ' end || 'history shows the removal' || E'\n';
perform public.invite_to_workspace('c1','client@example.test');
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a2','role','authenticated','email','client@example.test')::text, true);
cnt := public.accept_my_invites();
perform public.remove_workspace_member('00000000-0000-0000-0000-0000000000a1','c1','00000000-0000-0000-0000-0000000000a2');
r := r || case when ((select count(*) = 0 from public.shared_with_me())) then 'PASS ' else 'FAIL ' end || 'a viewer can leave by themselves' || E'\n';
execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','email','consultant@example.test')::text, true);
perform public.invite_to_workspace('c1','p0@example.test');
perform public.invite_to_workspace('c1','p1@example.test');
perform public.invite_to_workspace('c1','p2@example.test');
perform public.invite_to_workspace('c1','p3@example.test');
perform public.invite_to_workspace('c1','p4@example.test');
perform public.invite_to_workspace('c1','p5@example.test');
perform public.invite_to_workspace('c1','p6@example.test');
perform public.invite_to_workspace('c1','p7@example.test');
perform public.invite_to_workspace('c1','p8@example.test');
perform public.invite_to_workspace('c1','client@example.test');
begin execute 'select public.invite_to_workspace(''c1'',''extra@example.test'')'; r := r || 'FAIL (should have been refused) 11th person is refused' || E'\n'; exception when others then r := r || 'PASS 11th person is refused' || E'\n'; end;
execute 'reset role'; perform set_config('request.jwt.claims','',true);
delete from public.workspaces where owner_id = '00000000-0000-0000-0000-0000000000a1' and id = 'c1';
r := r || case when ((select count(*) = 0 from public.workspace_invites where workspace_id = 'c1') and (select count(*) = 0 from public.workspace_members where workspace_id = 'c1')) then 'PASS ' else 'FAIL ' end || 'deleting a workspace removes its invites and members' || E'\n';

  raise exception E'SHARING TESTS\n% \nFAILED: %', r, (length(r) - length(replace(r, 'FAIL', ''))) / 4;
end;
$test$;
