import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { api, streamChat, type ChatSource, type KnowledgeBase } from '../lib/api';
import { KineticHeading } from '../components/motion-graphics/KineticHeading';
import { MagneticButton } from '../components/MagneticButton';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
  streaming?: boolean;
  sources?: ChatSource[];
  meta?: string;
}

const SUGGESTIONS = [
  'Why is beef so high-emission?',
  'Best transport mode for low CO₂?',
  'Does recycled aluminum really cut emissions?',
  'Should I plant trees to offset?',
];

const GREETING: Message = {
  id: 0,
  role: 'assistant',
  text: "Hi — I'm grounded in a library of LCA & IPCC sources. Ask me anything about carbon footprints, materials, food, transport, or offsets. I cite my sources, and I'll tell you honestly if my knowledge base doesn't cover it.",
};

export default function Advisor() {
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [kbError, setKbError] = useState('');
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    api.knowledgeBase().then(setKb).catch((e: Error) => setKbError(e.message));
  }, []);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const patch = (id: number, update: Partial<Message> | ((m: Message) => Partial<Message>)) =>
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...(typeof update === 'function' ? update(m) : update) } : m)));

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    const userId = nextId.current++;
    const botId = nextId.current++;
    setMessages((ms) => [...ms, { id: userId, role: 'user', text: q }, { id: botId, role: 'assistant', text: '', streaming: true }]);

    try {
      let received = false;
      for await (const evt of streamChat(q)) {
        if (evt.type === 'token') {
          received = true;
          patch(botId, (m) => ({ text: m.text + evt.text }));
        } else if (evt.type === 'sources') {
          patch(botId, { sources: evt.sources, meta: `Retrieved ${evt.retrieved_count} chunks · ${evt.latency_ms} ms` });
        } else if (evt.type === 'error') {
          patch(botId, { text: evt.message || 'Unknown error', error: true, streaming: false });
          return;
        }
      }
      patch(botId, received ? { streaming: false } : { text: 'Empty response from server.', error: true, streaming: false });
    } catch (streamErr) {
      // Proxies can buffer or break SSE; fall back to the non-streaming endpoint.
      console.warn('Streaming failed, falling back to /api/advisor/chat/', streamErr);
      try {
        const r = await api.chat(q);
        patch(botId, { text: r.answer, sources: r.sources, meta: `Retrieved ${r.retrieved_count} chunks · ${r.latency_ms} ms`, streaming: false });
      } catch (e) {
        patch(botId, { text: (e as Error).message, error: true, streaming: false });
      }
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  return (
    <div className="container page-pad">
      <span className="eyebrow">RAG intelligence</span>
      <KineticHeading as="h1" className="heading" trigger="load" delay={0.6}>
        Sustainability <span className="gradient-text">advisor</span>
      </KineticHeading>
      <p className="lead" style={{ marginTop: '0.75rem', marginBottom: '2.5rem' }}>
        Ask anything about carbon footprints, materials, transport, or offsets. Every answer is grounded in indexed LCA &amp; IPCC sources, with citations.
      </p>

      <div className="split-layout">
        <aside className="stack sticky">
          <div className="glass">
            <div className="card-title">Knowledge base</div>
            {kb ? (
              <>
                <span className="pill" style={{ color: 'var(--green)' }}>
                  <span className="pulse-dot" style={{ marginRight: 8, alignSelf: 'center' }} />
                  {kb.doc_count} document{kb.doc_count === 1 ? '' : 's'} indexed
                </span>
                <ul style={{ listStyle: 'none', marginTop: '1rem', fontSize: '0.85rem' }} className="secondary">
                  {kb.docs.slice(0, 5).map((d) => (
                    <li key={d} style={{ padding: '0.35rem 0', borderBottom: '1px solid var(--glass-border)' }}>📄 {d}</li>
                  ))}
                </ul>
              </>
            ) : kbError ? (
              <p className="muted" style={{ fontSize: '0.85rem' }}>Unavailable: {kbError}</p>
            ) : (
              <div className="spinner" style={{ width: 24, height: 24 }} />
            )}
          </div>
          <div className="glass">
            <div className="card-title">Try asking</div>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => ask(s)} disabled={busy}>{s}</button>
            ))}
          </div>
          <div className="glass">
            <div className="card-title">How it works</div>
            <p className="secondary" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
              Your question is embedded with <b style={{ color: 'var(--green)' }}>MiniLM-L6</b>, retrieved from ChromaDB, reranked with a cross-encoder, then answered strictly from the top chunks — streamed, with citations and conversation memory.
            </p>
          </div>
        </aside>

        <div className="glass chat">
          <div ref={logRef} className="chat-log" data-lenis-prevent>
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  className={`bubble ${m.role}${m.error ? ' error' : ''}`}
                  initial={{ opacity: 0, y: 20, scale: 0.96, rotateX: -20 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  style={{ originX: m.role === 'user' ? 1 : 0 }}
                >
                  {m.text}
                  {m.streaming && <span className="typing" />}
                  {m.sources && m.sources.length > 0 && !m.streaming && (
                    <motion.div className="sources" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>Sources</div>
                      {m.sources.map((s) => (
                        <div className="source" key={s.n}>
                          <b>[{s.n}]</b> {s.citation || s.source_name} <span style={{ opacity: 0.7 }}>· score {s.score}</span>
                          {s.snippet && <div style={{ marginTop: '0.3rem', opacity: 0.85 }}>{s.snippet}</div>}
                        </div>
                      ))}
                    </motion.div>
                  )}
                  {m.meta && !m.streaming && <div className="muted" style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>{m.meta}</div>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="chat-input">
            <textarea className="textarea" rows={1} maxLength={1000} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask about a material, food, transport mode, or offset…" aria-label="Your question" />
            <MagneticButton onClick={() => ask(input)} disabled={busy || !input.trim()}>Ask →</MagneticButton>
          </div>
        </div>
      </div>
    </div>
  );
}
