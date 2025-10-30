<template>
  <NuxtLayout v-if="!isDashboard">
    <NuxtPage />
  </NuxtLayout>
  <div v-else>
    <NuxtPage />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const route = useRoute()
const isDashboard = computed(() => route.path.includes('/dashboard'))
</script>