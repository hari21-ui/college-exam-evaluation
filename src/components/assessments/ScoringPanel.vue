<script setup lang="ts">
import { computed, ref } from 'vue'
import Modal from '../common/Modal.vue'
import { useAssessmentStore } from '../../stores/assessmentStore'

const store = useAssessmentStore()
const showReopenModal = ref(false)
const fieldErrors = ref<Record<number, string>>({})

const scoreSummary = computed(() => {
  const student = store.selectedStudent.value
  if (!student) return { total: 0, answered: 0 }

  let total = 0
  let answered = 0
  for (const question of store.questionPaper.value) {
    const score = student.scores[question.id]
    if (typeof score === 'number') {
      total += score
      answered += 1
    }
  }
  return { total, answered }
})

const isReadOnly = computed(() => store.selectedStudent.value?.status === 'locked_by_other')

function handleScoreChange(questionId: number, max: number, value: string) {
  const parsed = value === '' ? null : Number(value)
  if (parsed !== null && parsed > max) {
    fieldErrors.value[questionId] = `Cannot exceed max ${max}`
    return
  }
  fieldErrors.value[questionId] = ''
  store.setScore(questionId, parsed)
}
</script>

<template>
  <section class="card scoring-panel">
    <div class="sticky scoring-header">
      <h3>Scoring</h3>
      <p>Total Score: {{ scoreSummary.total }}</p>
      <p>Progress: {{ scoreSummary.answered }}/20</p>
      <button
        v-if="store.selectedStudent.value?.status !== 'completed'"
        class="btn primary"
        :disabled="!store.selectedStudent.value || isReadOnly"
        @click="store.markComplete"
      >
        Mark as complete
      </button>
      <button v-else class="btn secondary" @click="showReopenModal = true">Re-open for edits</button>
    </div>

    <div v-if="isReadOnly" class="banner warning">Locked by {{ store.selectedStudent.value?.lockedBy }}. View only.</div>

    <div class="questions-list">
      <div v-for="question in store.questionPaper.value" :key="question.id" class="question-card">
        <div>
          <strong>Q{{ question.id }}</strong>
          <p>Max: {{ question.maxMarks }}</p>
        </div>
        <div>
          <input
            class="text-input small"
            type="number"
            min="0"
            :max="question.maxMarks"
            :disabled="!store.selectedStudent.value || isReadOnly"
            :value="store.selectedStudent.value?.scores[question.id] ?? ''"
            @input="handleScoreChange(question.id, question.maxMarks, ($event.target as HTMLInputElement).value)"
          />
          <p v-if="fieldErrors[question.id]" class="inline-error">{{ fieldErrors[question.id] }}</p>
        </div>
      </div>
    </div>

    <Modal title="Re-open completed evaluation?" :open="showReopenModal" @close="showReopenModal = false" @confirm="store.reopenForEdits(); showReopenModal = false">
      <p>You're editing a completed evaluation. Edit history will be available in V2. Continue?</p>
    </Modal>
  </section>
</template>
