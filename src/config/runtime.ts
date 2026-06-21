export type AppMode = 'prod' | 'local-emulated';
export type SandboxProviderType = 'mock' | 'docker' | 'gcp' | 'emulated';

export interface RuntimeConfig {
  mode: AppMode;
  isLocalEmulation: boolean;
  sandboxProvider: SandboxProviderType;
  googleAuthEnabled: boolean;
  geminiEnabled: boolean;
}

const mode: AppMode = process.env.APP_MODE === 'local-emulated' ? 'local-emulated' : 'prod';
const isLocalEmulation = mode === 'local-emulated';

export function getRuntimeConfig(): RuntimeConfig {
  return {
    mode,
    isLocalEmulation,
    sandboxProvider: isLocalEmulation
      ? 'emulated'
      : (process.env.SANDBOX_PROVIDER as SandboxProviderType | undefined) || 'mock',
    googleAuthEnabled:
      !isLocalEmulation &&
      Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    geminiEnabled: !isLocalEmulation && Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
  };
}
