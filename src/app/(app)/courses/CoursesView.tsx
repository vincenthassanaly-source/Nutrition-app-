"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AddCourseToggle } from "./AddCourseToggle";
import { CoursesList } from "./CoursesList";
import { queryKeys } from "@/lib/query/keys";
import { PullToRefresh } from "@/components/PullToRefresh";

export function CoursesView() {
  const queryClient = useQueryClient();

  return (
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: queryKeys.courses })}>
      <div className="flex flex-col gap-4">
        <AddCourseToggle />
        <CoursesList />
      </div>
    </PullToRefresh>
  );
}
