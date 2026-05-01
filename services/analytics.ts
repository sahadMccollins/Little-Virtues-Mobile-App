export const logEvent = (eventName: string, params?: Record<string, any>) => {
  console.log(`[ANALYTICS] Event Fired: ${eventName}`);
  if (params) {
    console.log(`[ANALYTICS] Payload:`, JSON.stringify(params, null, 2));
  }
};
