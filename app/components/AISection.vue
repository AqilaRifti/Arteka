<template>
  <div class="relative w-full overflow-hidden rounded-lg bg-background">
    <div
      class="absolute flex w-full flex-col items-center justify-center gap-2 p-8 text-center font-heading text-white"
    >
      <span class="text-4xl font-semibold"> Accelerate With AI </span>
      <span class="font-sans font-light">Deliver amazing creations with ease.</span>
      <NuxtLink to="/translate">
      <Button variant="outline" class="text-black dark:text-white" style="z-index: 99999 !important">Translate For Reach 🚀</Button>
      </NuxtLink>
    </div>
    <div class="flex">
      <Spline
        :scene="sceneUrl"
        class="mt-24 size-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const sceneUrl = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
</script>