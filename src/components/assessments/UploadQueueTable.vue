<script setup lang="ts">
import { computed } from 'vue'
import { useAssessmentStore } from '../../stores/assessmentStore'

const store = useAssessmentStore()

const allSelected = computed({
  get: () => store.uploadRows.value.length > 0 && store.uploadRows.value.every((row) => row.selected),
  set: (value: boolean) => {
    store.uploadRows.value.forEach((row) => {
      row.selected = value
    })
  },
})
</script>

<template>
  <section class="card upload-table-wrap">
    <div class="table-toolbar">
      <strong>Upload Queue</strong>
      <button class="btn secondary" :disabled="!store.uploadRows.value.some((row) => row.selected)" @click="store.removeSelectedUploads">
        Remove selected
      </button>
    </div>
    <table class="upload-table">
      <thead>
        <tr>
          <th><input v-model="allSelected" type="checkbox" /></th>
          <th>File Name</th>
          <th>Pages</th>
          <th>Student ID</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in store.uploadRows.value" :id="`row-${row.id}`" :key="row.id">
          <td><input v-model="row.selected" type="checkbox" /></td>
          <td>{{ row.fileName }}</td>
          <td>{{ row.pages }}</td>
          <td>
            <input
              class="text-input"
              :class="{ invalid: !row.studentId || store.duplicateIds.value.has(row.studentId) }"
              :value="row.studentId"
              placeholder="e.g. STU1023"
              @input="store.updateStudentId(row.id, ($event.target as HTMLInputElement).value)"
            />
            <p v-if="!row.studentId" class="inline-error">Student ID is mandatory</p>
            <p v-else-if="store.duplicateIds.value.has(row.studentId)" class="inline-error">Duplicate Student ID</p>
          </td>
          <td>
            <span :class="['status-pill', row.status]">{{ row.status }}</span>
          </td>
          <td>
            <button v-if="row.status === 'failed'" class="btn-link" @click="store.retryUpload(row.id)">Retry</button>
            <button class="btn-link danger" @click="store.removeUpload(row.id)">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
