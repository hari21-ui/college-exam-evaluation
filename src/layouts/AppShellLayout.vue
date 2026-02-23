<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = computed(() => (route.path.includes('/evaluate') ? 'evaluate' : 'upload'))
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">ExamOps</div>
      <nav>
        <RouterLink to="/dashboard" class="nav-item">Dashboard</RouterLink>
        <div class="nav-group">
          <div class="nav-group-title">Assessments</div>
          <RouterLink to="/assessments/upload" class="nav-item nested">Upload Answer Sheets</RouterLink>
          <RouterLink to="/assessments/evaluate" class="nav-item nested">Evaluation Workspace</RouterLink>
        </div>
        <RouterLink to="/settings" class="nav-item">Settings</RouterLink>
      </nav>
    </aside>
    <main class="main-content">
      <header class="page-header">
        <div>
          <h1>Assessment Admin Module</h1>
          <p>Manage uploading and evaluator workflows for answer sheets.</p>
        </div>
        <div class="tabs">
          <RouterLink :class="['tab', { active: activeTab === 'upload' }]" to="/assessments/upload">Upload</RouterLink>
          <RouterLink :class="['tab', { active: activeTab === 'evaluate' }]" to="/assessments/evaluate">Evaluation</RouterLink>
        </div>
      </header>
      <RouterView />
    </main>
  </div>
</template>
