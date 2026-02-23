<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbItems = computed(() => {
  if (route.path.includes('/assessments/evaluate')) {
    return ['Evaluator', 'Mathematics', 'Yasharth Singh']
  }
  if (route.path.includes('/assessments/upload')) {
    return ['Recruitment', 'User Management']
  }
  if (route.path.includes('/dashboard')) {
    return ['Recruitment', 'Dashboard']
  }
  return ['Recruitment', 'Settings']
})

const searchPlaceholder = computed(() =>
  route.path.includes('/assessments/evaluate') ? 'Search in Assessment' : 'Search in Users',
)
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-left">
        <button class="icon-btn" type="button" aria-label="Open menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h12M4 17h16" /></svg>
        </button>

        <div class="brand-block">
          <div class="brand-wordmark">Hire3x</div>
        </div>

        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <span v-for="(item, idx) in breadcrumbItems" :key="`${item}-${idx}`" class="crumb-wrap">
            <span v-if="idx !== 0" class="crumb-sep">›</span>
            <span class="crumb" :class="{ current: idx === breadcrumbItems.length - 1 }">{{ item }}</span>
          </span>
        </nav>
      </div>

      <div class="header-right">
        <label class="search" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="text" :placeholder="searchPlaceholder" />
        </label>

        <button class="icon-btn" type="button" aria-label="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12l-1.2-1.5V11a4.8 4.8 0 0 0-9.6 0v4.5zM10 19a2 2 0 0 0 4 0" /></svg>
        </button>

        <button class="icon-btn" type="button" aria-label="Apps">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h3v3H7zm7 0h3v3h-3zM7 14h3v3H7zm7 0h3v3h-3z" /></svg>
        </button>

        <button class="avatar" type="button" aria-label="Profile">JS</button>
      </div>
    </header>

    <aside class="sidebar">
      <RouterLink to="/dashboard" class="nav-icon" title="Dashboard">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10.5 12 5l7 5.5V19H5z" /></svg>
      </RouterLink>
      <RouterLink to="/assessments/upload" class="nav-icon" title="Upload">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10m0-10 4 4m-4-4-4 4M5 16v3h14v-3" /></svg>
      </RouterLink>
      <RouterLink to="/assessments/evaluate" class="nav-icon" title="Evaluate">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5 9 12l3.5 3.5L20 8" /><path d="M14 8h6v6" /></svg>
      </RouterLink>
      <RouterLink to="/settings" class="nav-icon" title="Settings">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm8 3.8-2 .7a6.9 6.9 0 0 1-.5 1.2l1 1.9-1.9 1.9-1.9-1a6.9 6.9 0 0 1-1.2.5l-.7 2h-2.6l-.7-2a6.9 6.9 0 0 1-1.2-.5l-1.9 1-1.9-1.9 1-1.9a6.9 6.9 0 0 1-.5-1.2l-2-.7v-2.6l2-.7a6.9 6.9 0 0 1 .5-1.2l-1-1.9L7.4 3l1.9 1a6.9 6.9 0 0 1 1.2-.5l.7-2h2.6l.7 2a6.9 6.9 0 0 1 1.2.5l1.9-1 1.9 1.9-1 1.9c.2.4.4.8.5 1.2l2 .7z"/></svg>
      </RouterLink>
    </aside>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
