<script setup lang="ts">
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useAssessmentStore } from '../../stores/assessmentStore'

GlobalWorkerOptions.workerSrc = workerSrc

const store = useAssessmentStore()
const viewerEl = ref<HTMLElement | null>(null)
const pageCanvases = ref<HTMLCanvasElement[]>([])
const totalPages = ref(0)

const isSyncingFromScroll = ref(false)
let framePending = false
let lastMappedQuestion = 1

const selectedPdfUrl = computed(() => {
  const scriptName = store.selectedScript.value?.filename || ''
  if (scriptName.toLowerCase() === 'biology.pdf') return '/Biology.pdf'
  return '/sample.pdf'
})

async function renderPdf() {
  if (!viewerEl.value || !store.selectedStudent.value) return
  const loadingTask = getDocument(selectedPdfUrl.value)
  const pdf = await loadingTask.promise

  viewerEl.value.innerHTML = ''
  pageCanvases.value = []
  totalPages.value = pdf.numPages

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo)
    const viewport = page.getViewport({ scale: 1.05 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) continue

    canvas.className = 'pdf-page'
    canvas.dataset.page = String(pageNo)
    canvas.width = viewport.width
    canvas.height = viewport.height

    viewerEl.value.appendChild(canvas)
    pageCanvases.value.push(canvas)
    await page.render({ canvasContext: context, viewport }).promise
  }

  lastMappedQuestion = 1
}

function questionToPage(questionNo: number) {
  if (!totalPages.value) return 1
  return Math.max(1, Math.min(totalPages.value, Math.ceil((questionNo / store.questionPaper.value.length) * totalPages.value)))
}

function scrollToQuestion(questionNo: number) {
  const pageNo = questionToPage(questionNo)
  pageCanvases.value[pageNo - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function onPdfScroll() {
  if (framePending) return
  framePending = true

  window.requestAnimationFrame(() => {
    framePending = false
    const host = viewerEl.value
    if (!host) return

    const maxScroll = Math.max(1, host.scrollHeight - host.clientHeight)
    const ratio = host.scrollTop / maxScroll
    const mappedQuestion = Math.max(1, Math.min(store.questionPaper.value.length, Math.floor(ratio * store.questionPaper.value.length) + 1))
    if (mappedQuestion === lastMappedQuestion || mappedQuestion === store.activeQuestionNo.value) return

    lastMappedQuestion = mappedQuestion

    isSyncingFromScroll.value = true
    store.setActiveQuestion(mappedQuestion)
  })
}

watch(
  () => store.selectedStudent.value?.id,
  async () => {
    await nextTick()
    await renderPdf()
  },
)

watch(
  () => selectedPdfUrl.value,
  async () => {
    await nextTick()
    await renderPdf()
  },
)

watch(
  () => store.activeQuestionNo.value,
  (questionNo) => {
    if (isSyncingFromScroll.value) {
      isSyncingFromScroll.value = false
      return
    }
    scrollToQuestion(questionNo)
  },
)

onMounted(async () => {
  await renderPdf()
})
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
    <div v-else ref="viewerEl" class="pdf-scroll-host" @scroll="onPdfScroll"></div>
  </section>
</template>
