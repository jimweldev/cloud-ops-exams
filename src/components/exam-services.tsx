import type { ExamData } from "@/types/exam"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Layers } from "lucide-react"

interface ExamServicesProps {
  exam: ExamData
  onBack: () => void
}

export function ExamServices({ exam, onBack }: ExamServicesProps) {
  const services = exam.services ?? []

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services Reference</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {exam.title} — {services.length} services mentioned
        </p>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">No services data available for this exam.</p>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                  <CardTitle className="text-base">{service.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {service.keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-xs font-normal">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
