import type { ExamData } from "@/types/exam"

const examModules = import.meta.glob("/docs/exams/*.json", {
  import: "default",
  eager: true,
}) as Record<string, ExamData>

export function loadExams(): ExamData[] {
  return Object.values(examModules)
    .filter(
      (exam): exam is ExamData =>
        !!exam && typeof exam.title === "string" && Array.isArray(exam.questions)
    )
    .sort((a, b) => a.title.localeCompare(b.title))
}
