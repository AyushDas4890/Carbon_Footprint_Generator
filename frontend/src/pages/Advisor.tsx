import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { api, streamChat, type ChatSource, type KnowledgeBase } from '../lib/api';
import { PageHead } from '../components/ui/PageHead';
import { Button } from '../components/ui/Button';

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
      <PageHead
        index="A—01"
        eyebrow="Advisor"
        title={<>Ask the <em>literature</em></>}
        lead="Questions on materials, food, freight or offsets, answered strictly from indexed LCA and IPCC sources, with citations."
      />

      <div className="split">
        <aside className="split-side advisor-side">
          <div className="side-block">
            <h2 className="mono side-title">Knowledge base</h2>
            {kb ? (
              <>
                <p className="kb-count"><span className="live-dot" aria-hidden />{kb.doc_count} document{kb.doc_count === 1 ? '' : 's'} indexed</p>
                <ul className="kb-docs mono">
                  {kb.docs.slice(0, 5).map((d) => <li key={d}>{d}</li>)}
                </ul>
              </>
            ) : kbError ? (
              <p className="muted small">Unavailable: {kbError}</p>
            ) : (
              <div className="loader" aria-label="Loading"><span /><span /><span /></div>
            )}
          </div>
          <div className="side-block">
            <h2 className="mono side-title">Try asking</h2>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => ask(s)} disabled={busy}>{s}</button>
              ))}
            </div>
          </div>
          <div className="side-block">
            <h2 className="mono side-title">How it works</h2>
            <p className="muted small">
              The question is embedded with MiniLM-L6, retrieved from ChromaDB, reranked with a cross-encoder, then answered only from the top chunks — streamed, cited, with conversation memory.
            </p>
          </div>
        </aside>

        <div className="chat">
          <div ref={logRef} className="chat-log" data-lenis-prevent aria-live="polite">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  layout="position"
                  className={`msg msg-${m.role}${m.error ? ' is-error' : ''}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="msg-role mono">{m.role === 'user' ? 'You' : 'Advisor'}</span>
                  <div className="msg-body">
                    {m.text}
                    {m.streaming && <span className="caret" aria-hidden />}
                    {m.sources && m.sources.length > 0 && !m.streaming && (
                      <motion.ol className="sources" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        {m.sources.map((s) => (
                          <li key={s.n}>
                            <span className="mono">[{s.n}]</span>
                            <div>
                              {s.citation || s.source_name} <span className="mono muted">score {s.score}</span>
                              {s.snippet && <p className="muted">{s.snippet}</p>}
                            </div>
                          </li>
                        ))}
                      </motion.ol>
                    )}
                    {m.meta && !m.streaming && <div className="msg-meta mono">{m.meta}</div>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="chat-input">
            <textarea className="textarea" rows={1} maxLength={1000} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask about a material, food, freight mode or offset…" aria-label="Your question" />
            <Button variant="accent" onClick={() => ask(input)} disabled={busy || !input.trim()}>Ask</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
