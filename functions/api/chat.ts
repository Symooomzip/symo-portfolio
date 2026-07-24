import { FEW_SHOT, SYSTEM_PROMPT } from '../_kb';

interface Env {
  AI?: Ai;
  /** set in .dev.vars to develop without spending neurons — see README */
  CHAT_MOCK?: string;
}

/**
 * Swap candidates — re-run the guardrail tests in the plan after changing:
 *   '@cf/zai-org/glm-4.7-flash'            better Darija odds, unverified guardrails
 *   '@cf/meta/llama-3.1-8b-instruct-fast'  cheapest, weakest instruction-following
 */
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const MAX_MESSAGES = 6;
const MAX_CHARS = 600;
const MAX_TOKENS = 300;
const TIMEOUT_MS = 20_000;

type ErrorCode = 'bad_request' | 'rate_limited' | 'ai_unavailable' | 'timeout' | 'unknown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const fail = (code: ErrorCode, status: number) => json({ error: { code } }, status);

/** Requests from another site are the realistic abuse vector; a missing Origin (curl) is fine. */
function originAllowed(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'symo-portfolio.pages.dev' ||
      hostname.endsWith('.symo-portfolio.pages.dev') // preview deployments
    );
  } catch {
    return false;
  }
}

function validate(body: unknown): ChatMessage[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const { messages } = body as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null;
  }
  const clean: ChatMessage[] = [];
  for (const m of messages) {
    if (typeof m !== 'object' || m === null) return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string') return null;
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_CHARS) return null;
    clean.push({ role, content: trimmed });
  }
  return clean;
}

/**
 * The model occasionally ignores the "plain text only" rule, and under
 * pressure it drifts into first person. Buffering the whole response (rather
 * than streaming) is what makes this cleanup possible at all.
 */
function tidy(raw: string): string {
  const text = raw
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim();
  if (/\b(?:I|my|me)\s+(?:built|created|developed|worked|designed)\b/i.test(text)) {
    console.warn('[chat] first-person leak in model output');
  }
  return text;
}

const mockReply = (mock: string): Response => {
  const forced = mock.replace(/^error_/, '');
  if (mock.startsWith('error_')) {
    const status =
      forced === 'rate_limited' ? 429 : forced === 'timeout' ? 504 : forced === 'bad_request' ? 400 : 503;
    return fail(forced as ErrorCode, status);
  }
  return json({
    reply:
      'This is a mocked reply so the UI can be developed without spending neurons. Mohammed is a Data Scientist and AI Engineer based in Casablanca.',
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!originAllowed(request)) return fail('bad_request', 403);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('bad_request', 400);
    }

    const messages = validate(body);
    if (!messages) return fail('bad_request', 400);

    if (env.CHAT_MOCK) {
      await new Promise((r) => setTimeout(r, 1200));
      return mockReply(env.CHAT_MOCK);
    }

    // Undefined on any deployment created before the dashboard binding was
    // added, and on preview environments where it was never added at all.
    if (!env.AI) {
      console.error('[chat] AI binding missing — add it in the Pages dashboard');
      return fail('ai_unavailable', 503);
    }

    const result = await Promise.race([
      env.AI.run(MODEL, {
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...FEW_SHOT, ...messages],
        max_tokens: MAX_TOKENS,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('__timeout__')), TIMEOUT_MS),
      ),
    ]);

    const reply = tidy(String((result as { response?: unknown })?.response ?? ''));
    if (!reply) return fail('ai_unavailable', 503);

    return json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === '__timeout__') return fail('timeout', 504);
    console.error('[chat]', message);
    if (/quota|limit|capacity|exceed|429/i.test(message)) return fail('rate_limited', 429);
    return fail('ai_unavailable', 503);
  }
};
