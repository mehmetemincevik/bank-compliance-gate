// env: LLM_PROVIDER (anthropic | openai-compatible), LLM_MODEL, LLM_API_KEY, LLM_BASE_URL
export interface LlmClient {
  readonly label: string;
  json<T>(system: string, user: string): Promise<T>;
}

const TIMEOUT_MS = 120_000;

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('geçersiz LLM yanıtı: ' + cleaned.slice(0, 200));
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LLM hatası (${res.status}): ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

class AnthropicClient implements LlmClient {
  readonly label: string;
  constructor(private readonly key: string, private readonly model: string) {
    this.label = `anthropic/${model}`;
  }
  async json<T>(system: string, user: string): Promise<T> {
    const data = (await post(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': this.key, 'anthropic-version': '2023-06-01' },
      { model: this.model, max_tokens: 4000, temperature: 0, system, messages: [{ role: 'user', content: user }] },
    )) as { content: { type: string; text?: string }[] };
    return parseJson<T>(data.content.map((c) => c.text ?? '').join(''));
  }
}

class OpenAiCompatibleClient implements LlmClient {
  readonly label: string;
  constructor(private readonly baseUrl: string, private readonly key: string | undefined, private readonly model: string) {
    this.label = `${new URL(baseUrl).host}/${model}`;
  }
  async json<T>(system: string, user: string): Promise<T> {
    const data = (await post(
      `${this.baseUrl.replace(/\/$/, '')}/chat/completions`,
      this.key ? { authorization: `Bearer ${this.key}` } : {},
      {
        model: this.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      },
    )) as { choices: { message: { content: string } }[] };
    return parseJson<T>(data.choices[0]?.message?.content ?? '');
  }
}

export function createLlmClient(): LlmClient | undefined {
  const provider = process.env.LLM_PROVIDER;
  if (!provider) return undefined;
  const model = process.env.LLM_MODEL;
  if (!model) throw new Error('LLM_MODEL eksik');
  const key = process.env.LLM_API_KEY;

  if (provider === 'anthropic') {
    if (!key) throw new Error('LLM_API_KEY eksik');
    return new AnthropicClient(key, model);
  }
  if (provider === 'openai-compatible') {
    const base = process.env.LLM_BASE_URL;
    if (!base) throw new Error('LLM_BASE_URL eksik');
    return new OpenAiCompatibleClient(base, key, model);
  }
  throw new Error(`geçersiz LLM_PROVIDER: ${provider}`);
}
