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

function stringifyTiptapNode(node: TiptapNode | undefined): string {
  if (!node) return "";
  const children = (node.content ?? []).map((child) => stringifyTiptapNode(child)).join("");

  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((child) => stringifyTiptapNode(child)).join("\n\n");
    case "paragraph":
      return children.trim() ? children : "";
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const prefix = "#".repeat(Math.min(Math.max(level, 1), 6));
      return `${prefix} ${children}`.trim();
    }
    case "text": {
      let text = node.text ?? "";
      (node.marks ?? []).forEach((mark) => {
        if (mark.type === "link") {
          const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
          if (isSafeUrl(href)) {
            text = `[${text}](${href})`;
          }
        }
      });
      return text;
    }
    case "bulletList":
      return (node.content ?? [])
        .map((child) => {
          const item = stringifyTiptapNode(child).trim();
          return item ? `- ${item}` : "";
        })
        .filter(Boolean)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((child, index) => {
          const item = stringifyTiptapNode(child).trim();
          return item ? `${index + 1}. ${item}` : "";
        })
        .filter(Boolean)
        .join("\n");
    case "listItem":
      return children.replace(/\n+/g, " ").trim();
    case "hardBreak":
      return "\n";
    default:
      return "";
  }
}

function parseInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let linkIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const [full, label, url] = match;
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (isSafeUrl(url)) {
      parts.push(
        <a
          key={`${keyPrefix}-link-${linkIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {label}
        </a>
      );
    } else {
      parts.push(full);
    }
    lastIndex = match.index + full.length;
    linkIndex += 1;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderParagraph(text: string, key: string) {
  const lines = text.split("\n");
  return (
    <p key={key} className="mb-3 last:mb-0">
      {lines.flatMap((line, index) => {
        const nodes = parseInlineMarkdown(line, `${key}-line-${index}`);
        if (index === lines.length - 1) return nodes;
        return [...nodes, <br key={`${key}-br-${index}`} />];
      })}
    </p>
  );
}

function renderMarkdown(markdown: string) {
  const trimmed = markdown.trim();
  if (!trimmed) return [];
  const lines = trimmed.split("\n");
  const blocks: ReactNode[] = [];
  let buffer: string[] = [];
  let listItems: string[] | null = null;
  let listType: "ul" | "ol" | null = null;

  const flushParagraph = (key: string) => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n").trim();
    if (text) blocks.push(renderParagraph(text, key));
    buffer = [];
  };

  const flushList = (key: string) => {
    if (!listItems || listItems.length === 0 || !listType) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    blocks.push(
      <Tag
        key={key}
        className={`mb-3 space-y-1 pl-5 ${listType === "ol" ? "list-decimal" : "list-disc"}`}
      >
        {listItems.map((item, index) => (
          <li key={`${key}-item-${index}`} className="text-sm text-slate-700">
            {parseInlineMarkdown(item, `${key}-item-${index}`)}
          </li>
        ))}
      </Tag>
    );
    listItems = null;
    listType = null;
  };

  lines.forEach((line, index) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);

    if (bulletMatch || orderedMatch) {
      flushParagraph(`p-${index}`);
      const nextType = orderedMatch ? "ol" : "ul";
      if (listType && listType !== nextType) {
        flushList(`list-${index}-switch`);
      }
      listType = nextType;
      if (!listItems) listItems = [];
      listItems.push((bulletMatch?.[1] ?? orderedMatch?.[1] ?? "").trim());
      return;
    }

    if (line.trim() === "") {
      flushParagraph(`p-${index}`);
      flushList(`list-${index}`);
      return;
    }

    if (listItems) {
      flushList(`list-${index}`);
    }

    buffer.push(line);
  });

  flushParagraph("p-last");
  flushList("list-last");

  return blocks;
}

export function AnnouncementContent({ content, excerpt, fallback, className }: AnnouncementContentProps) {
  const markdown = isRecord(content) ? stringifyTiptapNode(content as TiptapNode) : "";
  const nodes = renderMarkdown(markdown);
  if (!markdown.trim() || nodes.length === 0) {
    return <p className={className}>{excerpt ?? fallback ?? DEFAULT_FALLBACK}</p>;
  }
  return <div className={className}>{nodes}</div>;
}
