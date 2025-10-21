<template>
  <div class="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <span class="text-xl">✅</span>
      <div>
        <h3 class="font-semibold mb-1">Success</h3>
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