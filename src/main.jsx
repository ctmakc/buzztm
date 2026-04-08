import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadLocaleContent, resolveInitialLocale } from "./content";
import "./styles.css";

async function bootstrap() {
  const initialLocale = resolveInitialLocale();
  const initialContent = await loadLocaleContent(initialLocale);

  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App initialLocale={initialLocale} initialContent={initialContent} />
    </React.StrictMode>
  );
}

bootstrap();
