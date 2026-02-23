<script setup lang="ts">
import { useAssessmentStore, type StudentStatus } from '../../stores/assessmentStore'

const store = useAssessmentStore()

const chips: Array<{ label: string; value: 'all' | 'available' | 'locked_by_other' | 'in_progress' | 'completed' }> = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Locked', value: 'locked_by_other' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

function readableStatus(status: StudentStatus) {
  return status.replaceAll('_', ' ')
}
</script>

<template>
  <aside class="card student-nav">
    <input class="text-input" placeholder="Search Student ID" :value="store.search.value" @input="store.setSearch(($event.target as HTMLInputElement).value)" />
    <div class="chips">
      <button
        v-for="chip in chips"
        :key="chip.value"
        :class="['chip', { active: store.filterStatus.value === chip.value }]"
        @click="store.setFilter(chip.value)"
      >
        {{ chip.label }}
      </button>
    </div>
    <div class="students-list">
      <button
        v-for="student in store.filteredStudents.value"
        :key="student.id"
        :class="['student-row', { active: store.selectedStudent.value?.id === student.id }]"
        @click="store.openStudent(student.id)"
      >
        <div class="row-top">
          <strong>{{ student.id }}</strong>
          <span :class="['dot', student.status]"></span>
        </div>
        <small v-if="student.status === 'locked_by_other'">Locked by {{ student.lockedBy }}</small>
        <small v-else>{{ readableStatus(student.status) }}</small>
      </button>
    </div>
  </aside>
</template>
