import type { ReactNode } from "react";

const urlRegex = /https?:\/\/[^\s<]+/gi;

const LINK_ATTRS = {
  target: "_blank",
  rel: "noopener noreferrer nofollow"
} as const;

const setLinkAttributes = (anchor: HTMLAnchorElement) => {
  anchor.setAttribute("target", LINK_ATTRS.target);
  anchor.setAttribute("rel", LINK_ATTRS.rel);
};

const stripTrailingPunctuation = (value: string) => {
  let url = value;
  let trailing = "";
  while (/[),.!?]/.test(url.slice(-1))) {
    trailing = `${url.slice(-1)}${trailing}`;
    url = url.slice(0, -1);
  }
  return { url, trailing };
};

const getUrlMatches = (text: string) => Array.from(text.matchAll(urlRegex));

const isSafeUrl = (value: string, attributeName: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("javascript:") || normalized.startsWith("vbscript:")) {
    return false;
  }
  if (attributeName === "src" && normalized.startsWith("data:image/")) {
    return true;
  }
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:") ||
    normalized.startsWith("/") ||
    normalized.startsWith("#")
  );
};

const sanitizeDocument = (doc: Document) => {
  const forbiddenTags = new Set([
    "script",
    "iframe",
    "embed",
    "object",
    "link",
    "meta",
    "base"
  ]);

  const elements = Array.from(doc.body.querySelectorAll("*"));
  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    if (forbiddenTags.has(tagName)) {
      element.remove();
      return;
    }

    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attr.name);
        return;
      }

      if (name === "href" || name === "src") {
        if (!isSafeUrl(attr.value, name)) {
          element.removeAttribute(attr.name);
        }
      }
    });
  });
};

const linkifyTextNode = (node: Text, doc: Document) => {
  const text = node.nodeValue ?? "";
  const matches = getUrlMatches(text);
  if (matches.length === 0) return;

  const fragment = doc.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach((match) => {
    const matchText = match[0];
    const matchIndex = match.index ?? 0;
    const { url, trailing } = stripTrailingPunctuation(matchText);

    if (matchIndex > lastIndex) {
      fragment.appendChild(doc.createTextNode(text.slice(lastIndex, matchIndex)));
    }

    const anchor = doc.createElement("a");
    anchor.href = url;
    anchor.textContent = url;
    setLinkAttributes(anchor);
    fragment.appendChild(anchor);

    if (trailing) {
      fragment.appendChild(doc.createTextNode(trailing));
    }

    lastIndex = matchIndex + matchText.length;
  });

  if (lastIndex < text.length) {
    fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
  }

  node.parentNode?.replaceChild(fragment, node);
};

export const sanitizeAndLinkifyHtml = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  sanitizeDocument(doc);

  doc.querySelectorAll("a").forEach((anchor) => {
    setLinkAttributes(anchor);
  });

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current = walker.nextNode();

  while (current) {
    const node = current as Text;
    if (!node.parentElement?.closest("a")) {
      textNodes.push(node);
    }
    current = walker.nextNode();
  }

  textNodes.forEach((node) => linkifyTextNode(node, doc));

  return doc.body.innerHTML;
};

const renderPlainTextLine = (line: string, lineIndex: number) => {
  const matches = getUrlMatches(line);
  if (matches.length === 0) return line;

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, matchOrder) => {
    const matchText = match[0];
    const matchIndex = match.index ?? 0;
    const { url, trailing } = stripTrailingPunctuation(matchText);

    if (matchIndex > lastIndex) {
      parts.push(line.slice(lastIndex, matchIndex));
    }

    parts.push(
      <a
        key={`link-${lineIndex}-${matchOrder}`}
        href={url}
        target={LINK_ATTRS.target}
        rel={LINK_ATTRS.rel}
      >
        {url}
      </a>
    );

    if (trailing) {
      parts.push(trailing);
    }

    lastIndex = matchIndex + matchText.length;
  });

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
};

export const renderPlainTextWithLinks = (text: string) => {
  const lines = text.split(/\r?\n/);

  return lines.map((line, index) => (
    <span key={`line-${index}`}>
      {renderPlainTextLine(line, index)}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
};
