// Cliente HTTP "educado": uma requisição por vez por fonte, com intervalo mínimo entre elas,
// novas tentativas em falhas transitórias, cookies de sessão e decodificação do charset.

export interface ThrottleOptions {
  /** Intervalo mínimo entre o início de duas requisições, em milissegundos. */
  minIntervalMs: number;
}

/** Fila que espaça as requisições. Compartilhe uma instância entre todas as sessões de uma fonte. */
export class Throttle {
  private queue: Promise<void> = Promise.resolve();
  private lastStart = 0;

  constructor(private readonly options: ThrottleOptions) {}

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      const wait = this.lastStart + this.options.minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastStart = Date.now();
      return task();
    });
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

export interface HttpOptions {
  userAgent: string;
  throttle: Throttle;
  /** Charset usado quando a resposta não declara um. */
  defaultCharset?: string;
  timeoutMs?: number;
  /** Tentativas extras em erro de rede ou resposta 5xx/429. */
  retries?: number;
  /** Injetável para testes. */
  fetchFn?: typeof fetch;
}

export interface HttpResponse {
  status: number;
  /** URL final, depois dos redirecionamentos. */
  url: string;
  body: string;
}

const MAX_REDIRECTS = 5;

/** Uma sessão de navegação: guarda cookies entre requisições (ex.: evento ativo no servidor). */
export class HttpSession {
  private readonly cookies = new Map<string, string>();
  private readonly fetchFn: typeof fetch;

  constructor(private readonly options: HttpOptions) {
    this.fetchFn = options.fetchFn ?? fetch;
  }

  get(url: string, referer?: string): Promise<HttpResponse> {
    return this.request('GET', url, undefined, referer);
  }

  postForm(url: string, form: Record<string, string>, referer?: string): Promise<HttpResponse> {
    return this.request('POST', url, new URLSearchParams(form).toString(), referer);
  }

  private async request(
    method: 'GET' | 'POST',
    url: string,
    body: string | undefined,
    referer: string | undefined,
  ): Promise<HttpResponse> {
    const retries = this.options.retries ?? 2;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(2000 * 2 ** (attempt - 1));
      try {
        const response = await this.options.throttle.run(() =>
          this.follow(method, url, body, referer),
        );
        if (response.status >= 500 || response.status === 429) {
          lastError = new Error(`HTTP ${response.status} em ${url}`);
          continue;
        }
        if (response.status >= 400) throw new HttpStatusError(response.status, url);
        return response;
      } catch (error) {
        if (error instanceof HttpStatusError) throw error;
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async follow(
    method: 'GET' | 'POST',
    url: string,
    body: string | undefined,
    referer: string | undefined,
  ): Promise<HttpResponse> {
    let currentMethod = method;
    let currentUrl = url;
    let currentBody = body;
    let currentReferer = referer;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const headers: Record<string, string> = {
        'User-Agent': this.options.userAgent,
        Accept: 'text/html,application/xhtml+xml',
      };
      if (this.cookies.size > 0) {
        headers.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
      }
      if (currentReferer) headers.Referer = currentReferer;
      if (currentBody !== undefined) headers['Content-Type'] = 'application/x-www-form-urlencoded';

      const res = await this.fetchFn(currentUrl, {
        method: currentMethod,
        headers,
        body: currentBody,
        redirect: 'manual',
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 30_000),
      });
      this.storeCookies(res.headers);

      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        await res.arrayBuffer(); // descarta o corpo para liberar a conexão
        currentReferer = currentUrl;
        currentUrl = new URL(location, currentUrl).toString();
        if (res.status !== 307 && res.status !== 308) {
          currentMethod = 'GET';
          currentBody = undefined;
        }
        continue;
      }

      const bytes = new Uint8Array(await res.arrayBuffer());
      return {
        status: res.status,
        url: currentUrl,
        body: decodeBody(bytes, res.headers.get('content-type'), this.options.defaultCharset),
      };
    }
    throw new Error(`Redirecionamentos demais a partir de ${url}`);
  }

  private storeCookies(headers: Headers): void {
    for (const line of headers.getSetCookie()) {
      const pair = line.split(';', 1)[0] ?? '';
      const eq = pair.indexOf('=');
      if (eq > 0) this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
}

export class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} em ${url}`);
    this.name = 'HttpStatusError';
  }
}

/** Decodifica o corpo usando o charset do cabeçalho, da tag meta ou o padrão da fonte. */
export function decodeBody(
  bytes: Uint8Array,
  contentType: string | null,
  defaultCharset = 'utf-8',
): string {
  const fromHeader = /charset=([\w-]+)/i.exec(contentType ?? '')?.[1];
  // A tag meta fica no começo do documento e é ASCII em qualquer charset usado na prática.
  const head = new TextDecoder('ascii').decode(bytes.subarray(0, 4096));
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];
  const charset = fromHeader ?? fromMeta ?? defaultCharset;
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder(defaultCharset).decode(bytes);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
