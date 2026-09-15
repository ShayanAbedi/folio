import { getPreferenceValues } from "@raycast/api";

export interface FathomPreferences {
  authWorkerUrl: string;
  oauthClientId: string;
  useFixtures: boolean;
  enableDevPersonalKey: boolean;
  devPersonalApiKey?: string;
}

export function prefs(): FathomPreferences {
  const p = getPreferenceValues<FathomPreferences>();
  return {
    authWorkerUrl: (p.authWorkerUrl ?? "").trim().replace(/\/+$/, ""),
    oauthClientId: (p.oauthClientId ?? "").trim(),
    useFixtures: Boolean(p.useFixtures),
    enableDevPersonalKey: Boolean(p.enableDevPersonalKey),
    devPersonalApiKey: p.devPersonalApiKey?.trim() || undefined,
  };
}

export type AuthMode = "fixtures" | "dev-personal-key" | "oauth";

export function authMode(): AuthMode {
  const p = prefs();
  if (p.useFixtures) return "fixtures";
  if (p.enableDevPersonalKey && p.devPersonalApiKey) return "dev-personal-key";
  return "oauth";
}
