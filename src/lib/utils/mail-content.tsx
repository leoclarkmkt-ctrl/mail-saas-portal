import type { ReactNode } from "react";

/**
 * URL matcher:
 * - supports http/https + www.*
 * - supports whitespace-broken long URLs (line breaks/spaces inside URL)
 *
 * Notes:
 * - We intentionally allow whitespace inside the match so that long URLs broken
 *   by email clients are still recognized as a single link.
 * - We will normalize (strip internal whitespace) before using as href/title.
 */
const urlRegex =
  /(?:https?:\/\/|www\.)[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%\s-]+/gi;

const linkStyleClass =
  "mail-link inline-flex max-w-full flex-wrap items-center gap-1 align-middle break-words text-sky-600 hover:text-sky-700 visited:!text-indigo-600 visited:hover:!text-indigo-700";
const linkTextClass = "break-all";

const iconClass = "inline-flex h-3.5 w-3.5 shrink-0 items-center";
const badgeClass =
  "inline-flex items-center rounded bg-slate-100 px-1 py-0.5 text-[10px] font-semibold uppercase leading-none text-slate-600";

const LINK_ATTRS = {
  target: "_blank",
  rel: "noopener noreferrer nofollow"
} as const;

const setLinkAttributes = (anchor: HTMLAnchorElement) => {
  anchor.setAttribute("target", LINK_ATTRS.target);
  anchor.setAttribute("rel", LINK_ATTRS.rel);
};

const normalizeLinkHref = (href: string) => {
  // Strip ALL whitespace inside URLs so whitespace-broken URLs become one href.
  const trimmed = href.trim().replace(/\s+/g, "");
  if (trimmed.toLowerCase().startsWith("www.")) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const isSafeUrl = (value: string) => {
  const normalized = normalizeLinkHref(value).toLowerCase();
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:")
  );
};

const getNormalizedHref = (href: string) => {
  try {
    const normalized = normalizeLinkHref(href);
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return new URL(normalized).toString();
    }
    if (normalized.startsWith("mailto:")) return normalized;
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
  const rawHref = anchor.getAttribute("href") ?? "";
  const normalizedHref = getNormalizedHref(rawHref);

  // If href is safe, set it to normalized version (removes internal whitespace etc.)
  if (rawHref && isSafeUrl(rawHref)) {
    anchor.setAttribute("href", normalizedHref);
  }

  setLinkAttributes(anchor);

  // Keep existing classes, append ours.
  anchor.className = `${anchor.className} ${linkStyleClass}`.trim();

  // Hover shows real URL (normalized).
  anchor.setAttribute("title", normalizedHref);

  // Ensure long URLs wrap without breaking clickable area.
  wrapAnchorContents(anchor, doc);

  // Badges/icons depend on final normalized href.
  const trustedTld = getTrustedTld(normalizedHref);
  const external = isExternalHttpLink(normalizedHref);

  if (trustedTld) {
    anchor.appendChild(createBadgeElement(doc, trustedTld));
  }
  if (external) {
    anchor.appendChild(createIconElement(doc));
  }
};

const stripTrailingPunctuation = (value: string) => {
  // For whitespace-broken matches, strip trailing whitespace first.
  let url = value.replace(/\s+$/g, "");
  let trailing = "";
  // Important: do NOT strip "?" (query marker), but allow stripping of common trailing punctuation.
  while (/[),.!]/.test(url.slice(-1))) {
    trailing = `${url.slice(-1)}${trailing}`;
    url = url.slice(0, -1);
  }
  return { url, trailing };
};

const getUrlMatches = (text: string) => Array.from(text.matchAll(urlRegex));

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

  // Convert href-less anchors to spans to avoid "dead links"
  doc.querySelectorAll("a").forEach((anchor) => {
    if (!anchor.getAttribute("href")) {
      const span = doc.createElement("span");
      while (anchor.firstChild) {
        span.appendChild(anchor.firstChild);
      }
      anchor.replaceWith(span);
    }
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

    const href = normalizeLinkHref(url);
    if (isSafeUrl(href)) {
      const anchor = doc.createElement("a");
      anchor.setAttribute("href", getNormalizedHref(href));
      // Display text: show normalized (whitespace removed) so it remains "one link"
      anchor.textContent = href;
      enhanceAnchor(anchor, doc);
      fragment.appendChild(anchor);
    } else {
      fragment.appendChild(doc.createTextNode(url));
    }

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

  textNodes.forEach((n) => linkifyTextNode(n, doc));

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

    const href = normalizeLinkHref(url);
    const normalizedHref = getNormalizedHref(href);

    if (isSafeUrl(href)) {
      const trustedTld = getTrustedTld(normalizedHref);
      const external = isExternalHttpLink(normalizedHref);

      parts.push(
        <a
          key={`link-${lineIndex}-${matchOrder}`}
          href={normalizedHref}
          target={LINK_ATTRS.target}
          rel={LINK_ATTRS.rel}
          title={normalizedHref}
          className={linkStyleClass}
        >
          <span className={linkTextClass}>{href}</span>
          {trustedTld ? <span className={badgeClass}>{trustedTld}</span> : null}
          {external ? (
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
    } else {
      parts.push(url);
    }

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
