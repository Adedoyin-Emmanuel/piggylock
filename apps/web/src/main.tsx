import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import App from "./app.tsx";
import "./index.css";
import "./lib/theme.ts";
import { config } from "./lib/wagmi.ts";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{ top: "max(env(safe-area-inset-top), 12px)" }}
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "0.9rem",
              boxShadow: "0 8px 30px rgb(0 0 0 / 0.12)",
              fontSize: "14px",
              fontWeight: 500,
              maxWidth: "400px",
              padding: "10px 14px",
            },
            success: { iconTheme: { primary: "var(--primary)", secondary: "var(--primary-foreground)" } },
            error: { duration: 6000, iconTheme: { primary: "var(--destructive)", secondary: "#fff" } },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
