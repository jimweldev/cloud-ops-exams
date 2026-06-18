import { useState, useCallback, useMemo, useEffect } from "react"
import type { ExamData } from "@/types/exam"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home,
  Lightbulb,
  Shuffle,
  Play,
} from "lucide-react"

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Estimate how long a human needs to read a block of text.
// ~200 wpm reading speed → ~300ms per word, clamped to a sane range.
function readingDelayMs(text: string, minMs: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.min(Math.max(words * 300, minMs), 15000)
}

interface ExamSessionProps {
  exam: ExamData
  onBack: () => void
}

export function ExamSession({ exam, onBack }: ExamSessionProps) {
  const [randomize, setRandomize] = useState(false)
  const [showSimplified, setShowSimplified] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Map<number, Set<string>>
  >(new Map())
  const [submittedQuestions, setSubmittedQuestions] = useState<
    Map<number, boolean>
  >(new Map())
  const [sessionKey, setSessionKey] = useState(0)
  const [retakeIndices, setRetakeIndices] = useState<number[] | null>(null)

  const { questionOrder, choiceOrders } = useMemo(() => {
    const indices = retakeIndices ?? exam.questions.map((_, i) => i)
    const qOrder = randomize ? shuffleArray(indices) : indices

    const cOrders = new Map<number, number[]>()
    for (const q of exam.questions) {
      const cIndices = q.choices.map((_, i) => i)
      cOrders.set(q.number, randomize ? shuffleArray(cIndices) : cIndices)
    }

    return { questionOrder: qOrder, choiceOrders: cOrders }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, randomize, sessionKey, retakeIndices])

  const currentQuestionIdx = questionOrder[currentIndex]
  const currentQuestion = exam.questions[currentQuestionIdx]
  const totalQuestions = questionOrder.length
  const isMultipleAnswer = currentQuestion.correctAnswers.length > 1

  const currentSelected =
    selectedAnswers.get(currentQuestion.number) || new Set()
  const isSubmitted = submittedQuestions.has(currentQuestion.number)
  const isCorrect = submittedQuestions.get(currentQuestion.number) ?? false

  const score = useMemo(() => {
    let correct = 0
    submittedQuestions.forEach((val) => {
      if (val) correct++
    })
    return correct
  }, [submittedQuestions])

  const totalAnswered = submittedQuestions.size

  const handleToggleChoice = useCallback(
    (choiceText: string) => {
      if (isSubmitted) return

      setSelectedAnswers((prev) => {
        const next = new Map(prev)
        const current = new Set(prev.get(currentQuestion.number) || [])

        if (isMultipleAnswer) {
          if (current.has(choiceText)) {
            current.delete(choiceText)
          } else {
            current.add(choiceText)
          }
        } else {
          current.clear()
          current.add(choiceText)
        }

        next.set(currentQuestion.number, current)
        return next
      })
    },
    [currentQuestion, isMultipleAnswer, isSubmitted]
  )

  const handleSubmit = useCallback(() => {
    if (currentSelected.size === 0) return

    const selectedArray = Array.from(currentSelected)
    const correctAnswers = currentQuestion.correctAnswers

    const correct =
      selectedArray.length === correctAnswers.length &&
      selectedArray.every((a) => correctAnswers.includes(a))

    setSubmittedQuestions((prev) => {
      const next = new Map(prev)
      next.set(currentQuestion.number, correct)
      return next
    })
  }, [currentSelected, currentQuestion])

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, totalQuestions])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setSelectedAnswers(new Map())
    setSubmittedQuestions(new Map())
    setRetakeIndices(null)
    setSessionKey((k) => k + 1)
  }, [])

  const handleRetakeIncorrect = useCallback(() => {
    const incorrectIndices: number[] = []
    submittedQuestions.forEach((correct, questionNumber) => {
      if (!correct) {
        const idx = exam.questions.findIndex((q) => q.number === questionNumber)
        if (idx !== -1) incorrectIndices.push(idx)
      }
    })
    setRetakeIndices(incorrectIndices)
    setCurrentIndex(0)
    setSelectedAnswers(new Map())
    setSubmittedQuestions(new Map())
    setSessionKey((k) => k + 1)
  }, [submittedQuestions, exam.questions])

  const handleRandomizeChange = useCallback((checked: boolean) => {
    setRandomize(checked)
    setCurrentIndex(0)
    setSelectedAnswers(new Map())
    setSubmittedQuestions(new Map())
    setRetakeIndices(null)
    setSessionKey((k) => k + 1)
  }, [])

  // Auto mode: fill in the correct answer(s) and mark the question submitted.
  const autoSubmit = useCallback(() => {
    const correctAnswers = currentQuestion.correctAnswers
    setSelectedAnswers((prev) => {
      const next = new Map(prev)
      next.set(currentQuestion.number, new Set(correctAnswers))
      return next
    })
    setSubmittedQuestions((prev) => {
      const next = new Map(prev)
      next.set(currentQuestion.number, true)
      return next
    })
  }, [currentQuestion])

  // Auto mode driver: read the question → answer → read the explanation → next.
  useEffect(() => {
    if (!autoMode || totalAnswered === totalQuestions) return

    if (!isSubmitted) {
      // Phase 1: give time to read the question + choices, then answer.
      const qText =
        showSimplified && currentQuestion.simplifiedQuestion
          ? currentQuestion.simplifiedQuestion
          : currentQuestion.question
      const text = `${qText} ${currentQuestion.choices.join(" ")}`
      const timer = setTimeout(autoSubmit, readingDelayMs(text, 3000))
      return () => clearTimeout(timer)
    }

    // Phase 2: question is answered. Read the explanation, then advance.
    if (currentIndex < totalQuestions - 1) {
      const timer = setTimeout(
        handleNext,
        readingDelayMs(currentQuestion.explanation, 2500)
      )
      return () => clearTimeout(timer)
    }
  }, [
    autoMode,
    isSubmitted,
    totalAnswered,
    currentIndex,
    totalQuestions,
    currentQuestion,
    showSimplified,
    autoSubmit,
    handleNext,
  ])

  const choiceOrder =
    choiceOrders.get(currentQuestion.number) ||
    currentQuestion.choices.map((_, i) => i)
  const orderedChoices = choiceOrder.map((i) => currentQuestion.choices[i])

  const isFinished = totalAnswered === totalQuestions

  const displayQuestion =
    showSimplified && currentQuestion.simplifiedQuestion
      ? currentQuestion.simplifiedQuestion
      : currentQuestion.question

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {/* Top bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <Home />
            </Button>
            <span className="text-sm text-muted-foreground">
              Score: {score}/{totalAnswered}
              {totalAnswered > 0 && (
                <span className="ml-1">
                  ({Math.round((score / totalAnswered) * 100)}%)
                </span>
              )}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRestart}>
            <RotateCcw data-icon="inline-start" />
            Restart
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id="randomize"
              checked={randomize}
              onCheckedChange={handleRandomizeChange}
            />
            <Label
              htmlFor="randomize"
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <Shuffle className="size-3.5" />
              Randomize
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="simplified"
              checked={showSimplified}
              onCheckedChange={setShowSimplified}
            />
            <Label
              htmlFor="simplified"
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <Lightbulb className="size-3.5" />
              Simplified
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="auto" checked={autoMode} onCheckedChange={setAutoMode} />
            <Label
              htmlFor="auto"
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <Play className="size-3.5" />
              Auto
            </Label>
          </div>
        </div>
      </div>

      {/* Finished Summary */}
      {isFinished && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {score}/{totalQuestions}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You scored {Math.round((score / totalQuestions) * 100)}% -{" "}
                {score / totalQuestions >= 0.8
                  ? "Great job!"
                  : score / totalQuestions >= 0.6
                    ? "Good effort, keep studying!"
                    : "Keep practicing!"}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={handleRestart}>
                  <RotateCcw data-icon="inline-start" />
                  Try Again
                </Button>
                {score < totalQuestions && (
                  <Button variant="outline" onClick={handleRetakeIncorrect}>
                    <RotateCcw data-icon="inline-start" />
                    Retake Incorrect ({totalQuestions - score})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question text — flat, no card */}
      <div className="space-y-2">
        <h2 className="text-lg leading-relaxed font-semibold">
          {displayQuestion}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isMultipleAnswer
            ? `Select ${currentQuestion.correctAnswers.length} answers`
            : "Select one answer"}
        </p>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {orderedChoices.map((choice, i) => (
          <ChoiceButton
            key={i}
            choiceText={choice}
            isMultiple={isMultipleAnswer}
            isSelected={currentSelected.has(choice)}
            isSubmitted={isSubmitted}
            isCorrectChoice={currentQuestion.correctAnswers.includes(choice)}
            onClick={() => handleToggleChoice(choice)}
          />
        ))}
      </div>

      {/* Feedback after submit */}
      {isSubmitted && (
        <div
          className={`rounded-xl border p-4 ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            {isCorrect ? (
              <>
                <CheckCircle className="size-4 text-green-500" />
                <span className="text-green-700 dark:text-green-400">
                  Correct!
                </span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-destructive" />
                <span className="text-destructive">Incorrect</span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Navigation row: Previous | Submit Answer | Next */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft data-icon="inline-start" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {!isSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={currentSelected.size === 0}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Submit Answer
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1}
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <Separator />

      {/* Numbered question grid */}
      <div className="flex flex-wrap gap-2">
        {questionOrder.map((qIdx, i) => {
          const q = exam.questions[qIdx]
          const isCurrent = i === currentIndex
          const answered = submittedQuestions.has(q.number)
          const wasCorrect = submittedQuestions.get(q.number)

          let style =
            "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
          if (isCurrent && answered) {
            style = wasCorrect
              ? "ring-2 ring-primary bg-green-600 text-white font-bold"
              : "ring-2 ring-primary bg-destructive text-white font-bold"
          } else if (isCurrent) {
            style = "ring-2 ring-primary bg-muted text-foreground font-bold"
          } else if (answered) {
            style = wasCorrect
              ? "bg-green-600 text-white"
              : "bg-destructive text-white"
          }

          return (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`flex size-8 items-center justify-center rounded-full text-xs transition-colors sm:size-9 ${style}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChoiceButton({
  choiceText,
  isMultiple,
  isSelected,
  isSubmitted,
  isCorrectChoice,
  onClick,
}: {
  choiceText: string
  isMultiple: boolean
  isSelected: boolean
  isSubmitted: boolean
  isCorrectChoice: boolean
  onClick: () => void
}) {
  let ringStyle = "border-border hover:border-muted-foreground/40"
  let indicatorOuter = "border-muted-foreground/40"
  let indicatorInner = ""

  if (isSubmitted) {
    if (isCorrectChoice) {
      ringStyle = "border-green-500/50 bg-green-500/5"
      indicatorOuter = "border-green-500 bg-green-500"
      indicatorInner = "bg-white"
    } else if (isSelected && !isCorrectChoice) {
      ringStyle = "border-destructive/50 bg-destructive/5"
      indicatorOuter = "border-destructive bg-destructive"
      indicatorInner = "bg-white"
    } else {
      ringStyle = "border-border opacity-50"
    }
  } else if (isSelected) {
    ringStyle = "border-primary"
    indicatorOuter = "border-primary bg-primary"
    indicatorInner = "bg-white"
  }

  return (
    <button
      onClick={onClick}
      disabled={isSubmitted}
      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors sm:gap-4 sm:p-4 ${ringStyle} ${!isSubmitted ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Radio / Checkbox indicator */}
      <span
        className={`flex size-5 shrink-0 items-center justify-center border-2 ${isMultiple ? "rounded-sm" : "rounded-full"} ${indicatorOuter}`}
      >
        {(isSelected || (isSubmitted && isCorrectChoice)) && (
          <span
            className={`block ${isMultiple ? "size-2.5 rounded-[1px]" : "size-2 rounded-full"} ${indicatorInner}`}
          />
        )}
      </span>

      <span className="flex-1 text-sm">{choiceText}</span>

      {isSubmitted && isCorrectChoice && (
        <CheckCircle className="size-5 shrink-0 text-green-500" />
      )}
      {isSubmitted && isSelected && !isCorrectChoice && (
        <XCircle className="size-5 shrink-0 text-destructive" />
      )}
    </button>
  )
}
