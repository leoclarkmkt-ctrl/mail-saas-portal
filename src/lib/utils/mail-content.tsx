import type { ReactNode } from "react";

const urlRegex = /https?:\/\/[^\s<]+/gi;

const linkStyleClass =
  "mail-link inline-flex max-w-full flex-wrap items-center gap-1 align-middle break-words text-sky-600 hover:text-sky-700 visited:!text-indigo-600 visited:hover:!text-indigo-700";
const linkTextClass = "break-all";
const iconClass = "inline-flex h-3.5 w-3.5 items-center";
const badgeClass =
  "inline-flex items-center rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-semibold uppercase leading-none text-emerald-700";

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

const getTrustedTld = (href: string) => {
  try {
    const url = new URL(href);
    if (url.hostname.endsWith(".edu")) return "EDU";
    if (url.hostname.endsWith(".gov")) return "GOV";
  } catch {
    return null;
  }
  return null;
};

const isExternalHttpLink = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

const createIconElement = (doc: Document) => {
  const span = doc.createElement("span");
  span.className = iconClass;
  span.setAttribute("aria-hidden", "true");

  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");

  const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M7 7h10v10");
  const line = doc.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "7");
  line.setAttribute("y1", "17");
  line.setAttribute("x2", "17");
  line.setAttribute("y2", "7");

  svg.appendChild(path);
  svg.appendChild(line);
  span.appendChild(svg);
  return span;
};

const createBadgeElement = (doc: Document, label: string) => {
  const badge = doc.createElement("span");
  badge.className = badgeClass;
  badge.textContent = label;
  return badge;
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
  const trustedTld = getTrustedTld(normalizedHref);
  const isExternal = isExternalHttpLink(normalizedHref);

  setLinkAttributes(anchor);

  // Keep existing classes, append ours.
  anchor.className = `${anchor.className} ${linkStyleClass}`.trim();

  // Hover shows real URL.
  anchor.setAttribute("title", normalizedHref);

  // Ensure long URLs wrap without breaking clickable area.
  wrapAnchorContents(anchor, doc);

  if (trustedTld) {
    anchor.appendChild(createBadgeElement(doc, trustedTld));
  }

  if (isExternal) {
    anchor.appendChild(createIconElement(doc));
  }
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
    const trustedTld = getTrustedTld(normalizedHref);
    const isExternal = isExternalHttpLink(normalizedHref);

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
        {trustedTld ? <span className={badgeClass}>{trustedTld}</span> : null}
        {isExternal ? (
          <span className={iconClass} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
            >
              <path d="M7 7h10v10" />
              <line x1="7" y1="17" x2="17" y2="7" />
            </svg>
          </span>
        ) : null}
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
