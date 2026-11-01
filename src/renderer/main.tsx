import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw Error("Élément racine introuvable");
createRoot(container).render(<App />);
