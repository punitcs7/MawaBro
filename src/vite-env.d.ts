/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVEKIT_URL: string;
  readonly LIVEKIT_API_KEY?: string;
  readonly LIVEKIT_API_SECRET?: string;
  readonly VITE_LIVEKIT_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
