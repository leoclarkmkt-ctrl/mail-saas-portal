"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

type AnnouncementEditorLabels = {
  content: string;
  imageUrl: string;
  addImage: string;
  linkUrl: string;
  addLink: string;
  removeLink: string;
};

type TiptapModules = {
  EditorContent: ComponentType<{ editor: any }>;
  useEditor: (options: any) => any;
  StarterKit: any;
  Link: any;
  Image: any;
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
  const { EditorContent, useEditor, StarterKit, Link, Image } = modules;
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image
    ],
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

  const insertImage = () => {
    const url = imageUrl.trim();
    if (!url || !editor) return;
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl("");
  };

  const setLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

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

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder={labels.imageUrl}
        />
        <Button type="button" variant="outline" onClick={insertImage}>
          {labels.addImage}
        </Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder={labels.linkUrl}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={setLink}>
            {labels.addLink}
          </Button>
          <Button type="button" variant="outline" onClick={() => editor?.chain().focus().unsetLink().run()}>
            {labels.removeLink}
          </Button>
        </div>
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
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleTextChange = (nextText: string) => {
    setText(nextText);
    onChange(createDocFromText(nextText));
  };

  const handleInsertImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    const baseContent = createDocFromText(text);
    const contentArray = Array.isArray((baseContent as any).content) ? (baseContent as any).content : [];
    const nextContent = {
      ...baseContent,
      content: [...contentArray, { type: "image", attrs: { src: url } }]
    };
    onChange(nextContent);
    setImageUrl("");
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{labels.content}</label>
      <textarea
        className="mt-2 min-h-[160px] w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
        value={text}
        onChange={(event) => handleTextChange(event.target.value)}
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder={labels.imageUrl}
        />
        <Button type="button" variant="outline" onClick={handleInsertImage}>
          {labels.addImage}
        </Button>
      </div>
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
        const linkExtension = await dynamicImport("@tiptap/extension-link");
        const imageExtension = await dynamicImport("@tiptap/extension-image");
        if (!active) return;
        setTiptapModules({
          EditorContent: tiptapReact.EditorContent,
          useEditor: tiptapReact.useEditor,
          StarterKit: starterKit.default,
          Link: linkExtension.default,
          Image: imageExtension.default
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
