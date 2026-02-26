<script setup lang="ts">
import { useAssessmentStore, type EvaluationStatus } from '../../stores/assessmentStore'

const store = useAssessmentStore()

function evaluationLabel(status: EvaluationStatus) {
  if (status === 'available') return 'Not Started'
  if (status === 'in_progress' || status === 'locked_by_me') return 'In Progress'
  if (status === 'completed') return 'Completed'
  return 'Locked'
}
</script>

<template>
  <section class="card upload-table-wrap">
    <div class="table-toolbar">
      <strong>Student ID Mapping</strong>
    </div>
    <table class="upload-table">
      <thead>
        <tr>
          <th>File Name</th>
          <th>Pages</th>
          <th>Student ID</th>
          <th>Upload Status</th>
          <th>Evaluation Status</th>
          <th>Total Marks</th>
          <th>Last Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in store.visibleScripts.value" :id="`row-${row.id}`" :key="row.id">
          <td>{{ row.filename }}</td>
          <td>{{ row.pages ?? '-' }}</td>
          <td>
            <input
              class="text-input mapping-input"
              :class="{ invalid: row.studentError }"
              :value="row.studentId"
              placeholder="Enter Student ID"
              @input="row.studentId = ($event.target as HTMLInputElement).value.toUpperCase()"
              @blur="store.scheduleStudentValidation(row.id, ($event.target as HTMLInputElement).value, 'blur')"
              @keydown.enter.prevent="store.scheduleStudentValidation(row.id, ($event.target as HTMLInputElement).value, 'submit')"
            />
            <p v-if="row.studentError === 'invalid_format'" class="inline-error">Use 6-20 uppercase letters/numbers</p>
            <p v-else-if="row.studentError === 'duplicate_batch'" class="inline-error">Duplicate Student ID in this batch</p>
            <p v-else-if="row.studentError === 'duplicate_system'" class="inline-error">Student ID exists in system</p>
          </td>
          <td><span :class="['status-pill', row.uploadStatus]">{{ row.uploadStatus.replace(/_/g, ' ') }}</span></td>
          <td><span :class="['status-pill', row.evaluationStatus]">{{ evaluationLabel(row.evaluationStatus) }}</span></td>
          <td>{{ row.totalMarks ? `${row.totalMarks} / 100` : '-' }}</td>
          <td>{{ row.lastUpdated ? new Date(row.lastUpdated).toLocaleDateString() : '-' }}</td>
          <td><button class="btn-link" @click="store.openStudent(row.studentId || '')">Start</button></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
