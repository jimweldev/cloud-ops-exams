import { useMemo } from "react"
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useParams,
} from "react-router"
import { loadExams } from "@/lib/exam-data"
import { ExamSelect } from "@/components/exam-select"
import { ExamReview } from "@/components/exam-review"
import { ExamSession } from "@/components/exam-session"
import { ExamServices } from "@/components/exam-services"

function Layout() {
  return (
    <div className="min-h-svh p-4 sm:p-6 md:p-8">
      <Outlet />
    </div>
  )
}

function ExamSelectPage() {
  const exams = useMemo(() => loadExams(), [])
  const navigate = useNavigate()
  return (
    <ExamSelect
      exams={exams}
      onStartExam={(id) => navigate(`/exams/${id}/session`)}
      onReviewExam={(id) => navigate(`/exams/${id}/review`)}
      onViewServices={(id) => navigate(`/exams/${id}/services`)}
    />
  )
}

function ExamReviewPage() {
  const { examId } = useParams()
  const exams = useMemo(() => loadExams(), [])
  const navigate = useNavigate()
  const exam = exams.find((e) => e.id === examId)
  if (!exam) return null
  return <ExamReview exam={exam} onBack={() => navigate("/")} />
}

function ExamSessionPage() {
  const { examId } = useParams()
  const exams = useMemo(() => loadExams(), [])
  const navigate = useNavigate()
  const exam = exams.find((e) => e.id === examId)
  if (!exam) return null
  return <ExamSession key={exam.id} exam={exam} onBack={() => navigate("/")} />
}

function ExamServicesPage() {
  const { examId } = useParams()
  const exams = useMemo(() => loadExams(), [])
  const navigate = useNavigate()
  const exam = exams.find((e) => e.id === examId)
  if (!exam) return null
  return <ExamServices exam={exam} onBack={() => navigate("/")} />
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <ExamSelectPage /> },
      { path: "/exams/:examId/review", element: <ExamReviewPage /> },
      { path: "/exams/:examId/session", element: <ExamSessionPage /> },
      { path: "/exams/:examId/services", element: <ExamServicesPage /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}

export default App
