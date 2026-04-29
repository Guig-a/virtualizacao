import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { VirtualListDemo } from "@/components/VirtualListDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VirtualListDemo />
  </StrictMode>,
);
