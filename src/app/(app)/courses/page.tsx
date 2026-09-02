import { AddCourseToggle } from "./AddCourseToggle";
import { CoursesList } from "./CoursesList";
import { screenTitle } from "@/lib/ui";

export default function CoursesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Courses</h1>
      <AddCourseToggle />
      <CoursesList />
    </div>
  );
}
