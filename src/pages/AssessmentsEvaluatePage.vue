<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StudentNavigator from '../components/assessments/StudentNavigator.vue'
import PdfViewer from '../components/assessments/PdfViewer.vue'
import ScoringPanel from '../components/assessments/ScoringPanel.vue'

const STORAGE_KEY = 'assessment.studentNavigatorCollapsed'
const isNavigatorCollapsed = ref(false)
const pdfViewerRef = ref<InstanceType<typeof PdfViewer> | null>(null)

function toggleNavigator() {
  isNavigatorCollapsed.value = !isNavigatorCollapsed.value
  localStorage.setItem(STORAGE_KEY, String(isNavigatorCollapsed.value))
}

function jumpToQuestionPage(page: number) {
  pdfViewerRef.value?.scrollToPage(page)
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  isNavigatorCollapsed.value = saved === 'true'
})
</script>

<template>
  <div :class="['evaluate-page', { collapsed: isNavigatorCollapsed }]">
    <StudentNavigator :collapsed="isNavigatorCollapsed" @toggle-collapse="toggleNavigator" />
    <PdfViewer ref="pdfViewerRef" />
    <ScoringPanel @go-to-page="jumpToQuestionPage" />
  </div>
</template>
