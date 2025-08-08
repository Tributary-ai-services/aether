/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AETHER_API_BASE: string
  readonly VITE_AETHER_API_URL: string
  readonly VITE_KEYCLOAK_URL: string
  readonly VITE_DEV_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}