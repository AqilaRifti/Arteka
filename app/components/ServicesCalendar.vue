<template>
  <main class="flex flex-col justify-center md:flex-row items-center">
    <div class="max-w-2xl flex flex-col gap-4">
      <h1
        class="text-4xl font-bold"
        style="font-family: Arial, Helvetica, sans-serif"
      >
        Provide Value, Get Paid.
      </h1>
      <p>
        Showcase your expertise and deliver the solutions your clients need.
        Fulfill your professional commitment with outstanding service. In
        return, you secure prompt and reliable payment for your valuable work.
      </p>
      <NuxtLink to="/marketplace"><Button>Start a service -> </Button></NuxtLink>
    </div>
    <div
      class="relative flex w-full flex-col items-center justify-center min-h-[300px]"
    >
      <div
        class="flex h-72 flex-col items-center justify-center gap-12 px-4 py-24 md:flex-row"
      >
        <LogoOrigami>
          <LogoOrigamiItem class="bg-orange-300 text-neutral-900">
            🎨
          </LogoOrigamiItem>
          <LogoOrigamiItem class="bg-green-300 text-neutral-900">
            🎬
          </LogoOrigamiItem>
          <LogoOrigamiItem class="bg-cyan-300 text-neutral-900"
            >🎵</LogoOrigamiItem
          >
          <LogoOrigamiItem class="bg-purple-300 text-black">
            💻
          </LogoOrigamiItem>
          <LogoOrigamiItem class="bg-white text-neutral-900">
            📷
          </LogoOrigamiItem>
        </LogoOrigami>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import {
  LucideAtom,
  LucideCalculator,
  LucideChartArea,
  LucideLanguages,
  LucidePi,
} from "lucide-vue-next";
</script>
