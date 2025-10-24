import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useMemoizedMarkdown } from "@/hooks/useMemoizedMarkdown";
import TTSButton from "../tts-button";

function normalizeImageSrc(src?: string): string | undefined {
  if (!src) return src;
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const url = new URL(src, base);
    const filename = url.pathname.split("/").pop() || "";
    const isGuitarImage = /^example-guitar-.*\.(jpg|jpeg|png|webp)$/i.test(
      filename
    );
    if (isGuitarImage) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : url.origin;
      return `${origin}/${filename}`;
    }
    return url.href;
  } catch {
    return src;
  }
}

export const MessageTextPart = React.memo(({ text }: { text: string }) => {
  const memoizedText = useMemoizedMarkdown(text);

  return (
    <div className="flex-1 min-w-0">
      <ReactMarkdown
        className="prose dark:prose-invert max-w-none chat__markdown"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
        components={{
          img: ({ src, ...props }) => (
            <img src={normalizeImageSrc(src)} {...props} />
          ),
        }}
      >
        {memoizedText}
      </ReactMarkdown>
      <div className="flex justify-end mt-2 chat__tts">
        <TTSButton text={memoizedText} />
      </div>
    </div>
  );
});

MessageTextPart.displayName = "MessageTextPart";
