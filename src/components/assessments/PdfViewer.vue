<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { useAssessmentStore } from '../../stores/assessmentStore'

GlobalWorkerOptions.workerSrc = workerSrc

const store = useAssessmentStore()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const page = ref(1)
const totalPages = ref(1)
const scale = ref(1)

async function renderPdf() {
  if (!store.selectedStudent.value || !canvasEl.value) return
  const loadingTask = getDocument(store.selectedStudent.value ? '/sample.pdf' : '')
  const pdf = await loadingTask.promise
  totalPages.value = pdf.numPages

  const currentPage = await pdf.getPage(page.value)
  const viewport = currentPage.getViewport({ scale: scale.value })
  const canvas = canvasEl.value
  const context = canvas.getContext('2d')
  if (!context) return

  canvas.height = viewport.height
  canvas.width = viewport.width

  await currentPage.render({ canvasContext: context, viewport }).promise
}

watch(
  () => [store.selectedStudent.value?.id, page.value, scale.value],
  async () => {
    page.value = Math.min(page.value, totalPages.value)
    await renderPdf()
  },
)

onMounted(async () => {
  await renderPdf()
})
</script>

<template>
  <section class="card viewer-panel">
    <div class="viewer-toolbar sticky">
      <div>
        <strong>{{ store.selectedStudent.value?.id || 'No student selected' }}</strong>
        <span v-if="store.selectedStudent.value" :class="['lock-badge', store.selectedStudent.value.status === 'locked_by_other' ? 'danger' : 'primary']">
          {{ store.selectedStudent.value.status === 'locked_by_other' ? `Locked by ${store.selectedStudent.value.lockedBy}` : 'Locked by you' }}
        </span>
      </div>
      <div class="toolbar-actions">
        <button class="btn secondary" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">Prev</button>
        <button class="btn secondary" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1)">Next</button>
        <button class="btn secondary" @click="scale = Math.max(0.8, Number((scale - 0.1).toFixed(1)))">-</button>
        <button class="btn secondary" @click="scale = Math.min(2, Number((scale + 0.1).toFixed(1)))">+</button>
        <span>{{ page }}/{{ totalPages }}</span>
        <span class="autosave">{{ store.autosave.state }}</span>
      </div>
    </div>

    <div v-if="!store.selectedStudent.value" class="empty-state">Select a student from the left panel to open the answer sheet.</div>
    <div v-else class="canvas-wrap">
      <canvas ref="canvasEl"></canvas>
    </div>
  </section>
</template>
