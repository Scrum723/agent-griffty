import { Buffer } from "buffer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { WalletRoot } from "./WalletRoot";
import "./styles.css";

(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletRoot>
      <App />
    </WalletRoot>
  </StrictMode>,
);
