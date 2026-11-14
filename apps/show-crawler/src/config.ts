import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export interface Config {
  supabaseUrl: string | null;
  supabaseServiceRoleKey: string | null;
  breeds: string[];
  dogRegistrations: string[];
  minIntervalMs: number;
  userAgent: string;
  dataDir: string;
}

/** Lê `.env` (se existir) sem sobrescrever variáveis já definidas no ambiente. */
export function loadEnvFile(file = join(appRoot, '.env')): void {
  let content: string;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of content.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trimStart().startsWith('#')) continue;
    const key = m[1] as string;
    const value = (m[2] ?? '').replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const list = (value: string | undefined) =>
    (value ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  const interval = Number(env.CRAWLER_MIN_INTERVAL_MS);

  return {
    supabaseUrl: env.SUPABASE_URL?.trim() || null,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null,
    breeds: list(env.CRAWLER_BREEDS).length > 0 ? list(env.CRAWLER_BREEDS) : ['SHIBA'],
    dogRegistrations: list(env.CRAWLER_DOG_REGISTRATIONS),
    // Nunca abaixo de meio segundo, para não sobrecarregar a fonte.
    minIntervalMs: Number.isFinite(interval) && interval >= 500 ? interval : 1500,
    // Identifica-se como crawler, com um nome genérico: nada no tráfego aponta para o canil.
    userAgent: 'DogsCrawler/0.1',
    dataDir: join(appRoot, 'data'),
  };
}
