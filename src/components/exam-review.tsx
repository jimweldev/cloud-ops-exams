import type { ExamData } from "@/types/exam"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle } from "lucide-react"

interface ExamReviewProps {
  exam: ExamData
  onBack: () => void
}

export function ExamReview({ exam, onBack }: ExamReviewProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-base font-bold tracking-tight sm:text-xl">
            {exam.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Review all {exam.questions.length} questions
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {exam.questions.map((q) => {
          const isMultiple = q.correctAnswers.length > 1
          return (
            <Card key={q.number}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    Q{q.number}
                  </Badge>
                  <CardTitle className="text-sm font-medium leading-relaxed">
                    {q.question}
                  </CardTitle>
                </div>
                {isMultiple && (
                  <Badge variant="secondary" className="w-fit">
                    Select {q.correctAnswers.length}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {q.choices.map((choice, i) => {
                    const isCorrect = q.correctAnswers.includes(choice)
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm sm:p-3 ${
                          isCorrect
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-border"
                        }`}
                      >
                        <span className="mt-px shrink-0 font-mono text-xs text-muted-foreground">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="flex-1">{choice}</span>
                        {isCorrect && (
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Explanation
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {q.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
