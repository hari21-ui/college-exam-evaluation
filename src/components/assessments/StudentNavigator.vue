<script setup lang="ts">
import { useAssessmentStore, type StudentStatus } from '../../stores/assessmentStore'

defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ (e: 'toggle-collapse'): void }>()

const store = useAssessmentStore()

const chips: Array<{ label: string; value: 'all' | 'available' | 'locked_by_other' | 'in_progress' | 'completed' }> = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Locked', value: 'locked_by_other' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

function readableStatus(status: StudentStatus) {
  return status.replace(/_/g, ' ')
}
</script>

<template>
  <aside :class="['card', 'student-nav', { collapsed }]">
    <div class="student-nav-header">
      <strong v-if="!collapsed">Students</strong>
      <button class="collapse-toggle" type="button" @click="emit('toggle-collapse')" :aria-label="collapsed ? 'Expand student list' : 'Collapse student list'">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path v-if="!collapsed" d="m15 6-6 6 6 6" />
          <path v-else d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </div>

    <template v-if="!collapsed">
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
    </template>

    <div class="students-list">
      <button
        v-for="student in store.filteredStudents.value"
        :key="student.id"
        :title="student.id"
        :class="['student-row', { active: store.selectedStudent.value?.id === student.id, mini: collapsed }]"
        @click="store.openStudent(student.id)"
      >
        <template v-if="!collapsed">
          <div class="row-top">
            <strong>{{ student.id }}</strong>
            <span :class="['dot', student.status]"></span>
          </div>
          <small v-if="student.status === 'locked_by_other'">Locked by {{ student.lockedBy }}</small>
          <small v-else>{{ readableStatus(student.status) }}</small>
        </template>
        <template v-else>
          <span :class="['dot', student.status]"></span>
          <svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" /><circle cx="12" cy="8" r="4" /></svg>
        </template>
      </button>
    </div>
  </aside>
</template>
