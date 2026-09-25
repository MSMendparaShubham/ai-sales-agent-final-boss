// Shared in-memory callbacks store for callbacks and API queries
export const demoCallbacks: any[] = [];

export function addDemoCallback(callback: any) {
  demoCallbacks.unshift(callback);
}

export function getDemoCallbacks() {
  return [...demoCallbacks];
}
