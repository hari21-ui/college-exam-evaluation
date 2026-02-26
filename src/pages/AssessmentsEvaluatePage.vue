<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import StudentNavigator from '../components/assessments/StudentNavigator.vue'
import PdfViewer from '../components/assessments/PdfViewer.vue'
import ScoringPanel from '../components/assessments/ScoringPanel.vue'
import { useAssessmentStore } from '../stores/assessmentStore'

const store = useAssessmentStore()
const route = useRoute()

// TODO: optional fullscreen evaluate mode can be added by toggling a class that hides StudentNavigator.
function syncRouteScript() {
  const scriptId = route.params.scriptId
  if (typeof scriptId === 'string' && scriptId) {
    store.openScript(scriptId)
  }
}

watch(() => route.params.scriptId, syncRouteScript)
onMounted(syncRouteScript)
</script>

<template>
  <div class="evaluate-wrap">
    <div class="evaluate-topbar">
      <label class="offline-toggle">
        <input type="checkbox" :checked="store.offlineMode.value" @change="store.offlineMode.value = ($event.target as HTMLInputElement).checked" />
        Simulate offline
      </label>
      <div v-if="store.offlineMode.value" class="banner warning">Offline mode active. Saves are queued locally.</div>
    </div>
    <div class="evaluate-page">
      <StudentNavigator />
      <PdfViewer />
      <ScoringPanel />
    </div>
  </div>
</template>
