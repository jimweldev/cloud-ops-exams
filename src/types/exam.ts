export interface ExamQuestion {
  number: number
  question: string
  simplifiedQuestion: string
  choices: string[]
  correctAnswers: string[]
  explanation: string
}

export interface ExamService {
  name: string
  keywords: string[]
}

export interface ExamData {
  id: string
  title: string
  services?: ExamService[]
  questions: ExamQuestion[]
}
