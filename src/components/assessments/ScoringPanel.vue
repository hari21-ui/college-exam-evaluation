<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import Modal from '../common/Modal.vue'
import { useAssessmentStore } from '../../stores/assessmentStore'

const store = useAssessmentStore()
const showCompleteModal = ref(false)
const fieldErrors = ref<Record<number, string>>({})

const scoreSummary = computed(() => {
  const student = store.selectedStudent.value
  if (!student) return { total: 0, answered: 0 }

  let total = 0
  let answered = 0
  student.questions.forEach((question) => {
    if (typeof question.awardedMarks === 'number') {
      total += question.awardedMarks
      answered += 1
    }
  })
  return { total, answered }
})

const readOnly = computed(() => {
  const status = store.selectedStudent.value?.evaluationStatus
  return status === 'locked_by_other' || status === 'completed'
})

function focusQuestion(questionNo: number) {
  store.setActiveQuestion(questionNo)
  nextTick(() => {
    document.getElementById(`question-${questionNo}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function moveToNext(questionNo: number) {
  const next = Math.min(store.questionPaper.value.length, questionNo + 1)
  focusQuestion(next)
  const nextEl = document.querySelector<HTMLInputElement>(`#q-input-${next}`)
  nextEl?.focus()
}

function commitScore(questionNo: number, max: number, value: string, source: 'enter' | 'blur') {
  const parsed = value === '' ? null : Number(value)
  if (parsed !== null && (Number.isNaN(parsed) || parsed > max)) {
    fieldErrors.value[questionNo] = `Cannot exceed / ${max}`
    return
  }
  fieldErrors.value[questionNo] = ''
  store.setScore(questionNo, parsed)
  if (source === 'enter' || (source === 'blur' && parsed !== null)) moveToNext(questionNo)
}

function questionLabel(questionNo: number) {
  return `Explain the concept for question ${questionNo} with key points and examples.`
}
</script>

<template>
  <section class="card scoring-panel">
    <div class="scoring-header">
      <h3>Scoring</h3>
      <p>Total Score: {{ scoreSummary.total }}</p>
      <p>Progress: {{ scoreSummary.answered }}/{{ store.questionPaper.value.length }}</p>
    </div>

    <div class="questions-list" id="scoring-list">
      <div
        v-for="question in store.questionPaper.value"
        :id="`question-${question.questionNo}`"
        :key="question.questionNo"
        :class="['question-card', { active: store.activeQuestionNo.value === question.questionNo }]"
        @click="focusQuestion(question.questionNo)"
      >
        <div class="question-row">
          <span class="subtle-q">Q{{ question.questionNo }}</span>
          <p class="question-text">{{ questionLabel(question.questionNo) }}</p>
        </div>

        <div class="score-row">
          <label class="marks-input-wrap">
            <input
              :id="`q-input-${question.questionNo}`"
              class="text-input score-cell"
              type="number"
              min="0"
              :max="question.maxMarks"
              :disabled="!store.selectedStudent.value || readOnly"
              :value="store.selectedStudent.value?.questions.find((q) => q.questionNo === question.questionNo)?.awardedMarks ?? ''"
              @focus="focusQuestion(question.questionNo)"
              @blur="commitScore(question.questionNo, question.maxMarks, ($event.target as HTMLInputElement).value, 'blur')"
              @keydown.enter.prevent="commitScore(question.questionNo, question.maxMarks, ($event.target as HTMLInputElement).value, 'enter')"
            />
            <span class="max-label">/ {{ question.maxMarks }}</span>
          </label>
        </div>

        <p v-if="fieldErrors[question.questionNo]" class="inline-error">{{ fieldErrors[question.questionNo] }}</p>
      </div>
    </div>

    <div class="sticky-complete">
      <button class="btn primary" :disabled="!store.selectedStudent.value || readOnly" @click="showCompleteModal = true">Mark as Completed</button>
    </div>

    <div v-if="store.offlineMode.value" class="floating-save warning">Offline — will sync when online</div>
    <div v-else-if="store.saveState.visible" class="floating-save">{{ store.saveState.text }}</div>

    <Modal
      title="Mark evaluation as completed?"
      :open="showCompleteModal"
      @close="showCompleteModal = false"
      @confirm="store.markCompleted(); showCompleteModal = false"
    >
      <p>Once marked completed, this evaluation cannot be edited.</p>
    </Modal>
  </section>
</template>
