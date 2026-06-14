const reviewerModules = import.meta.glob("/docs/exams/*-reviewer.md", {
  query: "?raw",
  eager: true,
}) as Record<string, { default: string }>

export function getReviewerContent(examId: string): string | null {
  const key = `/docs/exams/${examId}-reviewer.md`
  return reviewerModules[key]?.default ?? null
}
