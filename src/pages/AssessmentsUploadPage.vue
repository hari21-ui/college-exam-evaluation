<script setup lang="ts">
import { useAssessmentStore } from '../stores/assessmentStore'
import UploadQueueTable from '../components/assessments/UploadQueueTable.vue'

const store = useAssessmentStore()

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    store.addUploadRows(input.files)
    input.value = ''
  }
}
</script>

<template>
  <div class="upload-page">
    <section class="card upload-controls">
      <h3 class="section-title">Upload Answer Sheets</h3>
      <div class="filters-grid">
        <select class="text-input" :value="store.filters.exam" @change="store.setFilter('exam', ($event.target as HTMLSelectElement).value)">
          <option v-for="item in store.filterOptions.value.exam" :key="item" :value="item">Exam: {{ item }}</option>
        </select>
        <select class="text-input" :value="store.filters.batch" @change="store.setFilter('batch', ($event.target as HTMLSelectElement).value)">
          <option v-for="item in store.filterOptions.value.batch" :key="item" :value="item">Batch: {{ item }}</option>
        </select>
        <select class="text-input" :value="store.filters.stream" @change="store.setFilter('stream', ($event.target as HTMLSelectElement).value)">
          <option v-for="item in store.filterOptions.value.stream" :key="item" :value="item">Stream: {{ item }}</option>
        </select>
        <select class="text-input" :value="store.filters.subject" @change="store.setFilter('subject', ($event.target as HTMLSelectElement).value)">
          <option v-for="item in store.filterOptions.value.subject" :key="item" :value="item">Subject: {{ item }}</option>
        </select>
      </div>

      <label class="upload-dropzone">
        <input type="file" multiple accept="application/pdf" hidden @change="handleUpload" />
        <span class="drop-plus">＋</span>
        <p><strong>Select PDFs</strong> or drag and drop</p>
        <small>PDF files only, up to 50MB each</small>
      </label>

      <div class="counters">
        <div class="counter"><span>Uploaded</span><strong>{{ store.uploadCounters.value.uploaded }}</strong></div>
        <div class="counter"><span>Converted</span><strong>{{ store.uploadCounters.value.converted }}</strong></div>
        <div class="counter"><span>Needs ID check</span><strong>{{ store.uploadCounters.value.missingIds }}</strong></div>
        <div class="counter"><span>Errors</span><strong>{{ store.uploadCounters.value.errors }}</strong></div>
      </div>
    </section>

    <UploadQueueTable />

    <div v-if="store.showSystemDuplicateToast.value" class="global-toast">Student ID already exists in system records.</div>
  </div>
</template>
