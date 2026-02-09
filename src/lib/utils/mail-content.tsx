import type { ReactNode } from "react";

const urlRegex = /https?:\/\/[^\s<]+/gi;

const linkStyleClass =
  "mail-link inline-flex max-w-full flex-wrap items-center gap-1 align-middle break-words text-sky-600 hover:text-sky-700 visited:!text-indigo-600 visited:hover:!text-indigo-700";
const linkTextClass = "break-all";
const LINK_ATTRS = {
  target: "_blank",
  rel: "noopener noreferrer nofollow"
} as const;

const setLinkAttributes = (anchor: HTMLAnchorElement) => {
  anchor.setAttribute("target", LINK_ATTRS.target);
  anchor.setAttribute("rel", LINK_ATTRS.rel);
};

const getNormalizedHref = (href: string) => {
  try {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return new URL(href).toString();
    }
  } catch {
    return href;
  }
  return href;
};

const wrapAnchorContents = (anchor: HTMLAnchorElement, doc: Document) => {
  // Avoid double-wrapping
  const alreadyWrapped =
    anchor.childElementCount === 1 &&
    anchor.firstElementChild?.tagName.toLowerCase() === "span" &&
    anchor.firstElementChild.classList.contains(linkTextClass);

  if (alreadyWrapped) return;

  const contentWrapper = doc.createElement("span");
  contentWrapper.className = linkTextClass;

  while (anchor.firstChild) {
    contentWrapper.appendChild(anchor.firstChild);
  }
  anchor.appendChild(contentWrapper);
};

const enhanceAnchor = (anchor: HTMLAnchorElement, doc: Document) => {
  const href = anchor.getAttribute("href") ?? "";
  const normalizedHref = getNormalizedHref(href);
  setLinkAttributes(anchor);

  // Keep existing classes, append ours.
  anchor.className = `${anchor.className} ${linkStyleClass}`.trim();

  // Hover shows real URL.
  anchor.setAttribute("title", normalizedHref);

  // Ensure long URLs wrap without breaking clickable area.
  wrapAnchorContents(anchor, doc);

  return;
};

const stripTrailingPunctuation = (value: string) => {
  let url = value;
  let trailing = "";
  // Important: do NOT strip "?" (query marker), but allow stripping of common trailing punctuation.
  while (/[),.!]/.test(url.slice(-1))) {
    trailing = `${url.slice(-1)}${trailing}`;
    url = url.slice(0, -1);
  }
  return { url, trailing };
};

const getUrlMatches = (text: string) => Array.from(text.matchAll(urlRegex));

const isSafeUrl = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:")
  );
};

const sanitizeDocument = (doc: Document) => {
  const forbiddenTags = new Set([
    "audio",
    "base",
    "button",
    "canvas",
    "embed",
    "form",
    "iframe",
    "img",
    "input",
    "link",
    "meta",
    "object",
    "picture",
    "script",
    "style",
    "svg",
    "video",
    "select",
    "textarea"
  ]);

  const allowedAttributes = new Map<string, Set<string>>([
    ["a", new Set(["href", "target", "rel", "class", "title"])],
    ["*", new Set(["class"])]
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

      const tagAllowed =
        allowedAttributes.get(tagName) ?? allowedAttributes.get("*") ?? new Set();
      if (!tagAllowed.has(name)) {
        element.removeAttribute(attr.name);
        return;
      }

      if (tagName === "a" && name === "href" && !isSafeUrl(attr.value)) {
        element.removeAttribute(attr.name);
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
    enhanceAnchor(anchor, doc);
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
    enhanceAnchor(anchor, doc);
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

    const normalizedHref = getNormalizedHref(url);

    if (matchIndex > lastIndex) {
      parts.push(line.slice(lastIndex, matchIndex));
    }

    parts.push(
      <a
        key={`link-${lineIndex}-${matchOrder}`}
        href={url}
        target={LINK_ATTRS.target}
        rel={LINK_ATTRS.rel}
        title={normalizedHref}
        className={linkStyleClass}
      >
        <span className={linkTextClass}>{url}</span>
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
