"use client";

import type { ReactNode } from "react";

export type AnnouncementContentProps = {
  content: unknown;
  excerpt?: string | null;
  fallback?: string;
  className?: string;
};

type TiptapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

const DEFAULT_FALLBACK = "Content preview is unavailable.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSafeUrl(url?: string | null) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function renderTextNode(node: TiptapNode, key: string): { element: ReactNode; supported: boolean } {
  let supported = true;
  let output: ReactNode = node.text ?? "";
  const marks = node.marks ?? [];

  marks.forEach((mark, index) => {
    const markKey = `${key}-mark-${index}`;
    switch (mark.type) {
      case "bold":
        output = <strong key={markKey}>{output}</strong>;
        break;
      case "italic":
        output = <em key={markKey}>{output}</em>;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        if (isSafeUrl(href)) {
          output = (
            <a
              key={markKey}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              {output}
            </a>
          );
        } else {
          supported = false;
        }
        break;
      }
      default:
        supported = false;
    }
  });

  return { element: output, supported };
}

function renderNodes(nodes: TiptapNode[] | undefined, keyPrefix: string) {
  let supported = true;
  const children = (nodes ?? []).map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!node || typeof node !== "object") {
      supported = false;
      return null;
    }

    switch (node.type) {
      case "doc": {
        const result = renderNodes(node.content, key);
        if (!result.supported) supported = false;
        return <div key={key}>{result.nodes}</div>;
      }
      case "paragraph": {
        const result = renderNodes(node.content, key);
        if (!result.supported) supported = false;
        return (
          <p key={key} className="mb-3 last:mb-0">
            {result.nodes}
          </p>
        );
      }
      case "heading": {
        const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
        const Tag = `h${Math.min(Math.max(level, 1), 6)}` as keyof JSX.IntrinsicElements;
        const result = renderNodes(node.content, key);
        if (!result.supported) supported = false;
        return (
          <Tag key={key} className="mb-3 text-lg font-semibold text-slate-900">
            {result.nodes}
          </Tag>
        );
      }
      case "text": {
        const result = renderTextNode(node, key);
        if (!result.supported) supported = false;
        return <span key={key}>{result.element}</span>;
      }
      case "bulletList": {
        const result = renderNodes(node.content, key);
        if (!result.supported) supported = false;
        return (
          <ul key={key} className="mb-3 list-disc space-y-1 pl-5">
            {result.nodes}
          </ul>
        );
      }
      case "orderedList": {
        const result = renderNodes(node.content, key);
        if (!result.supported) supported = false;
        return (
          <ol key={key} className="mb-3 list-decimal space-y-1 pl-5">
            {result.nodes}
          </ol>
        );
      }
      case "listItem": {
        const result = renderNodes(node.content, key);
        if (!result.supported) supported = false;
        return (
          <li key={key} className="text-sm text-slate-700">
            {result.nodes}
          </li>
        );
      }
      case "image": {
        const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
        if (!isSafeUrl(src)) {
          supported = false;
          return null;
        }
        const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
        return (
          <img
            key={key}
            src={src}
            alt={alt}
            className="mb-3 max-h-80 w-full rounded-lg border border-slate-200 object-cover"
          />
        );
      }
      case "hardBreak": {
        return <br key={key} />;
      }
      default:
        supported = false;
        return null;
    }
  });

  return { nodes: children, supported };
}

export function AnnouncementContent({ content, excerpt, fallback, className }: AnnouncementContentProps) {
  if (!isRecord(content)) {
    return (
      <p className={className}>{excerpt ?? fallback ?? DEFAULT_FALLBACK}</p>
    );
  }

  const result = renderNodes([content as TiptapNode], "content");
  const hasContent = result.nodes.some(Boolean);
  if (!result.supported || !hasContent) {
    return (
      <p className={className}>{excerpt ?? fallback ?? DEFAULT_FALLBACK}</p>
    );
  }

  return <div className={className}>{result.nodes}</div>;
}
