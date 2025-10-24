<template>
  <main class="flex flex-col justify-center md:flex-row items-center my-2">
    <div class="max-w-2xl flex flex-col gap-4 z-20">
      <h1
        class="text-4xl font-bold"
        style="font-family: Arial, Helvetica, sans-serif"
      >
        Accelerate Your Work.
      </h1>
      <p>
        For creatives, getting funded means turning passion into a sustainable
        venture with the backing to dream bigger. Accelerators provide not just
        money, but mentorship, tools, and a vibrant community to sharpen your
        vision and expand your reach. It’s your chance to grow your creative
        brand with purpose, speed, and impact.
      </p>
      <NuxtLink to="/funding"><Button>Start Funding -> </Button></NuxtLink>
    </div>
    <div
      class="relative flex w-full flex-col items-center justify-center min-h-[300px]"
    >
      <div
        class="relative h-46 w-full rounded-xl overflow-clip flex flex-col items-center justify-center gap-4"
      >
        <LightSpeed :key="preset" :effect-options="selectedPreset" />
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { lightSpeedPresets } from "@/components/ui/light-speed";

const preset = ref("six");

const selectedPreset = computed(() => lightSpeedPresets[preset.value]);

function getName(key: string) {
  const names = {
    one: "Light 1",
    two: "Light 2",
    three: "Light 3",
    four: "Light 4",
    five: "Light 5",
    six: "Light 6",
  };

  return names[key];
}
</script>
