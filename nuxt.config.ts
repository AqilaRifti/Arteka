// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ["@nuxt/image", "shadcn-nuxt", "@clerk/nuxt", "@nuxtjs/color-mode"],
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
    // Private keys (server-side only)
    private: {
      encryptionKey:
        process.env.ENCRYPTION_KEY ||
        "0xca932885c828487cc5e6117a1d5fcf8131cf234288410cf5ca55a5ee49639cba",
    },

    // Public keys (exposed to client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },

    // Server-side only
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

    // Blockchain config
    sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
    artekaContractAddress: process.env.ARTEKA_CONTRACT_ADDRESS,
    marketplaceContractAddress: process.env.MARKETPLACE_CONTRACT_ADDRESS,
    messagingContractAddress: process.env.MESSAGING_CONTRACT_ADDRESS,

    // Pinata config
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
    pinataJwtKey: process.env.PINATA_JWT_KEY,
  },
});