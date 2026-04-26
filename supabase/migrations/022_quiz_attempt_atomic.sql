-- Prevent double XP from parallel quiz submissions.

create unique index if not exists quiz_attempts_user_quiz_idx
  on public.quiz_attempts (user_id, quiz_id);

create or replace function public.submit_quiz_attempt_once(
  p_user_id uuid,
  p_quiz_id uuid,
  p_score integer,
  p_answers jsonb,
  p_passed boolean,
  p_xp_awarded integer
)
returns table(is_retake boolean, xp_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  insert into public.quiz_attempts (
    user_id,
    quiz_id,
    score,
    answers_json,
    passed,
    xp_awarded
  )
  values (
    p_user_id,
    p_quiz_id,
    p_score,
    p_answers,
    p_passed,
    greatest(p_xp_awarded, 0)
  )
  on conflict (user_id, quiz_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return query select true, 0;
    return;
  end if;

  if p_xp_awarded > 0 then
    update public.profiles
    set total_xp = total_xp + p_xp_awarded
    where id = p_user_id;
  end if;

  return query select false, greatest(p_xp_awarded, 0);
end;
$$;

revoke all on function public.submit_quiz_attempt_once(uuid, uuid, integer, jsonb, boolean, integer) from public;
grant execute on function public.submit_quiz_attempt_once(uuid, uuid, integer, jsonb, boolean, integer) to service_role;
