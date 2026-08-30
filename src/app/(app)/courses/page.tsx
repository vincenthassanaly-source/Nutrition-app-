import { createClient } from "@/lib/supabase/server";
import { AddCourseToggle } from "./AddCourseToggle";
import { CoursesList } from "./CoursesList";
import { errorText, screenTitle } from "@/lib/ui";

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("courses_items")
    .select("*")
    .order("coche", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Courses</h1>
      <AddCourseToggle />
      <CoursesList items={items ?? []} />
    </div>
  );
}
