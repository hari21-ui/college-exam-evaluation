<script setup lang="ts">
defineProps<{
  title: string
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <h3>{{ title }}</h3>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-actions">
        <button class="btn secondary" @click="emit('close')">Cancel</button>
        <button class="btn primary" @click="emit('confirm')">Continue</button>
      </div>
    </div>
  </div>
</template>
