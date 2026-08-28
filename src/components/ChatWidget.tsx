import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Github, Linkedin, Mail, RotateCw, Send, X } from 'lucide-react';

/* ----------------------------------------------------------------------------
   Floating portfolio assistant. Answers are produced by /api/chat (a Cloudflare
   Pages Function) and grounded in functions/_kb.ts — this component never talks
   to a model directly and holds no key.

   Three constraints from the surrounding app that this must not break:
   - TargetCursor sits at z-index 9999 with mix-blend-mode:difference, so
     everything here stays well below it and the brackets draw over the panel.
   - The Lenis instance is local to App.tsx, so the scroll container opts out
     with data-lenis-prevent rather than calling lenis.stop().
   - Mounted as a sibling of the sections, never a wrapper — TargetCursor walks
     ancestors and a transformed wrapper would break its positioning.
---------------------------------------------------------------------------- */

const GREETING_ID = 'greeting';
const GREETING =
  "Hi — I'm J.A.R.V.I.S, Mohammed's portfolio assistant. Ask me about his projects, his stack, or how to reach him.";

const SUGGESTIONS = ['What has he built with LLMs?', 'Quel est son stack ?', 'Is he open to work?'];

const MAX_CHARS = 600;
const HISTORY_LIMIT = 6;
const STORAGE_KEY = 'mf-chat';
const HINT_SEEN_KEY = 'mf-chat-hint-seen';
const TYPE_MS = 18;
const HINT_DELAY_MS = 2200;
const HINT_AUTOHIDE_MS = 6000;

const CONTACT = [
  { label: 'mr.fakir.mohammed@gmail.com', href: 'mailto:mr.fakir.mohammed@gmail.com', Icon: Mail },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/mohammed-fakir', Icon: Linkedin },
  { label: 'GitHub', href: 'https://github.com/Symooomzip', Icon: Github },
];

type Role = 'user' | 'assistant';
type ChatStatus = 'idle' | 'sending' | 'error';
type ErrorCode = 'rate_limited' | 'timeout' | 'network' | 'ai_unavailable' | 'bad_request' | 'unknown';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

const ERROR_COPY: Record<ErrorCode, { text: string; retryable: boolean }> = {
  rate_limited: { text: 'Lots of questions coming in right now — give it a minute?', retryable: true },
  timeout: { text: 'That took too long to come back.', retryable: true },
  network: { text: 'The connection dropped on the way.', retryable: true },
  bad_request: { text: "I couldn't read that one — mind rephrasing?", retryable: true },
  ai_unavailable: { text: 'The assistant is offline right now.', retryable: false },
  unknown: { text: 'The assistant is offline right now.', retryable: false },
};

const newId = () => Math.random().toString(36).slice(2);

function loadStored(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return []; // Safari private mode throws on sessionStorage
  }
}

function seenHint(): boolean {
  try {
    return sessionStorage.getItem(HINT_SEEN_KEY) === '1';
  } catch {
    return true; // storage unavailable — don't risk pestering with the hint every load
  }
}

function markHintSeen() {
  try {
    sessionStorage.setItem(HINT_SEEN_KEY, '1');
  } catch {
    /* fine if this doesn't persist — worst case the hint reappears next load */
  }
}

/**
 * The FAB's icon when closed: an abstract reactor core, not a literal
 * message-bubble glyph — a visitor scanning the page notices *movement* in a
 * way a static icon doesn't get. Two counter-rotating dashed rings around a
 * breathing center dot; folds to a still ring under reduced-motion.
 */
function ReactorCore({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <motion.circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="white"
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeDasharray="3 2.4"
        animate={reduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '12px 12px' }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="6.5"
        stroke="white"
        strokeWidth="1.2"
        strokeDasharray="2.2 1.8"
        animate={reduceMotion ? {} : { rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '12px 12px' }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="2"
        fill="white"
        animate={reduceMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '12px 12px' }}
      />
    </svg>
  );
}

export default function ChatWidget() {
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: GREETING_ID, role: 'assistant', content: GREETING },
    ...loadStored(),
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<ErrorCode | null>(null);
  const [failures, setFailures] = useState(0);
  const [typing, setTyping] = useState<{ id: string; shown: number } | null>(null);
  // The hero already owns the bottom-right corner with its "Contact Me" CTA, so
  // the bubble stays out of the way until the visitor scrolls past it.
  const [visible, setVisible] = useState(false);
  // A once-per-session nudge — most people don't register a corner icon by
  // itself; a call-out that speaks up (once) is what actually gets noticed.
  const [hint, setHint] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const lastSent = useRef<string>('');

  // Two clean failures in a row is enough — an assistant a recruiter retries
  // three times is a worse signal than one that says "here's his email".
  const offline = failures >= 2;
  const canSend = status !== 'sending' && !offline && input.trim().length > 0;
  const showFab = visible || open;

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter((m) => m.id !== GREETING_ID)));
    } catch {
      /* storage unavailable — the chat still works, it just won't survive a refresh */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, status, error]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    // Lenis drives scroll but still emits native scroll events (App.tsx relies
    // on the same thing), so a plain listener is enough here.
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fire the hint once, a beat after the FAB first appears, and never again
  // this session — repeating it would read as nagging, not as help.
  useEffect(() => {
    if (!visible || open || seenHint()) return;
    const show = setTimeout(() => {
      setHint(true);
      markHintSeen();
    }, HINT_DELAY_MS);
    return () => clearTimeout(show);
  }, [visible, open]);

  useEffect(() => {
    if (!hint) return;
    const hide = setTimeout(() => setHint(false), HINT_AUTOHIDE_MS);
    return () => clearTimeout(hide);
  }, [hint]);

  // typewriter reveal — gives streaming's feel without streaming's error semantics
  useEffect(() => {
    if (!typing) return;
    const msg = messages.find((m) => m.id === typing.id);
    if (!msg || typing.shown >= msg.content.length) {
      if (typing) setTyping(null);
      return;
    }
    const t = setTimeout(() => setTyping({ id: typing.id, shown: typing.shown + 1 }), TYPE_MS);
    return () => clearTimeout(t);
  }, [typing, messages]);

  const closePanel = useCallback(() => {
    setOpen(false);
    abortRef.current?.abort();
    fabRef.current?.focus();
  }, []);

  const openPanel = useCallback(() => {
    setOpen(true);
    setHint(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => inputRef.current?.focus(), reduceMotion ? 0 : 180);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, closePanel, reduceMotion]);

  async function send(text: string, retry = false) {
    const trimmed = text.trim();
    if (!trimmed || status === 'sending' || offline) return;

    lastSent.current = trimmed;
    setError(null);
    setInput('');
    setStatus('sending');

    // A retry re-issues the same question, so the user's bubble is already in
    // the transcript — appending it again would show it twice.
    const history = retry
      ? messages
      : [...messages, { id: newId(), role: 'user' as const, content: trimmed }];
    if (!retry) setMessages(history);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: history
            .filter((m) => m.id !== GREETING_ID)
            .slice(-HISTORY_LIMIT)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      // On plain `vite dev` this route 404s to Vite's HTML page, and .json()
      // would throw "Unexpected token '<'". Check the shape before parsing.
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (!isJson) throw new Error('ai_unavailable');

      const data = (await res.json()) as { reply?: string; error?: { code?: ErrorCode } };
      if (!res.ok || !data.reply) throw new Error(data.error?.code ?? 'unknown');

      const id = newId();
      setMessages((prev) => [...prev, { id, role: 'assistant', content: data.reply as string }]);
      if (!reduceMotion) setTyping({ id, shown: 0 });
      setStatus('idle');
      setFailures(0);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const code = (err instanceof Error ? err.message : 'unknown') as ErrorCode;
      setError(code in ERROR_COPY ? code : 'unknown');
      setStatus('error');
      setFailures((n) => n + 1);
    }
  }

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 20, scale: 0.94 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.96 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
      };

  return (
    <>
      {/* mobile scrim */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm sm:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            {...panelMotion}
            style={{ transformOrigin: 'bottom right' }}
            role="dialog"
            aria-label="Portfolio assistant"
            className="fixed inset-0 z-[9010] flex flex-col border-[#D7E2EA]/10 bg-[#16181A] sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(560px,70vh)] sm:w-[min(400px,calc(100vw-2.5rem))] sm:rounded-2xl sm:border sm:shadow-2xl sm:shadow-black/50"
          >
            {/* header */}
            <div className="relative flex flex-none items-center justify-between px-4 py-3.5">
              <div
                className="absolute inset-x-0 bottom-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, #B600A8 30%, #7621B0 70%, transparent)',
                }}
              />
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[.2em] text-[#D7E2EA]/60">
                  J.A.R.V.I.S
                </div>
                <div className="mt-0.5 text-[11px] text-[#D7E2EA]/35">
                  Mohammed&apos;s portfolio assistant
                </div>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close assistant"
                className="cursor-target rounded-lg p-1.5 text-[#D7E2EA]/50 transition-colors hover:bg-white/5 hover:text-[#D7E2EA]"
              >
                <X size={17} />
              </button>
            </div>

            {/* messages */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {messages.map((m) => {
                const shown =
                  typing?.id === m.id ? m.content.slice(0, typing.shown) : m.content;
                return (
                  <motion.div
                    key={m.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-[#7621B0] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white'
                          : 'max-w-[88%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#D7E2EA]/90'
                      }
                    >
                      {shown}
                      {typing?.id === m.id && (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-[#B600A8]" />
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {status === 'sending' && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-3">
                    {[0, 0.15, 0.3].map((delay) => (
                      <motion.span
                        key={delay}
                        className="h-1.5 w-1.5 rounded-full bg-[#B600A8]"
                        animate={reduceMotion ? {} : { y: [0, -4, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* a failure still leaves the visitor with a way to reach him */}
              {error && (
                <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-3.5 py-3">
                  <p className="text-[13.5px] leading-relaxed text-[#D7E2EA]/90">
                    {ERROR_COPY[error].text}
                  </p>
                  {ERROR_COPY[error].retryable && !offline ? (
                    <button
                      type="button"
                      onClick={() => send(lastSent.current, true)}
                      className="cursor-target mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#D7E2EA]/20 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#D7E2EA]/70 transition-colors hover:border-[#B600A8]/50 hover:text-[#D7E2EA]"
                    >
                      <RotateCw size={11} /> Retry
                    </button>
                  ) : (
                    <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#D7E2EA]/40">
                        Reach him directly
                      </p>
                      {CONTACT.map(({ label, href, Icon }) => (
                        <a
                          key={href}
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          className="cursor-target flex items-center gap-2 text-[12.5px] text-[#D7E2EA]/70 transition-colors hover:text-[#B600A8]"
                        >
                          <Icon size={13} /> {label}
                        </a>
                      ))}
                      <a
                        href="/cv.pdf"
                        download="CV_Mohammed_Fakir.pdf"
                        className="cursor-target flex items-center gap-2 text-[12.5px] text-[#D7E2EA]/70 transition-colors hover:text-[#B600A8]"
                      >
                        <Mail size={13} className="opacity-0" /> Download CV
                      </a>
                    </div>
                  )}
                </div>
              )}

              {messages.length === 1 && status === 'idle' && !error && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="cursor-target rounded-full border border-[#D7E2EA]/15 px-2.5 py-1.5 font-mono text-[10.5px] text-[#D7E2EA]/60 transition-colors hover:border-[#B600A8]/50 hover:text-[#D7E2EA]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* composer */}
            {!offline && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSend) send(input);
                }}
                className="flex-none border-t border-white/10 p-3"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (canSend) send(input);
                      }
                    }}
                    rows={1}
                    maxLength={MAX_CHARS}
                    placeholder="Ask about his work…"
                    className="max-h-24 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13.5px] text-[#D7E2EA] outline-none transition-colors placeholder:text-[#D7E2EA]/30 focus:border-[#B600A8]/50"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send message"
                    className="cursor-target flex-none rounded-xl p-2.5 text-white transition-opacity disabled:opacity-30"
                    style={{
                      background:
                        'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
                {input.length > MAX_CHARS - 200 && (
                  <div className="mt-1 text-right font-mono text-[10px] text-[#D7E2EA]/35">
                    {input.length} / {MAX_CHARS}
                  </div>
                )}
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* one-shot discovery nudge, dismissed by opening the chat or by itself after a few seconds */}
      <AnimatePresence>
        {hint && !open && (
          <motion.button
            type="button"
            onClick={openPanel}
            initial={{ opacity: 0, x: 8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="cursor-target fixed bottom-[26px] right-[76px] z-[9020] flex items-center gap-2 whitespace-nowrap rounded-full border border-[#D7E2EA]/15 bg-[#16181A] py-2.5 pl-3.5 pr-3 text-left shadow-lg shadow-black/40 sm:bottom-[38px] sm:right-[92px]"
          >
            <span className="font-mono text-[11px] tracking-wide text-[#D7E2EA]/85">
              Ask J.A.R.V.I.S about Mohammed
            </span>
            <span
              className="h-1.5 w-1.5 flex-none rounded-full"
              style={{ background: '#B600A8', boxShadow: '0 0 6px 1px rgba(182,0,168,.7)' }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* FAB — always mounted so Escape can return focus to it, and so the ref
          stays stable (a ref on a direct AnimatePresence child warns in React 18) */}
      <motion.button
        ref={fabRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-label={open ? 'Close assistant' : 'Ask J.A.R.V.I.S about Mohammed'}
        aria-expanded={open}
        aria-hidden={!showFab}
        tabIndex={showFab ? 0 : -1}
        animate={
          showFab
            ? { opacity: 1, scale: 1, y: 0 }
            : reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.6, y: 10 }
        }
        whileHover={reduceMotion || !showFab ? {} : { scale: 1.06 }}
        whileTap={reduceMotion || !showFab ? {} : { scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`cursor-target fixed bottom-5 right-5 z-[9020] grid h-14 w-14 place-items-center rounded-full text-white shadow-lg shadow-black/40 sm:bottom-8 sm:right-8 ${
          open ? 'max-sm:hidden' : 'orb-pulse'
        }`}
        style={{
          background:
            'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
          pointerEvents: showFab ? 'auto' : 'none',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
            className="grid place-items-center"
          >
            {open ? <X size={22} /> : <ReactorCore reduceMotion={!!reduceMotion} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  );
}
