import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"

interface ExamReviewerProps {
  examTitle: string
  content: string
  onBack: () => void
}

export function ExamReviewer({ examTitle, content, onBack }: ExamReviewerProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quick Reviewer</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{examTitle}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mt-8 mb-1 text-xl font-bold tracking-tight first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-1 mb-3 text-sm font-semibold text-muted-foreground">
                {children}
              </h2>
            ),
            ul: ({ children }) => (
              <ul className="mb-6 space-y-1.5 pl-4">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-sm leading-relaxed list-disc marker:text-muted-foreground">
                {children}
              </li>
            ),
            hr: () => <hr className="my-6 border-border" />,
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            code: ({ children }) => (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                {children}
              </code>
            ),
            p: ({ children }) => (
              <p className="mb-2 text-sm leading-relaxed">{children}</p>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
