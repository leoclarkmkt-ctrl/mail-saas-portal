"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";

const DEFAULT_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

type AnnouncementEditorLabels = {
  content: string;
};

type TiptapModules = {
  EditorContent: ComponentType<{ editor: any }>;
  useEditor: (options: any) => any;
  StarterKit: any;
};

function createDocFromText(text: string) {
  if (!text.trim()) return DEFAULT_CONTENT;
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }]
      }
    ]
  };
}

function extractTextFromNode(node: any): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    const nested = node.content.map(extractTextFromNode).join("");
    if (node.type === "paragraph" || node.type === "heading") {
      return `${nested}\n`;
    }
    return nested;
  }
  return "";
}

function extractPlainText(content: any): string {
  if (!content || typeof content !== "object") return "";
  return extractTextFromNode(content).trim();
}

async function dynamicImport(modulePath: string) {
  const importer = new Function("modulePath", "return import(modulePath);");
  return importer(modulePath) as Promise<any>;
}

function TiptapEditor({
  modules,
  value,
  onChange,
  labels
}: {
  modules: TiptapModules;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  labels: AnnouncementEditorLabels;
}) {
  const { EditorContent, useEditor, StarterKit } = modules;

  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? DEFAULT_CONTENT,
    onUpdate: ({ editor: tiptapEditor }: { editor: any }) => {
      onChange(tiptapEditor.getJSON());
    }
  });

  useEffect(() => {
    if (editor && value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{labels.content}</label>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()}>
          B
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleItalic().run()}>
          I
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          •
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          1.
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function FallbackEditor({
  value,
  onChange,
  labels
}: {
  value: unknown;
  onChange: (nextValue: unknown) => void;
  labels: AnnouncementEditorLabels;
}) {
  const initialText = useMemo(() => extractPlainText(value), [value]);
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleTextChange = (nextText: string) => {
    setText(nextText);
    onChange(createDocFromText(nextText));
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{labels.content}</label>
      <textarea
        className="mt-2 min-h-[160px] w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
        value={text}
        onChange={(event) => handleTextChange(event.target.value)}
      />
      <p className="mt-2 text-xs text-slate-500">支持 Markdown 链接格式：[文字](https://链接)</p>
    </div>
  );
}

export function AnnouncementEditor({
  value,
  onChange,
  labels
}: {
  value: unknown;
  onChange: (nextValue: unknown) => void;
  labels: AnnouncementEditorLabels;
}) {
  const [tiptapModules, setTiptapModules] = useState<TiptapModules | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const tiptapReact = await dynamicImport("@tiptap/react");
        const starterKit = await dynamicImport("@tiptap/starter-kit");
        if (!active) return;
        setTiptapModules({
          EditorContent: tiptapReact.EditorContent,
          useEditor: tiptapReact.useEditor,
          StarterKit: starterKit.default
        });
      } catch {
        if (active) setTiptapModules(null);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  if (!tiptapModules) {
    return <FallbackEditor value={value} onChange={onChange} labels={labels} />;
  }

  return <TiptapEditor modules={tiptapModules} value={value} onChange={onChange} labels={labels} />;
}
