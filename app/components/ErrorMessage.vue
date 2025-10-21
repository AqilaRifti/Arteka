<template>
  <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <span class="text-xl">⚠️</span>
      <div>
        <h3 class="font-semibold mb-1">Error</h3>
        <p class="text-sm">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
}>();
</script>
