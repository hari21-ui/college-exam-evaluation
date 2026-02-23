import { computed, reactive, ref } from 'vue'

export type UploadStatus = 'uploading' | 'converting' | 'ready' | 'failed'
export type StudentStatus = 'available' | 'locked_by_me' | 'locked_by_other' | 'in_progress' | 'completed'

export interface UploadRow {
  id: string
  fileName: string
  pages: number
  studentId: string
  status: UploadStatus
  error?: string
  pdfUrl: string
  selected: boolean
}

export interface QuestionItem {
  id: number
  maxMarks: number
}

export interface StudentItem {
  id: string
  status: StudentStatus
  lockedBy?: string
  scores: Record<number, number | null>
}

const ME = 'You'

const uploadRows = ref<UploadRow[]>([])
const sampleMaxMarks = [4, 6, 8, 5, 7, 10, 3, 6, 5, 4, 9, 8, 2, 6, 7, 10, 4, 5, 8, 6]
const questionPaper = ref<QuestionItem[]>(sampleMaxMarks.map((maxMarks, i) => ({ id: i + 1, maxMarks })))
const students = ref<StudentItem[]>(
  Array.from({ length: 200 }, (_, i) => {
    const id = `STU${String(i + 1).padStart(4, '0')}`
    const scores = Object.fromEntries(questionPaper.value.map((q) => [q.id, null]))

    if (i % 18 === 0) {
      return { id, status: 'locked_by_other', lockedBy: i % 2 ? 'Evaluator A' : 'Evaluator B', scores }
    }

    if (i % 13 === 0) {
      for (const question of questionPaper.value) {
        scores[question.id] = Math.min(question.maxMarks, Math.floor(question.maxMarks * 0.7))
      }
      return { id, status: 'completed', scores }
    }

    return { id, status: 'available', scores }
  }),
)

const selectedStudentId = ref<string>('')
const filterStatus = ref<'all' | 'available' | 'locked_by_other' | 'in_progress' | 'completed'>('all')
const search = ref('')
const autosave = reactive({ state: 'Saved' as 'Saving...' | 'Saved' })

const selectedStudent = computed(() => students.value.find((student) => student.id === selectedStudentId.value))

const filteredStudents = computed(() =>
  students.value.filter((student) => {
    const searchMatch = student.id.toLowerCase().includes(search.value.toLowerCase())
    if (!searchMatch) return false

    if (filterStatus.value === 'all') return true
    if (filterStatus.value === 'locked_by_other') return student.status === 'locked_by_other'
    return student.status === filterStatus.value
  }),
)

function setSearch(query: string) {
  search.value = query
}

function setFilter(status: typeof filterStatus.value) {
  filterStatus.value = status
}

function openStudent(studentId: string) {
  const student = students.value.find((item) => item.id === studentId)
  if (!student) return

  if (student.status === 'available') {
    student.status = 'locked_by_me'
    student.lockedBy = ME
  } else if (student.status === 'in_progress') {
    student.status = 'locked_by_me'
    student.lockedBy = ME
  }

  selectedStudentId.value = student.id
}

let saveTimer: number | undefined
function setScore(questionId: number, score: number | null) {
  const student = selectedStudent.value
  if (!student || student.status === 'locked_by_other') return

  student.scores[questionId] = score

  if (student.status === 'locked_by_me') {
    student.status = 'in_progress'
    student.lockedBy = ME
  }

  autosave.state = 'Saving...'
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    window.setTimeout(() => {
      autosave.state = 'Saved'
    }, 400)
  }, 500)
}

function markComplete() {
  const student = selectedStudent.value
  if (!student || student.status === 'locked_by_other') return

  student.status = 'completed'
  delete student.lockedBy
  autosave.state = 'Saved'
}

function reopenForEdits() {
  const student = selectedStudent.value
  if (!student) return
  student.status = 'in_progress'
  student.lockedBy = ME
}

function addUploadRows(files: FileList) {
  const nextRows = Array.from(files).map<UploadRow>((file, index) => ({
    id: `${Date.now()}-${file.name}-${index}`,
    fileName: file.name,
    pages: Math.max(1, Math.ceil(file.size / 150000)),
    studentId: '',
    status: 'uploading',
    pdfUrl: '/sample.pdf',
    selected: false,
  }))
  uploadRows.value = [...nextRows, ...uploadRows.value]

  for (const row of nextRows) {
    window.setTimeout(() => {
      row.status = 'converting'
      window.setTimeout(() => {
        if (Math.random() < 0.15) {
          row.status = 'failed'
          row.error = 'Conversion failed'
          return
        }
        row.status = 'ready'
      }, 900)
    }, 600)
  }
}

function updateStudentId(rowId: string, value: string) {
  const row = uploadRows.value.find((item) => item.id === rowId)
  if (row) row.studentId = value.toUpperCase()
}

function retryUpload(rowId: string) {
  const row = uploadRows.value.find((item) => item.id === rowId)
  if (!row) return
  row.status = 'uploading'
  row.error = undefined
  window.setTimeout(() => {
    row.status = 'converting'
    window.setTimeout(() => {
      row.status = 'ready'
    }, 700)
  }, 500)
}

function removeUpload(rowId: string) {
  uploadRows.value = uploadRows.value.filter((item) => item.id !== rowId)
}

function removeSelectedUploads() {
  uploadRows.value = uploadRows.value.filter((item) => !item.selected)
}

const uploadCounters = computed(() => ({
  uploaded: uploadRows.value.length,
  converted: uploadRows.value.filter((item) => item.status === 'ready').length,
  missingIds: uploadRows.value.filter((item) => item.studentId.trim() === '').length,
  errors: uploadRows.value.filter((item) => item.status === 'failed').length,
}))

const duplicateIds = computed(() => {
  const counts: Record<string, number> = {}
  for (const row of uploadRows.value) {
    if (!row.studentId.trim()) continue
    counts[row.studentId] = (counts[row.studentId] || 0) + 1
  }
  return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([id]) => id))
})

const uploadErrors = computed(() => {
  const errors: Array<{ rowId: string; message: string }> = []
  for (const row of uploadRows.value) {
    if (!row.studentId.trim()) {
      errors.push({ rowId: row.id, message: `${row.fileName}: Student ID is mandatory` })
    }
    if (duplicateIds.value.has(row.studentId)) {
      errors.push({ rowId: row.id, message: `${row.fileName}: Duplicate Student ID ${row.studentId}` })
    }
    if (row.status === 'failed') {
      errors.push({ rowId: row.id, message: `${row.fileName}: Conversion failed` })
    }
  }
  return errors
})

export function useAssessmentStore() {
  return {
    uploadRows,
    uploadCounters,
    duplicateIds,
    uploadErrors,
    students,
    questionPaper,
    filteredStudents,
    selectedStudent,
    filterStatus,
    search,
    autosave,
    setSearch,
    setFilter,
    openStudent,
    setScore,
    markComplete,
    reopenForEdits,
    addUploadRows,
    updateStudentId,
    retryUpload,
    removeUpload,
    removeSelectedUploads,
  }
}
