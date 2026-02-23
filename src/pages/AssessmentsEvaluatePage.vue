<script setup lang="ts">
import StudentNavigator from '../components/assessments/StudentNavigator.vue'
import PdfViewer from '../components/assessments/PdfViewer.vue'
import ScoringPanel from '../components/assessments/ScoringPanel.vue'
</script>

<template>
  <div class="evaluate-page">
    <StudentNavigator />
    <PdfViewer />
    <ScoringPanel />
  </div>
</template>
