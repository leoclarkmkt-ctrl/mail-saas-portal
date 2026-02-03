import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const blockedExtensions = new Set([
  ".png",
  ".ico",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".pdf",
  ".zip",
  ".rar",
  ".7z",
  ".ttf",
  ".otf",
  ".eot",
  ".woff",
  ".woff2"
]);

const ignoredDirs = new Set([".git", "node_modules", ".next"]);

const root = process.cwd();
const violations = [];

const isTextFile = (buffer) => {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) return;
        await walk(fullPath);
        return;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (blockedExtensions.has(ext)) {
        violations.push(path.relative(root, fullPath));
        return;
      }
      try {
        const data = await readFile(fullPath);
        if (!isTextFile(data)) {
          violations.push(path.relative(root, fullPath));
        }
      } catch {
        violations.push(path.relative(root, fullPath));
      }
    })
  );
};

await walk(root);

if (violations.length > 0) {
  console.error("Binary assets are not allowed. Remove these files:");
  for (const file of violations.sort()) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("No binary asset files detected.");
