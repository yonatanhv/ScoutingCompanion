import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
// For development, we'll disable service worker to avoid registration failures
// In production, this would be enabled
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration disabled during development');
      });
  });
}
*/

createRoot(document.getElementById("root")!).render(<App />);
