<script setup lang="ts">
import { useAssessmentStore } from '../stores/assessmentStore'
import UploadQueueTable from '../components/assessments/UploadQueueTable.vue'

const store = useAssessmentStore()

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length) {
    store.addUploadRows(input.files)
    input.value = ''
  }
}

function scrollToRow(rowId: string) {
  document.getElementById(`row-${rowId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <div class="upload-page">
    <section class="card upload-controls">
      <div class="filters-grid">
        <select class="text-input"><option>Exam: Midterm 2026</option></select>
        <select class="text-input"><option>Subject: Data Structures</option></select>
        <select class="text-input"><option>Batch: B.Tech CSE - Sem 4</option></select>
        <label class="btn primary file-btn">
          Upload files
          <input type="file" multiple hidden @change="handleUpload" />
        </label>
      </div>
      <div class="counters">
        <div class="counter"><span>Uploaded</span><strong>{{ store.uploadCounters.value.uploaded }}</strong></div>
        <div class="counter"><span>Converted</span><strong>{{ store.uploadCounters.value.converted }}</strong></div>
        <div class="counter"><span>Missing IDs</span><strong>{{ store.uploadCounters.value.missingIds }}</strong></div>
        <div class="counter"><span>Errors</span><strong>{{ store.uploadCounters.value.errors }}</strong></div>
      </div>
    </section>

    <section class="upload-scene">
      <UploadQueueTable />
      <aside class="card mapping-panel">
        <h3>Mapping & Errors</h3>
        <ul>
          <li>ID format: STU0001</li>
          <li>Student ID is mandatory</li>
        </ul>
        <div class="error-list">
          <button v-for="item in store.uploadErrors.value" :key="`${item.rowId}-${item.message}`" class="error-item" @click="scrollToRow(item.rowId)">
            {{ item.message }}
          </button>
          <p v-if="store.uploadErrors.value.length === 0" class="muted">No validation issues.</p>
        </div>
      </aside>
    </section>
  </div>
</template>
