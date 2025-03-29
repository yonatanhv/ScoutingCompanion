/// <reference lib="webworker" />

// Ensure ServiceWorkerGlobalScope is available
declare interface ServiceWorkerGlobalScope {
  // Base properties from WorkerGlobalScope
  self: ServiceWorkerGlobalScope;
  
  // ServiceWorkerGlobalScope specific properties
  clients: Clients;
  registration: ServiceWorkerRegistration;
  serviceWorker: ServiceWorker;
  skipWaiting(): Promise<void>;
  
  // Service worker events
  onactivate: (event: ExtendableEvent) => void;
  onfetch: (event: FetchEvent) => void;
  oninstall: (event: ExtendableEvent) => void;
  onmessage: (event: ExtendableMessageEvent) => void;
  
  // Add any custom methods/properties as needed
}

// Ensure the file is treated as a module to avoid name conflicts
export {};