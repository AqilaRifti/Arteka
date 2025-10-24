<template>
  <main class="flex flex-col justify-center md:flex-row items-center my-2">
    <div class="max-w-2xl flex flex-col gap-4 z-20">
      <h1
        class="text-4xl font-bold"
        style="font-family: Arial, Helvetica, sans-serif"
      >
        Your Work. Your Proof.
      </h1>
      <p>
        Protect your work with the power of blockchain technology. Every file is
        time-stamped, encrypted, and permanently recorded for unmatched security
        and ownership proof. Say goodbye to tampering and hello to total
        creative control.
      </p>
      <NuxtLink to="/digital-rights"><Button>Secure Work -> </Button></NuxtLink>
    </div>
    <div
      class="relative flex w-full flex-col items-center justify-center min-h-[300px]"
    >
      <div
        class="flex h-72 flex-col items-center justify-center gap-12 px-4 py-24 md:flex-row"
      >
        <div class="grid place-content-center">
          <Book class="my-2">
            <BookHeader
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-key-icon lucide-key"
              >
                <path
                  d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
                />
                <path d="m21 2-9.6 9.6" />
                <circle cx="7.5" cy="15.5" r="5.5" /></svg
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-book-lock-icon lucide-book-lock"
              >
                <path d="M18 6V4a2 2 0 1 0-4 0v2" />
                <path d="M20 15v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10" />
                <rect x="12" y="6" width="8" height="5" rx="1" /></svg
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-badge-check-icon lucide-badge-check"
              >
                <path
                  d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </BookHeader>
            <BookTitle>
              <h1>The Blockchain</h1>
            </BookTitle>
            <BookDescription>
              <p>Your Work Secured!</p>
            </BookDescription>
          </Book>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup></script>
