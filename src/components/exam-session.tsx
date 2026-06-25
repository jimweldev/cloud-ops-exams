import { useState, useCallback, useMemo, useEffect } from "react"
import type { ExamData } from "@/types/exam"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Toggle } from "@/components/ui/toggle"
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
  Flame,
  Copy,
  Check,
  BookOpen,
  Highlighter,
  Eraser,
} from "lucide-react"

// Highlighter color classes (full static strings so Tailwind keeps them).
const HIGHLIGHT_LIT = "bg-sky-200 dark:bg-sky-300/85 dark:text-sky-950"
const HIGHLIGHT_HOVER = "hover:bg-sky-200/60 dark:hover:bg-sky-300/30"

const EMPTY_HIGHLIGHTS: ReadonlySet<string> = new Set()

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface ExamSessionProps {
  exam: ExamData
  onBack: () => void
}

export function ExamSession({ exam, onBack }: ExamSessionProps) {
  const [randomize, setRandomize] = useState(false)
  const [showSimplified, setShowSimplified] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [highlightMode, setHighlightMode] = useState(false)
  // Per-question highlights. Keyed by question number; each value is a set of
  // token keys like "q:3" (4th word in the question) or "c1:5" (6th word in the
  // choice with original index 1).
  const [highlights, setHighlights] = useState<Map<number, Set<string>>>(
    new Map()
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Map<number, Set<string>>
  >(new Map())
  const [submittedQuestions, setSubmittedQuestions] = useState<
    Map<number, boolean>
  >(new Map())
  const [sessionKey, setSessionKey] = useState(0)
  const [retakeIndices, setRetakeIndices] = useState<number[] | null>(null)
  const [reviewList, setReviewList] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState<"review" | "incorrect" | null>(null)

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
  const inReviewList = reviewList.has(currentQuestion.number)
  const currentHighlights =
    highlights.get(currentQuestion.number) ?? EMPTY_HIGHLIGHTS

  // For multiple-answer questions, require the exact number of selections
  // before the answer can be submitted.
  const canSubmit = isMultipleAnswer
    ? currentSelected.size === currentQuestion.correctAnswers.length
    : currentSelected.size === 1

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

  const toggleHighlight = useCallback(
    (key: string) => {
      setHighlights((prev) => {
        const next = new Map(prev)
        const set = new Set(next.get(currentQuestion.number) ?? [])
        if (set.has(key)) {
          set.delete(key)
        } else {
          set.add(key)
        }
        if (set.size === 0) {
          next.delete(currentQuestion.number)
        } else {
          next.set(currentQuestion.number, set)
        }
        return next
      })
    },
    [currentQuestion.number]
  )

  const clearHighlights = useCallback(() => {
    setHighlights((prev) => {
      if (!prev.has(currentQuestion.number)) return prev
      const next = new Map(prev)
      next.delete(currentQuestion.number)
      return next
    })
  }, [currentQuestion.number])

  const handleToggleReview = useCallback(
    (pressed: boolean) => {
      setReviewList((prev) => {
        const next = new Set(prev)
        if (pressed) {
          next.add(currentQuestion.number)
        } else {
          next.delete(currentQuestion.number)
        }
        return next
      })
    },
    [currentQuestion]
  )

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1)
      setShowExplanation(false)
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
    setReviewList(new Set())
    setHighlights(new Map())
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
    setHighlights(new Map())
    setSessionKey((k) => k + 1)
  }, [submittedQuestions, exam.questions])

  const handleRandomizeChange = useCallback((checked: boolean) => {
    setRandomize(checked)
    setCurrentIndex(0)
    setSelectedAnswers(new Map())
    setSubmittedQuestions(new Map())
    setRetakeIndices(null)
    setReviewList(new Set())
    setHighlights(new Map())
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

  // Auto mode step: reveal the answer, then advance to the next question.
  // Driven by the spacebar (desktop) or the Continue button (mobile/tap).
  const handleAutoAdvance = useCallback(() => {
    if (!isSubmitted) {
      // Phase 1: reveal the correct answer for the current question.
      autoSubmit()
    } else if (currentIndex < totalQuestions - 1) {
      // Phase 2: question is answered. Advance to the next question.
      handleNext()
    }
  }, [isSubmitted, currentIndex, totalQuestions, autoSubmit, handleNext])

  // Spacebar advances the current auto step.
  useEffect(() => {
    if (!autoMode || totalAnswered === totalQuestions) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return
      }
      e.preventDefault()
      handleAutoAdvance()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [autoMode, totalAnswered, totalQuestions, handleAutoAdvance])

  // "H" toggles highlight mode (ignoring modifier combos and text fields).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "h" && e.key !== "H") return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return
      }
      e.preventDefault()
      setHighlightMode((m) => !m)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const choiceOrder =
    choiceOrders.get(currentQuestion.number) ||
    currentQuestion.choices.map((_, i) => i)
  const orderedChoices = choiceOrder.map((i) => currentQuestion.choices[i])

  const isFinished = totalAnswered === totalQuestions

  const reviewQuestions = useMemo(() => {
    return exam.questions.filter((q) => reviewList.has(q.number))
  }, [exam.questions, reviewList])

  const incorrectQuestions = useMemo(() => {
    return exam.questions.filter((q) => submittedQuestions.get(q.number) === false)
  }, [exam.questions, submittedQuestions])

  const buildPrompt = useCallback(
    (intro: string, questions: ExamData["questions"]) => {
      const body = questions
        .map((q, i) => {
          const choices = q.choices.map((c) => `- ${c}`).join("\n")
          const answers = q.correctAnswers.map((a) => `- ${a}`).join("\n")
          return (
            `### Question ${i + 1} (original #${q.number})\n` +
            `${q.question}\n\n` +
            `Choices:\n${choices}\n\n` +
            `Correct answer(s):\n${answers}\n\n` +
            `Provided explanation: ${q.explanation}`
          )
        })
        .join("\n\n---\n\n")

      return (
        `${intro}\n\nExam: ${exam.title}\n\n` + body
      )
    },
    [exam.title]
  )

  const handleCopyPrompt = useCallback(
    async (which: "review" | "incorrect") => {
      const text =
        which === "review"
          ? buildPrompt(
              `I'm studying for the AWS Certified CloudOps exam and flagged these questions for review. ` +
                `For each one, please review and explain the correct answer in simple terms, ` +
                `clarify why the other options are wrong, and share any tips or related concepts ` +
                `I should remember.`,
              reviewQuestions
            )
          : buildPrompt(
              `I'm studying for the AWS Certified CloudOps exam and got these questions wrong. ` +
                `For each one, please explain why the correct answer is right and why I likely ` +
                `picked the wrong option, in simple terms, plus any tips or related concepts ` +
                `I should remember.`,
              incorrectQuestions
            )
      try {
        await navigator.clipboard.writeText(text)
        setCopied(which)
        setTimeout(() => setCopied(null), 2000)
      } catch {
        setCopied(null)
      }
    },
    [buildPrompt, reviewQuestions, incorrectQuestions]
  )

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
            <Switch
              id="auto"
              checked={autoMode}
              onCheckedChange={setAutoMode}
            />
            <Label
              htmlFor="auto"
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <Play className="size-3.5" />
              Auto
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="highlight"
              checked={highlightMode}
              onCheckedChange={setHighlightMode}
            />
            <Label
              htmlFor="highlight"
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <Highlighter className="size-3.5" />
              Highlight
              <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-xs sm:inline">
                H
              </kbd>
            </Label>
          </div>
          {autoMode && !isFinished && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAutoAdvance}>
                {isSubmitted ? "Next Question" : "Reveal Answer"}
                <ArrowRight data-icon="inline-end" />
              </Button>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                or press{" "}
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  Space
                </kbd>
              </span>
            </div>
          )}
        </div>
        {highlightMode && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Highlighter className="size-3.5 text-sky-600 dark:text-sky-400" />
              Tap words in the question or choices to highlight. Turn off to
              answer.
            </span>
            {currentHighlights.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={clearHighlights}
              >
                <Eraser data-icon="inline-start" />
                Clear
              </Button>
            )}
          </div>
        )}
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

            {incorrectQuestions.length > 0 && (
              <div className="mt-6 border-t border-border/50 pt-6 text-left">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                    <XCircle className="size-4 text-destructive" />
                    Incorrect questions ({incorrectQuestions.length})
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => handleCopyPrompt("incorrect")}
                  >
                    {copied === "incorrect" ? (
                      <Check data-icon="inline-start" />
                    ) : (
                      <Copy data-icon="inline-start" />
                    )}
                    {copied === "incorrect"
                      ? "Copied!"
                      : "Copy incorrect prompt"}
                  </Button>
                </div>
                <ol className="space-y-1.5 text-sm text-muted-foreground">
                  {incorrectQuestions.map((q) => (
                    <li key={q.number} className="flex gap-2">
                      <span className="shrink-0 font-medium text-foreground">
                        #{q.number}
                      </span>
                      <span className="line-clamp-2">{q.question}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {reviewQuestions.length > 0 && (
              <div className="mt-6 border-t border-border/50 pt-6 text-left">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                    <Flame className="size-4 text-orange-500" />
                    Review list ({reviewQuestions.length})
                  </h3>
                  <Button size="sm" onClick={() => handleCopyPrompt("review")}>
                    {copied === "review" ? (
                      <Check data-icon="inline-start" />
                    ) : (
                      <Copy data-icon="inline-start" />
                    )}
                    {copied === "review" ? "Copied!" : "Copy review prompt"}
                  </Button>
                </div>
                <ol className="space-y-1.5 text-sm text-muted-foreground">
                  {reviewQuestions.map((q) => (
                    <li key={q.number} className="flex gap-2">
                      <span className="shrink-0 font-medium text-foreground">
                        #{q.number}
                      </span>
                      <span className="line-clamp-2">{q.question}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question text — flat, no card */}
      <div className="space-y-2">
        <RichText
          text={displayQuestion}
          proseClassName="text-lg leading-relaxed font-semibold"
          fieldKey="q"
          highlights={currentHighlights}
          highlightMode={highlightMode}
          onToggleHighlight={toggleHighlight}
        />
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
            fieldKey={`c${choiceOrder[i]}`}
            highlights={currentHighlights}
            highlightMode={highlightMode}
            onToggleHighlight={toggleHighlight}
          />
        ))}
      </div>

      {/* Feedback after submit */}
      {isSubmitted && (
        <div
          className={`rounded-xl border p-4 ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
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
            <Toggle
              variant="outline"
              size="sm"
              pressed={showExplanation}
              onPressedChange={setShowExplanation}
            >
              <BookOpen data-icon="inline-start" />
              Explanation
            </Toggle>
          </div>
          {showExplanation && (
            <div className="space-y-2">
              <RichText
                text={currentQuestion.explanation}
                proseClassName="text-sm leading-relaxed text-muted-foreground"
              />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
            <Toggle
              variant="outline"
              size="sm"
              pressed={inReviewList}
              onPressedChange={handleToggleReview}
              className="aria-pressed:bg-orange-600 aria-pressed:text-white"
            >
              <Flame data-icon="inline-start" />
              {inReviewList ? "Added to review" : "Add to review"}
            </Toggle>
          </div>
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
            disabled={!canSubmit}
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

/**
 * Find the index of the bracket that closes the one at `start`, or -1 if the
 * region isn't balanced. Quotes (and their escapes) are skipped so braces
 * inside JSON string values don't throw off the depth count.
 */
function findBalancedEnd(s: string, start: number): number {
  let depth = 0
  let inStr = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (c === "\\") i++
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === "{" || c === "[") depth++
    else if (c === "}" || c === "]") {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * Split text into prose and code segments. Any embedded JSON object/array —
 * whether it sits on its own or inline after some prose (e.g. "Use this
 * policy: {…}") — is pulled out and rendered as a pretty-printed code block;
 * the rest stays prose. Used by questions, choices, and explanations so
 * policy/JSON snippets don't render as a collapsed wall of text.
 */
function parseRichSegments(text: string): { code: boolean; text: string }[] {
  const segments: { code: boolean; text: string }[] = []
  for (const para of text.split(/\n{2,}/)) {
    let rest = para
    let prose = ""
    while (rest.length) {
      const idx = rest.search(/[[{]/)
      if (idx === -1) {
        prose += rest
        break
      }
      const end = findBalancedEnd(rest, idx)
      let pretty: string | null = null
      if (end !== -1) {
        try {
          const parsed = JSON.parse(rest.slice(idx, end + 1))
          const size = Array.isArray(parsed)
            ? parsed.length
            : parsed && typeof parsed === "object"
              ? Object.keys(parsed).length
              : 0
          if (size > 0) pretty = JSON.stringify(parsed, null, 2)
        } catch {
          /* not valid JSON — leave the bracket in the prose */
        }
      }
      if (pretty === null) {
        prose += rest.slice(0, idx + 1)
        rest = rest.slice(idx + 1)
        continue
      }
      prose += rest.slice(0, idx)
      if (prose.trim()) segments.push({ code: false, text: prose.trim() })
      prose = ""
      segments.push({ code: true, text: pretty })
      rest = rest.slice(end + 1)
    }
    if (prose.trim()) segments.push({ code: false, text: prose.trim() })
  }
  return segments
}

/**
 * Render a prose paragraph as highlightable word tokens. `nextWord` is a
 * mutable counter (shared across all prose segments of one field) so each word
 * gets a stable global index — the key under which its highlight is stored.
 * Whitespace tokens carry no index but render highlighted when they sit between
 * two highlighted words, so a multi-word phrase reads as one continuous mark.
 */
function renderProseTokens(
  text: string,
  fieldKey: string,
  highlights: ReadonlySet<string>,
  highlightMode: boolean,
  onToggleHighlight: (key: string) => void,
  nextWord: { i: number }
) {
  const tokens = text.match(/\S+|\s+/g) ?? [text]
  // First pass: assign a key to each word token and record highlight state.
  const meta = tokens.map((tok) => {
    if (/\S/.test(tok)) {
      const key = `${fieldKey}:${nextWord.i++}`
      return { tok, key, lit: highlights.has(key) }
    }
    return { tok, key: null as string | null, lit: false }
  })

  // A token is "lit" if it's a highlighted word, or whitespace bridging two
  // highlighted words — so an adjacent run renders as one continuous bar.
  const litAt = (i: number): boolean => {
    if (i < 0 || i >= meta.length) return false
    const m = meta[i]
    if (m.key !== null) return m.lit
    return Boolean(meta[i - 1]?.lit && meta[i + 1]?.lit)
  }

  return meta.map((m, ti) => {
    const lit = litAt(ti)
    // Round only the outer edges of a run; keep interior seams square so a
    // multi-word phrase looks like a single highlight, not a row of pills.
    const classes: string[] = []
    if (lit) {
      classes.push(HIGHLIGHT_LIT)
      if (!litAt(ti - 1)) classes.push("rounded-l-sm")
      if (!litAt(ti + 1)) classes.push("rounded-r-sm")
    }
    if (m.key !== null && highlightMode) {
      classes.push("cursor-pointer")
      if (!lit) classes.push(`rounded-sm ${HIGHLIGHT_HOVER}`)
    }

    const key = m.key
    return (
      <span
        key={ti}
        onClick={
          key !== null && highlightMode
            ? (e) => {
                e.stopPropagation()
                onToggleHighlight(key)
              }
            : undefined
        }
        className={classes.join(" ") || undefined}
      >
        {m.tok}
      </span>
    )
  })
}

function RichText({
  text,
  proseClassName,
  fieldKey,
  highlights = EMPTY_HIGHLIGHTS,
  highlightMode = false,
  onToggleHighlight,
}: {
  text: string
  proseClassName?: string
  fieldKey?: string
  highlights?: ReadonlySet<string>
  highlightMode?: boolean
  onToggleHighlight?: (key: string) => void
}) {
  const segments = useMemo(() => parseRichSegments(text), [text])
  const highlightable = Boolean(fieldKey && onToggleHighlight)
  // Shared word counter across this field's prose segments.
  const nextWord = { i: 0 }
  return (
    <>
      {segments.map((seg, i) =>
        seg.code ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed whitespace-pre"
          >
            {seg.text}
          </pre>
        ) : (
          <p key={i} className={proseClassName}>
            {highlightable
              ? renderProseTokens(
                  seg.text,
                  fieldKey as string,
                  highlights,
                  highlightMode,
                  onToggleHighlight as (key: string) => void,
                  nextWord
                )
              : seg.text}
          </p>
        ),
      )}
    </>
  )
}

function ChoiceButton({
  choiceText,
  isMultiple,
  isSelected,
  isSubmitted,
  isCorrectChoice,
  onClick,
  fieldKey,
  highlights,
  highlightMode,
  onToggleHighlight,
}: {
  choiceText: string
  isMultiple: boolean
  isSelected: boolean
  isSubmitted: boolean
  isCorrectChoice: boolean
  onClick: () => void
  fieldKey: string
  highlights: ReadonlySet<string>
  highlightMode: boolean
  onToggleHighlight: (key: string) => void
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

  const cursor = highlightMode
    ? "cursor-default"
    : !isSubmitted
      ? "cursor-pointer"
      : "cursor-default"

  return (
    <button
      // In highlight mode the row never selects an answer — taps land on the
      // word spans inside. Keep it enabled even after submit so highlighting
      // still works while reviewing the answer.
      onClick={highlightMode ? undefined : onClick}
      disabled={isSubmitted && !highlightMode}
      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors sm:gap-4 sm:p-4 ${ringStyle} ${cursor}`}
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

      <div className="min-w-0 flex-1 space-y-1.5 text-sm">
        <RichText
          text={choiceText}
          fieldKey={fieldKey}
          highlights={highlights}
          highlightMode={highlightMode}
          onToggleHighlight={onToggleHighlight}
        />
      </div>

      {isSubmitted && isCorrectChoice && (
        <CheckCircle className="size-5 shrink-0 text-green-500" />
      )}
      {isSubmitted && isSelected && !isCorrectChoice && (
        <XCircle className="size-5 shrink-0 text-destructive" />
      )}
    </button>
  )
}
