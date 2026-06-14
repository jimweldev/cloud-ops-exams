import type { ExamData } from "@/types/exam"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play, Layers, FileText } from "lucide-react"
import { getReviewerContent } from "@/lib/reviewer-data"

interface ExamSelectProps {
  exams: ExamData[]
  onStartExam: (examId: string) => void
  onReviewExam: (examId: string) => void
  onViewServices: (examId: string) => void
  onViewReviewer: (examId: string) => void
}

export function ExamSelect({
  exams,
  onStartExam,
  onReviewExam,
  onViewServices,
  onViewReviewer,
}: ExamSelectProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          AWS Cloud Ops Exams
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select an exam to review or start practicing.
        </p>
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-base">{exam.title}</CardTitle>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {exam.questions.length} questions
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReviewExam(exam.id)}
              >
                <BookOpen data-icon="inline-start" />
                Review
              </Button>
              {exam.services && exam.services.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewServices(exam.id)}
                >
                  <Layers data-icon="inline-start" />
                  Services
                </Button>
              )}
              {getReviewerContent(exam.id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewReviewer(exam.id)}
                >
                  <FileText data-icon="inline-start" />
                  Reviewer
                </Button>
              )}
              <Button size="sm" onClick={() => onStartExam(exam.id)}>
                <Play data-icon="inline-start" />
                Start Exam
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
