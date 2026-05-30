import { useState, useMemo } from "react"
import { loadExams } from "@/lib/exam-data"
import { ExamSelect } from "@/components/exam-select"
import { ExamReview } from "@/components/exam-review"
import { ExamSession } from "@/components/exam-session"
import type { ExamData } from "@/types/exam"

type View =
  | { type: "select" }
  | { type: "review"; examId: string }
  | { type: "exam"; examId: string }

export function App() {
  const exams: ExamData[] = useMemo(() => loadExams(), [])
  const [view, setView] = useState<View>({ type: "select" })

  const currentExam =
    view.type !== "select"
      ? exams.find((e) => e.id === view.examId)
      : undefined

  return (
    <div className="min-h-svh p-4 sm:p-6 md:p-8">
      {view.type === "select" && (
        <ExamSelect
          exams={exams}
          onStartExam={(id) => setView({ type: "exam", examId: id })}
          onReviewExam={(id) => setView({ type: "review", examId: id })}
        />
      )}
      {view.type === "review" && currentExam && (
        <ExamReview
          exam={currentExam}
          onBack={() => setView({ type: "select" })}
        />
      )}
      {view.type === "exam" && currentExam && (
        <ExamSession
          key={currentExam.id}
          exam={currentExam}
          onBack={() => setView({ type: "select" })}
        />
      )}
    </div>
  )
}

export default App
