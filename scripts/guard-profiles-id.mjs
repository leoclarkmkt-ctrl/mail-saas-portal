import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(process.cwd(), "src");
const targetExtensions = new Set([".ts", ".tsx"]);

const patterns = [
  {
    label: "profiles id property",
    regex: /profiles\.id|profile\.id/g
  }
];

const profilesRegex = /from\(["']profiles["']\)/g;
const selectRegex = /\.select\(\s*["'`]([^"'`]*)["'`]\s*\)/;
const eqRegex = /\.eq\(\s*["'`]id["'`]/;
const inRegex = /\.in\(\s*["'`]id["'`]/;
const orderRegex = /\.order\(\s*["'`]id["'`]/;

const collectFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (targetExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
};

const formatMatch = (content, index) => {
  const prefix = content.slice(0, index);
  const lineNumber = prefix.split("\n").length;
  const line = content.split("\n")[lineNumber - 1] ?? "";
  return { lineNumber, line };
};

const run = async () => {
  const files = await collectFiles(rootDir);
  const hits = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");

    profilesRegex.lastIndex = 0;
    let profileMatch;
    while ((profileMatch = profilesRegex.exec(content)) !== null) {
      const segmentEnd = content.indexOf(";", profileMatch.index);
      const endIndex = segmentEnd === -1 ? content.length : segmentEnd + 1;
      const segment = content.slice(profileMatch.index, endIndex);

      const selectMatch = selectRegex.exec(segment);
      if (selectMatch) {
        const fields = selectMatch[1]
          .split(",")
          .map((field) => field.trim());
        const hasIdField = fields.some((field) => /^id(\s|$)/.test(field));
        if (hasIdField) {
          const { lineNumber, line } = formatMatch(content, profileMatch.index);
          hits.push({
            file,
            label: "profiles select id",
            lineNumber,
            line: line.trim()
          });
        }
      }

      if (eqRegex.test(segment)) {
        const { lineNumber, line } = formatMatch(content, profileMatch.index);
        hits.push({
          file,
          label: "profiles eq id",
          lineNumber,
          line: line.trim()
        });
      }

      if (inRegex.test(segment)) {
        const { lineNumber, line } = formatMatch(content, profileMatch.index);
        hits.push({
          file,
          label: "profiles in id",
          lineNumber,
          line: line.trim()
        });
      }

      if (orderRegex.test(segment)) {
        const { lineNumber, line } = formatMatch(content, profileMatch.index);
        hits.push({
          file,
          label: "profiles order id",
          lineNumber,
          line: line.trim()
        });
      }
    }
    for (const { label, regex } of patterns) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const { lineNumber, line } = formatMatch(content, match.index);
        hits.push({
          file,
          label,
          lineNumber,
          line: line.trim()
        });
      }
    }
  }

  if (hits.length > 0) {
    console.error("profiles.id guard failed. Remove profiles.id usage:");
    hits.forEach((hit) => {
      console.error(
        `- ${hit.file}:${hit.lineNumber} [${hit.label}] ${hit.line}`
      );
    });
    process.exit(1);
  }
};

run().catch((error) => {
  console.error("profiles.id guard failed to run:", error);
  process.exit(1);
});
