<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { useAssessmentStore } from '../../stores/assessmentStore'

GlobalWorkerOptions.workerSrc = workerSrc

const store = useAssessmentStore()

const doc = ref<PDFDocumentProxy | null>(null)
const totalPages = ref(0)
const scale = ref(1.1)
const currentPage = ref(1)
const isHoveringViewer = ref(false)

const pageEls = new Map<number, HTMLElement>()
const canvasEls = new Map<number, HTMLCanvasElement>()
const thumbCanvasEls = new Map<number, HTMLCanvasElement>()

const scrollContainer = ref<HTMLElement | null>(null)
const renderToken = ref(0)
let observer: IntersectionObserver | null = null

const selectedStudent = computed(() => store.selectedStudent.value)
const lockText = computed(() => {
  if (!selectedStudent.value) return ''
  if (selectedStudent.value.status === 'locked_by_other') return `Locked by ${selectedStudent.value.lockedBy}`
  return 'Locked by you'
})

function setPageEl(pageNumber: number, element: unknown) {
  if (!element) {
    pageEls.delete(pageNumber)
    return
  }
  pageEls.set(pageNumber, element as HTMLElement)
}

function setCanvasEl(pageNumber: number, element: unknown) {
  if (!element) {
    canvasEls.delete(pageNumber)
    return
  }
  canvasEls.set(pageNumber, element as HTMLCanvasElement)
}

function setThumbCanvasEl(pageNumber: number, element: unknown) {
  if (!element) {
    thumbCanvasEls.delete(pageNumber)
    return
  }
  thumbCanvasEls.set(pageNumber, element as HTMLCanvasElement)
}

async function loadPdf() {
  renderToken.value += 1
  const token = renderToken.value

  doc.value = null
  totalPages.value = 0
  currentPage.value = 1
  observer?.disconnect()

  if (!selectedStudent.value) return

  const loadingTask = getDocument('/sample.pdf')
  const pdf = await loadingTask.promise
  if (token !== renderToken.value) return

  doc.value = pdf
  totalPages.value = pdf.numPages

  await nextTick()
  await renderAllPages(token)
  setupObserver()
}

async function renderAllPages(token: number) {
  if (!doc.value) return

  for (let i = 1; i <= totalPages.value; i += 1) {
    if (token !== renderToken.value) return
    await renderPage(i)
    await renderThumbnail(i)
  }
}

async function renderPage(pageNumber: number) {
  if (!doc.value) return
  const canvas = canvasEls.get(pageNumber)
  if (!canvas) return

  const page = await doc.value.getPage(pageNumber)
  const viewport = page.getViewport({ scale: scale.value })
  const context = canvas.getContext('2d')
  if (!context) return

  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: context, viewport }).promise
}

async function renderThumbnail(pageNumber: number) {
  if (!doc.value) return
  const thumbCanvas = thumbCanvasEls.get(pageNumber)
  if (!thumbCanvas) return

  const page = await doc.value.getPage(pageNumber)
  const viewport = page.getViewport({ scale: 0.2 })
  const context = thumbCanvas.getContext('2d')
  if (!context) return

  thumbCanvas.width = viewport.width
  thumbCanvas.height = viewport.height
  await page.render({ canvasContext: context, viewport }).promise
}

function setupObserver() {
  observer?.disconnect()
  if (!scrollContainer.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const topVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (!topVisible) return

      const value = Number((topVisible.target as HTMLElement).dataset.page)
      if (Number.isFinite(value)) currentPage.value = value
    },
    { root: scrollContainer.value, threshold: [0.3, 0.5, 0.75] },
  )

  for (let i = 1; i <= totalPages.value; i += 1) {
    const pageEl = pageEls.get(i)
    if (pageEl) {
      pageEl.dataset.page = String(i)
      observer.observe(pageEl)
    }
  }
}

function scrollToPage(pageNumber: number) {
  const clamped = Math.min(totalPages.value, Math.max(1, pageNumber))
  const el = pageEls.get(clamped)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function pageUp() {
  scrollToPage(currentPage.value - 1)
}

function pageDown() {
  scrollToPage(currentPage.value + 1)
}

function zoomOut() {
  scale.value = Math.max(0.8, Number((scale.value - 0.1).toFixed(1)))
}

function zoomIn() {
  scale.value = Math.min(2, Number((scale.value + 0.1).toFixed(1)))
}

defineExpose({ scrollToPage })

watch(
  () => selectedStudent.value?.id,
  async () => {
    await loadPdf()
  },
  { immediate: true },
)

watch(
  () => scale.value,
  async () => {
    if (!doc.value) return
    const token = renderToken.value
    await nextTick()
    await renderAllPages(token)
    setupObserver()
  },
)

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <section
    class="card viewer-panel"
    @mouseenter="isHoveringViewer = true"
    @mouseleave="isHoveringViewer = false"
  >
    <div class="viewer-toolbar sticky">
      <div>
        <strong>{{ selectedStudent?.id || 'No student selected' }}</strong>
        <span v-if="selectedStudent" :class="['lock-badge', selectedStudent.status === 'locked_by_other' ? 'danger' : 'primary']">
          {{ lockText }}
        </span>
      </div>
      <div class="toolbar-actions">
        <button class="btn secondary" :disabled="currentPage <= 1" @click="pageUp">Page Up</button>
        <button class="btn secondary" :disabled="currentPage >= totalPages" @click="pageDown">Page Down</button>
        <button class="btn secondary" :disabled="!selectedStudent" @click="zoomOut">-</button>
        <button class="btn secondary" :disabled="!selectedStudent" @click="zoomIn">+</button>
        <span>{{ currentPage }}/{{ totalPages || 1 }}</span>
        <span class="autosave">{{ store.autosave.state }}</span>
      </div>
    </div>

    <div v-if="!selectedStudent" class="empty-state">Select a student from the left panel to open the answer sheet.</div>
    <div v-else class="canvas-wrap" ref="scrollContainer">
      <div class="pages-stack">
        <div v-for="pageNumber in totalPages" :key="pageNumber" class="pdf-page" :ref="(el) => setPageEl(pageNumber, el)">
          <canvas :ref="(el) => setCanvasEl(pageNumber, el)"></canvas>
        </div>
      </div>

      <aside :class="['thumbnail-rail', { visible: isHoveringViewer }]" aria-label="Page thumbnails">
        <button
          v-for="pageNumber in totalPages"
          :key="`thumb-${pageNumber}`"
          :class="['thumb', { active: currentPage === pageNumber }]"
          type="button"
          @click="scrollToPage(pageNumber)"
        >
          <canvas :ref="(el) => setThumbCanvasEl(pageNumber, el)"></canvas>
          <small>P{{ pageNumber }}</small>
        </button>
      </aside>
    </div>
  </section>
</template>
