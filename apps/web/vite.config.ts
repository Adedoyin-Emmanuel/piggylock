import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow ngrok tunnels so the dev server can be loaded inside MiniPay.
    allowedHosts: [".ngrok.app", ".ngrok-free.dev", ".ngrok-free.app", ".outray.app"],
  },
  build: {
    outDir: "dist",
  },
});
