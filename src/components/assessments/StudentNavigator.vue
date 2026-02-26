<script setup lang="ts">
import { ref } from 'vue'
import { useAssessmentStore, type EvaluationStatus } from '../../stores/assessmentStore'

const store = useAssessmentStore()
const collapsed = ref(false)

const chips: Array<{ label: string; value: 'all' | EvaluationStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Locked', value: 'locked_by_other' },
]
</script>

<template>
  <aside :class="['card student-nav', { collapsed }]">
    <button class="collapse-btn" @click="collapsed = !collapsed">{{ collapsed ? '›' : '‹' }}</button>
    <template v-if="!collapsed">
      <input class="text-input" placeholder="Search Student ID" :value="store.studentSearch.value" @input="store.studentSearch.value = ($event.target as HTMLInputElement).value" />
      <div class="chips">
        <button
          v-for="chip in chips"
          :key="chip.value"
          :class="['chip', { active: store.studentStatusFilter.value === chip.value }]"
          @click="store.studentStatusFilter.value = chip.value"
        >
          {{ chip.label }}
        </button>
      </div>
      <div class="students-list">
        <button
          v-for="student in store.filteredStudents.value"
          :key="student.id"
          :class="['student-row', { active: store.selectedStudentId.value === student.id }]"
          @click="store.openStudent(student.id)"
        >
          <div class="row-top">
            <strong>{{ student.id }}</strong>
            <span :class="['dot', student.evaluationStatus]"></span>
          </div>
          <small v-if="student.evaluationStatus === 'locked_by_other'">Locked by {{ student.lockedBy }}</small>
          <small v-else>{{ student.evaluationStatus.replace(/_/g, ' ') }}</small>
        </button>
      </div>
    </template>
  </aside>
</template>
