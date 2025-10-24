import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import type { UIMessage } from "ai";

import {
  MessageTextPart,
  GuitarPart,
  InvestmentsPart,
  ItemsPart,
  ProposedActionPart,
} from "@/components/message-parts";
import InvestmentAccountCard from "@/components/InvestmentAccountCard";
import InvestmentInsightsCard from "@/components/InvestmentInsightsCard";
import ItemCard from "@/components/example-ItemCard";
const TranscribeButton = lazy(() => import("@/components/transcribe-button"));

import "../demo.index.css";
import MultiModelPanel from "@/components/MultiModelPanel";

function InitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 chat__initial">
      <div className="text-center max-w-3xl mx-auto w-full chat__initial-inner">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-600 text-transparent bg-clip-text uppercase">
          <span className="text-white">TanStack</span> Chat
        </h1>
        <p className="text-gray-400 mb-6 w-2/3 mx-auto text-lg">
          You can ask me about anything, I might or might not have a good
          answer, but you can still ask.
        </p>
        {children}
      </div>
    </div>
  );
}

function ChattingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bottom-0 right-0 left-64 bg-gray-900/80 backdrop-blur-sm border-t border-orange-500/10 chat__footer">
      <div className="max-w-3xl mx-auto w-full px-4 py-3">{children}</div>
    </div>
  );
}

function Messages({
  messages,
  onActionResult,
}: {
  messages: Array<UIMessage>;
  onActionResult?: (action: string, result: unknown) => void;
}) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    // Only scroll if user is near bottom (within 100px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (isNearBottom) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (!messages.length) {
    return null;
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto pb-24 chat__messages"
      onKeyDown={(e) => {
        const target = e.target as HTMLElement;
        const isInput =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement;
        if (isInput && e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="max-w-3xl mx-auto w-full px-4">
        {messages.map(({ id, role, parts }) => (
          <div
            key={id}
            className={`p-4 chat__message ${
              role === "assistant"
                ? "chat__message--assistant bg-gradient-to-r from-orange-500/5 to-red-600/5"
                : "chat__message--user bg-transparent"
            }`}
          >
            <div className="flex items-start gap-4 max-w-3xl mx-auto w-full chat__message-body">
              {role === "assistant" ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 mt-2 flex items-center justify-center text-sm font-medium text-white flex-shrink-0 chat__avatar chat__avatar--assistant">
                  AI
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-medium text-white flex-shrink-0 chat__avatar chat__avatar--user">
                  Y
                </div>
              )}
              <div className="flex-1 chat__content">
                {parts.map((part, index) => {
                  if (part.type === "text") {
                    return <MessageTextPart key={index} text={part.text} />;
                  }
                  if (
                    part.type === "tool-recommendGuitar" &&
                    part.state === "output-available" &&
                    (part.output as { id: string })?.id
                  ) {
                    return (
                      <GuitarPart
                        key={index}
                        id={(part.output as { id: string }).id}
                      />
                    );
                  }
                  if (
                    part.type === "tool-listInvestments" &&
                    part.state === "output-available" &&
                    Array.isArray(part.output as any)
                  ) {
                    return (
                      <InvestmentsPart
                        key={index}
                        accounts={part.output as any[]}
                      />
                    );
                  }
                  if (
                    (part.type === "tool-createInvestmentAccount" ||
                      part.type === "tool-updateInvestmentAccount") &&
                    part.state === "output-available" &&
                    part.output
                  ) {
                    const acc = part.output as any;
                    return (
                      <div
                        key={index}
                        className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--investment"
                      >
                        <InvestmentAccountCard account={acc} />
                      </div>
                    );
                  }
                  if (
                    part.type === "tool-deleteInvestmentAccount" &&
                    part.state === "output-available" &&
                    part.output
                  ) {
                    const { success, id } = part.output as any;
                    return (
                      <div
                        key={index}
                        className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--delete"
                      >
                        <div
                          className={`p-3 rounded-md text-sm ${success ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
                        >
                          {success
                            ? `Investment account ${id} deleted.`
                            : `Failed to delete investment account ${id}.`}
                        </div>
                      </div>
                    );
                  }
                  if (
                    part.type === "tool-getInvestmentInsights" &&
                    part.state === "output-available" &&
                    part.output
                  ) {
                    const { totals, byInstitution, bySector, topHolding } =
                      part.output as any;
                    return (
                      <div
                        key={index}
                        className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--insights"
                      >
                        <InvestmentInsightsCard
                          totals={totals}
                          byInstitution={byInstitution}
                          bySector={bySector}
                          topHolding={topHolding}
                        />
                      </div>
                    );
                  }
                  if (
                    (part.type === "tool-proposeCreateInvestmentAccount" ||
                      part.type === "tool-proposeUpdateInvestmentAccount" ||
                      part.type === "tool-proposeDeleteInvestmentAccount") &&
                    part.state === "output-available" &&
                    part.output &&
                    (part.output as any).type === "proposed-action"
                  ) {
                    const { action, payload } = part.output as any;
                    return (
                      <ProposedActionPart
                        key={index}
                        action={action}
                        payload={payload}
                        onResult={(res) => {
                          try {
                            onActionResult?.(action, res);
                          } catch {}
                        }}
                      />
                    );
                  }
                  if (
                    (part.type === "tool-listItems" ||
                      part.type === "tool-searchItems") &&
                    part.state === "output-available" &&
                    Array.isArray(part.output as any)
                  ) {
                    return (
                      <ItemsPart key={index} items={part.output as any[]} />
                    );
                  }
                  if (
                    (part.type === "tool-recommendItem" ||
                      part.type === "tool-createItem") &&
                    part.state === "output-available" &&
                    part.output
                  ) {
                    const item = part.output as any;
                    return (
                      <div
                        key={index}
                        className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--item"
                      >
                        <ItemCard item={item} />
                      </div>
                    );
                  }
                  if (
                    part.type === "tool-deleteItem" &&
                    part.state === "output-available" &&
                    part.output
                  ) {
                    const { success, id } = part.output as any;
                    return (
                      <div
                        key={index}
                        className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--delete"
                      >
                        <div
                          className={`p-3 rounded-md text-sm ${success ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
                        >
                          {success
                            ? `Item ${id} deleted.`
                            : `Failed to delete item ${id}.`}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPage() {
  const [isClient, setIsClient] = useState(false);
  const chatRootRef = useRef<HTMLDivElement>(null);
  useEffect(() => setIsClient(true), []);
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/demo-chat",
    }),
  });
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rafRef = useRef<number>(null as unknown as number);

  const Layout = messages.length ? ChattingLayout : InitalLayout;

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Debounced textarea height handler
  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;

    // Cancel previous animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Batch DOM reads/writes
    rafRef.current = requestAnimationFrame(() => {
      target.style.height = "auto";
      target.style.height = Math.min(target.scrollHeight, 200) + "px";
    });
  };

  useEffect(() => {
    const el = chatRootRef.current;
    if (!el) return;
    const onSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const submitBtn = target.closest('button[type="submit"]');
      const anchor = target.closest("a[href]");
      if (submitBtn || (anchor && !anchor.getAttribute("data-allow-nav"))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("submit", onSubmit, { capture: true });
    el.addEventListener("click", onClick, { capture: true });
    return () => {
      el.removeEventListener("submit", onSubmit, { capture: true } as any);
      el.removeEventListener("click", onClick, { capture: true } as any);
    };
  }, []);

  return (
    <div
      ref={chatRootRef}
      className="relative flex h-[calc(100vh-32px)] bg-gray-900 chat"
    >
      <div className="flex-1 flex flex-col chat__panel">
        <Messages
          messages={messages}
          onActionResult={(action, res) => {
            try {
              const payload = {
                kind: "action_result",
                action,
                result: res,
              } as const;
              const text = `__action_result__ ${JSON.stringify(payload)}`;
              sendMessage({ text });
            } catch {}
          }}
        />

        <Layout>
          <div className="chat__form">
            <div className="flex space-x-3 max-w-xl mx-auto chat__controls">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type something clever (or don't, we won't judge)..."
                className="w-full rounded-lg border border-orange-500/20 bg-gray-800/50 pl-4 pr-12 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none overflow-hidden shadow-lg chat__input"
                rows={1}
                style={{ minHeight: "44px", maxHeight: "200px" }}
                onInput={handleTextareaInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage({ text: input });
                    setInput("");
                  }
                }}
              />
              {isClient ? (
                <div className="chat__mic">
                  <Suspense fallback={null}>
                    <TranscribeButton
                      onTranscribe={(text) => setInput(`${input} ${text}`)}
                    />
                  </Suspense>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (!input.trim()) return;
                  sendMessage({ text: input });
                  setInput("");
                }}
                disabled={!input.trim()}
                className="p-2 text-orange-500 hover:text-orange-400 disabled:text-gray-500 transition-colors focus:outline-none chat__send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Layout>
        <div className="mt-6" />
        <MultiModelPanel
          onRun={({ models, temperature }) => {
            try {
              const meta = { models, temperature };
              // Send a single chat turn enriched with metadata in text.
              // Server will ignore this in Step 2.
              const text = `__meta__ ${JSON.stringify(meta)}`;
              sendMessage({ text });
            } catch {}
          }}
          messages={messages as any}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: ChatPage,
});
