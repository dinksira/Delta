/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NEXT_PUBLIC_API_BASE_URL?: string;
    }
  }
}
/** ################################ /COMPONENT ############################# */
