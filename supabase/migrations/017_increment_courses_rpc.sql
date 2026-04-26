-- Recalculate courses_generated_this_month for the calling user from source
-- course rows. This keeps the displayed counter correct across month changes
-- and avoids drift if a previous fire-and-forget RPC call failed.

create or replace function public.increment_courses_generated()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set courses_generated_this_month = (
    select count(*)::integer
    from public.courses
    where user_id = auth.uid()
      and created_at >= date_trunc('month', now())
  )
  where id = auth.uid();
end;
$$;

grant execute on function public.increment_courses_generated() to authenticated;
