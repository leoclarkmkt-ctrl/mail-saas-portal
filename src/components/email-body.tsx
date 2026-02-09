"use client";

import { useMemo } from "react";
import { renderPlainTextWithLinks, sanitizeAndLinkifyHtml } from "@/lib/utils/mail-content";

type EmailBodyProps = {
  htmlBody?: string | null;
  textPlain?: string | null;
};

export function EmailBody({ htmlBody, textPlain }: EmailBodyProps) {
  const sanitizedHtml = useMemo(() => {
    if (!htmlBody?.trim()) return null;
    return sanitizeAndLinkifyHtml(htmlBody);
  }, [htmlBody]);

  if (htmlBody?.trim()) {
    return (
      <div
        className="mail-body min-h-[360px] w-full max-w-full whitespace-normal break-words [overflow-wrap:anywhere]"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml ?? "" }}
      />
    );
  }

  if (textPlain?.trim()) {
    return (
      <div className="text-sm text-slate-700 max-w-full whitespace-normal break-words [overflow-wrap:anywhere]">
        <pre className="whitespace-pre-wrap font-sans">
          {renderPlainTextWithLinks(textPlain)}
        </pre>
      </div>
    );
  }

  return null;
}
