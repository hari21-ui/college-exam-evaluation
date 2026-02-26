import { computed, reactive, ref, watch } from 'vue'

export type UploadStatus = 'uploading' | 'converting' | 'ready' | 'needs_id_check' | 'failed'
export type EvaluationStatus = 'available' | 'in_progress' | 'completed' | 'locked_by_me' | 'locked_by_other'
export type StudentIdErrorState = 'invalid_format' | 'duplicate_batch' | 'duplicate_system' | ''

export interface ScriptItem {
  id: string
  filename: string
  uploadStatus: UploadStatus
  evaluationStatus: EvaluationStatus
  studentId?: string
  pages?: number
  totalMarks?: number
  lastUpdated?: number
  exam: string
  batch: string
  stream: string
  subject: string
  selected: boolean
  studentError: StudentIdErrorState
}

export interface QuestionScore {
  questionNo: number
  maxMarks: number
  awardedMarks: number | null
}

interface StudentItem {
  id: string
  evaluationStatus: EvaluationStatus
  lockedBy?: string
  questions: QuestionScore[]
}

const STORAGE_KEY = 'assessment-admin-v2'
const ME = 'You'
const ID_PATTERN = /^[A-Z0-9]{6,20}$/

const sampleMaxMarks = [4, 6, 8, 5, 7, 10, 3, 6, 5, 4, 9, 8, 2, 6, 7, 10, 4, 5, 8, 6]
const questionPaper = ref(sampleMaxMarks.map((maxMarks, i) => ({ questionNo: i + 1, maxMarks })))

const filters = reactive({ exam: 'All', batch: 'All', stream: 'All', subject: 'All' })

const allScripts = ref<ScriptItem[]>([])
const students = ref<StudentItem[]>([])
const selectedStudentId = ref('')
const selectedScriptId = ref('')
const studentSearch = ref('')
const studentStatusFilter = ref<'all' | EvaluationStatus>('all')
const activeQuestionNo = ref(1)
const offlineMode = ref(false)
const showSystemDuplicateToast = ref(false)
const saveState = reactive({ visible: false, text: '' as 'Saving…' | 'Saved' | '' })

function createQuestions(): QuestionScore[] {
  return questionPaper.value.map((question) => ({
    questionNo: question.questionNo,
    maxMarks: question.maxMarks,
    awardedMarks: null,
  }))
}

function deterministicId(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return `ID${String(hash).slice(0, 8).padEnd(8, '7')}`
}

function seedData() {
  if (students.value.length) return

  students.value = Array.from({ length: 18 }, (_, i) => {
    const id = `STU${String(i + 1).padStart(4, '0')}`
    const questions = createQuestions()
    if (i % 7 === 0) {
      return { id, evaluationStatus: 'locked_by_other', lockedBy: 'Evaluator A', questions }
    }
    if (i % 5 === 0) {
      questions.forEach((q) => {
        q.awardedMarks = Math.min(q.maxMarks, Math.floor(q.maxMarks * 0.7))
      })
      return { id, evaluationStatus: 'completed', questions }
    }
    return { id, evaluationStatus: 'available', questions }
  })

  allScripts.value = students.value.slice(0, 8).map((student, i) => ({
    id: `seed-${i}`,
    filename: `script_${i + 1}.pdf`,
    uploadStatus: 'ready',
    evaluationStatus: student.evaluationStatus,
    studentId: student.id,
    pages: 8 + (i % 4),
    totalMarks: student.questions.reduce((acc, q) => acc + (q.awardedMarks ?? 0), 0),
    lastUpdated: Date.now() - i * 100000,
    exam: i % 2 === 0 ? 'Midterm 2026' : 'Final 2026',
    batch: i % 2 === 0 ? 'B.Tech CSE - Sem 4' : 'B.Tech CSE - Sem 6',
    stream: i % 2 === 0 ? 'CSE-A' : 'CSE-B',
    subject: i % 3 === 0 ? 'Mathematics' : 'Physics',
    selected: false,
    studentError: '',
  }))
}

function hydrate() {
  seedData()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as { scripts: ScriptItem[]; students: StudentItem[]; offlineMode: boolean }
    if (parsed.scripts?.length) allScripts.value = parsed.scripts
    if (parsed.students?.length) students.value = parsed.students
    offlineMode.value = Boolean(parsed.offlineMode)
  } catch {
    // ignore broken local storage
  }
}

watch(
  [allScripts, students, offlineMode],
  () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ scripts: allScripts.value, students: students.value, offlineMode: offlineMode.value }),
    )
  },
  { deep: true },
)

function applyUploadSimulation(script: ScriptItem) {
  window.setTimeout(() => {
    script.uploadStatus = 'converting'
    window.setTimeout(() => {
      if (Math.random() < 0.1) {
        script.uploadStatus = 'failed'
        return
      }
      script.uploadStatus = script.studentId ? 'ready' : 'needs_id_check'
    }, 700)
  }, 400)
}

function addUploadRows(files: FileList) {
  const rows = Array.from(files)
    .filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    .map((file, index) => {
      const newScript: ScriptItem = {
        id: `${Date.now()}-${index}`,
        filename: file.name,
        uploadStatus: 'uploading',
        evaluationStatus: 'available',
        studentId: deterministicId(file.name),
        pages: Math.max(1, Math.ceil(file.size / 180000)),
        totalMarks: 0,
        lastUpdated: Date.now(),
        exam: 'Midterm 2026',
        batch: 'B.Tech CSE - Sem 4',
        stream: 'CSE-A',
        subject: 'Mathematics',
        selected: false,
        studentError: '',
      }
      applyUploadSimulation(newScript)
      return newScript
    })

  allScripts.value = [...rows, ...allScripts.value]
}

function validateStudentId(value: string, scriptId: string, mode: 'blur' | 'submit') {
  const script = allScripts.value.find((item) => item.id === scriptId)
  if (!script) return ''

  const normalized = value.toUpperCase().trim()
  script.studentId = normalized

  if (!ID_PATTERN.test(normalized)) {
    script.studentError = 'invalid_format'
    return script.studentError
  }

  const duplicateBatch = allScripts.value.some((item) => item.id !== scriptId && item.studentId === normalized)
  if (duplicateBatch) {
    script.studentError = 'duplicate_batch'
    return script.studentError
  }

  if (mode === 'submit') {
    const duplicateSystem = students.value.some((student) => student.id === normalized)
    if (duplicateSystem) {
      script.studentError = 'duplicate_system'
      showSystemDuplicateToast.value = true
      window.setTimeout(() => {
        showSystemDuplicateToast.value = false
      }, 1800)
      return script.studentError
    }
  }

  script.studentError = ''
  script.uploadStatus = 'ready'
  return ''
}

let idDebounce: number | undefined
function scheduleStudentValidation(scriptId: string, value: string, mode: 'blur' | 'submit') {
  window.clearTimeout(idDebounce)
  idDebounce = window.setTimeout(() => {
    validateStudentId(value, scriptId, mode)
  }, 300)
}

function retryUpload(scriptId: string) {
  const script = allScripts.value.find((item) => item.id === scriptId)
  if (!script) return
  script.uploadStatus = 'uploading'
  script.lastUpdated = Date.now()
  applyUploadSimulation(script)
}

function removeUpload(scriptId: string) {
  allScripts.value = allScripts.value.filter((item) => item.id !== scriptId)
}

function removeSelectedUploads() {
  allScripts.value = allScripts.value.filter((item) => !item.selected)
}

const filterOptions = computed(() => ({
  exam: ['All', ...new Set(allScripts.value.map((item) => item.exam))],
  batch: ['All', ...new Set(allScripts.value.map((item) => item.batch))],
  stream: ['All', ...new Set(allScripts.value.map((item) => item.stream))],
  subject: ['All', ...new Set(allScripts.value.map((item) => item.subject))],
}))

const visibleScripts = computed(() =>
  allScripts.value.filter((item) => {
    if (filters.exam !== 'All' && item.exam !== filters.exam) return false
    if (filters.batch !== 'All' && item.batch !== filters.batch) return false
    if (filters.stream !== 'All' && item.stream !== filters.stream) return false
    if (filters.subject !== 'All' && item.subject !== filters.subject) return false
    return true
  }),
)

const uploadCounters = computed(() => ({
  uploaded: allScripts.value.length,
  converted: allScripts.value.filter((item) => item.uploadStatus === 'ready').length,
  missingIds: allScripts.value.filter((item) => !item.studentId || item.studentError).length,
  errors: allScripts.value.filter((item) => item.uploadStatus === 'failed').length,
}))

const selectedStudent = computed(() => students.value.find((student) => student.id === selectedStudentId.value))
const selectedScript = computed(() => allScripts.value.find((script) => script.id === selectedScriptId.value))

const filteredStudents = computed(() =>
  students.value.filter((student) => {
    if (studentStatusFilter.value !== 'all' && student.evaluationStatus !== studentStatusFilter.value) return false
    return student.id.toLowerCase().includes(studentSearch.value.toLowerCase())
  }),
)

function openStudent(studentId: string) {
  const student = students.value.find((item) => item.id === studentId)
  if (!student) return

  if (student.evaluationStatus === 'available' || student.evaluationStatus === 'in_progress') {
    student.evaluationStatus = 'locked_by_me'
    student.lockedBy = ME
  }

  selectedStudentId.value = studentId

  const linkedScript = allScripts.value.find((item) => item.studentId === studentId)
  if (linkedScript) selectedScriptId.value = linkedScript.id
}

function openScript(scriptId: string) {
  const script = allScripts.value.find((item) => item.id === scriptId)
  if (!script) return

  selectedScriptId.value = script.id
  if (script.studentId) openStudent(script.studentId)
}

function setActiveQuestion(questionNo: number) {
  activeQuestionNo.value = Math.max(1, Math.min(questionPaper.value.length, questionNo))
}

let saveTimer: number | undefined
function setScore(questionNo: number, score: number | null) {
  const student = selectedStudent.value
  if (!student || student.evaluationStatus === 'locked_by_other' || student.evaluationStatus === 'completed') return

  const question = student.questions.find((item) => item.questionNo === questionNo)
  if (!question) return

  question.awardedMarks = score
  if (student.evaluationStatus === 'locked_by_me') student.evaluationStatus = 'in_progress'

  if (offlineMode.value) return
  saveState.visible = true
  saveState.text = 'Saving…'
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveState.text = 'Saved'
    window.setTimeout(() => {
      saveState.visible = false
      saveState.text = ''
    }, 1500)
  }, 500)
}

function markCompleted() {
  const student = selectedStudent.value
  if (!student || student.evaluationStatus === 'locked_by_other') return

  student.evaluationStatus = 'completed'
  student.lockedBy = undefined

  const script = allScripts.value.find((item) => item.studentId === student.id)
  if (script) {
    script.evaluationStatus = 'completed'
    script.totalMarks = student.questions.reduce((acc, q) => acc + (q.awardedMarks ?? 0), 0)
    script.lastUpdated = Date.now()
  }
}

function setFilter(key: keyof typeof filters, value: string) {
  filters[key] = value
}

hydrate()

export function useAssessmentStore() {
  return {
    filters,
    filterOptions,
    allScripts,
    visibleScripts,
    uploadCounters,
    students,
    questionPaper,
    selectedStudent,
    selectedScript,
    filteredStudents,
    selectedStudentId,
    selectedScriptId,
    studentSearch,
    studentStatusFilter,
    activeQuestionNo,
    offlineMode,
    saveState,
    showSystemDuplicateToast,
    addUploadRows,
    scheduleStudentValidation,
    retryUpload,
    removeUpload,
    removeSelectedUploads,
    openStudent,
    openScript,
    setActiveQuestion,
    setScore,
    markCompleted,
    setFilter,
  }
}
