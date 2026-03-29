"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to delete course");
  redirect("/dashboard");
}

export async function updateCourseStatus(courseId: string, status: "active" | "paused") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("courses")
    .update({ status })
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to update course status");
}
