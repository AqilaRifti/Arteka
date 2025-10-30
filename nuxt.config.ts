// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss()],
  },
  modules: [
    "@nuxt/image",
    "shadcn-nuxt",
    "@clerk/nuxt",
    "@nuxtjs/color-mode",
  ],
  css: ["~/assets/css/tailwind.css"],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "~/components/ui"
     */
    componentDir: "~/components/ui",
  },

  clerk: {
    appearance: {
      variables: {
        colorPrimary: "#7C3AED",
      },
    },
    afterSignInUrl: "/dashboard",
    afterSignUpUrl: "/dashboard",
  },
  runtimeConfig: {
    // Private keys (server-only)
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
    pinataJwtKey: process.env.PINATA_JWT_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

    // Public keys (exposed to client)
    public: {
      clerkPublishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      walletConnectProjectId:
        process.env.WALLETCONNECT_PROJECT_ID ||
        "109ea4071c5bce96bc81b5ec782b49d7",
      contractAddress:
        process.env.CONTRACT_ADDRESS ||
        "0x1D840A569205Dc9dF973Cfb21e0e6adAe6bb5598",
      sepoliaRpcUrl:
        process.env.SEPOLIA_RPC_URL ||
        "https://sepolia.infura.io/v3/fc854b36bd1044cbb4b7f30a5f9134c3",
      supabaseUrl: "https://cozhneczrqtxlugkubte.supabase.co",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
});
