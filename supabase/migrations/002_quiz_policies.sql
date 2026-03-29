-- Migration 002: Allow users to insert quizzes and questions for their own courses

-- Users can create quizzes for their own courses
create policy "Users can insert quizzes" on public.quizzes
  for insert with check (
    exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid())
  );

-- Users can insert quiz questions for their own quizzes
create policy "Users can insert quiz questions" on public.quiz_questions
  for insert with check (
    exists (
      select 1 from public.quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = quiz_id and c.user_id = auth.uid()
    )
  );

-- Users can insert their own quiz attempts
-- (already covered by "Users manage own attempts" all-policy, but explicit insert is fine)
