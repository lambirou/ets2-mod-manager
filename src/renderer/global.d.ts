import type { ManagerApi, ProgressBridge } from "../shared/types";

declare global {
  interface Window {
    manager: ManagerApi;
    progress: ProgressBridge;
  }
}

export {};
