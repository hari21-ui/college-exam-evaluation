<script setup lang="ts">
import { computed } from 'vue'
import { useAssessmentStore } from '../../stores/assessmentStore'

const store = useAssessmentStore()

const mockPages = computed(() => [1, 2, 3, 4])

const lineWidths = ['58%', '82%', '68%', '51%', '79%', '66%', '82%', '68%', '66%']

function scrollToQuestion(questionNo: number) {
  const targetPage = Math.max(1, Math.ceil((questionNo / store.questionPaper.value.length) * mockPages.value.length))
  document.getElementById(`mock-page-${targetPage}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <section class="card viewer-panel">
    <div class="viewer-toolbar sticky">
      <strong>{{ store.selectedStudent.value?.id || 'No student selected' }}</strong>
      <div class="toolbar-actions">
        <button class="btn secondary" :disabled="!store.selectedStudent.value" @click="scrollToQuestion(Math.max(1, store.activeQuestionNo.value - 1))">↑</button>
        <button
          class="btn secondary"
          :disabled="!store.selectedStudent.value"
          @click="scrollToQuestion(Math.min(store.questionPaper.value.length, store.activeQuestionNo.value + 1))"
        >
          ↓
        </button>
      </div>
    </div>

    <div v-if="!store.selectedStudent.value" class="empty-state">Select a student from the left panel to open the answer sheet.</div>

    <div v-else class="pdf-scroll-host">
      <article v-for="pageNo in mockPages" :id="`mock-page-${pageNo}`" :key="pageNo" class="mock-page">
        <span class="mock-page-no">Page {{ pageNo }}</span>
        <div class="mock-lines">
          <span v-for="(width, idx) in lineWidths" :key="`${pageNo}-${idx}`" class="mock-line" :style="{ width }"></span>
        </div>
      </article>
    </div>
  </section>
</template>
