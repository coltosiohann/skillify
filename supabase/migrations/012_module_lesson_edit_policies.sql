-- Allow users to update and delete their own modules and lessons

CREATE POLICY "Users can update own modules" ON public.modules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own modules" ON public.modules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users can update own lessons" ON public.lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own lessons" ON public.lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.user_id = auth.uid()
    )
  );
