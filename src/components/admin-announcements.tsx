"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils/format";
import { withLang } from "@/lib/i18n/shared";
import { AnnouncementEditor } from "@/components/announcement-editor";

const STATUSES = ["all", "published", "draft"] as const;

type Status = (typeof STATUSES)[number];

type Announcement = {
  id: string;
  title: string;
  excerpt: string | null;
  content_json: unknown;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  stats?: {
    views_total: number;
    views_24h: number;
    unique_users_total: number;
  };
};

type AdminAnnouncementsLabels = {
  title: string;
  newAnnouncement: string;
  editAnnouncement: string;
  delete: string;
  publish: string;
  unpublish: string;
  draft: string;
  published: string;
  sortOrder: string;
  preview: string;
  save: string;
  saving: string;
  saveSuccess: string;
  saveFailed: string;
  search: string;
  searchPlaceholder: string;
  statusLabels: Record<Status, string>;
  table: {
    title: string;
    status: string;
    sortOrder: string;
    publishedAt: string;
    updatedAt: string;
    viewsTotal: string;
    views24h: string;
    uniqueUsers: string;
    actions: string;
  };
  moveUp: string;
  moveDown: string;
  noAnnouncements: string;
  excerpt: string;
  excerptPlaceholder: string;
  imageUrl: string;
  addImage: string;
  linkUrl: string;
  addLink: string;
  removeLink: string;
  content: string;
  publishToggle: string;
};

type AdminAnnouncementsProps = {
  labels: AdminAnnouncementsLabels;
  lang: "en" | "zh";
};

const DEFAULT_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

export function AdminAnnouncements({ labels, lang }: AdminAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [status, setStatus] = useState<Status>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formPublished, setFormPublished] = useState(false);
  const [contentJson, setContentJson] = useState<unknown>(DEFAULT_CONTENT);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeQuery = useMemo(() => query.trim(), [query]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (activeQuery) params.set("q", activeQuery);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/admin/announcements?${params.toString()}`);
    const data = await res.json();
    setAnnouncements(data.data ?? []);
    setTotal(data.total ?? 0);
  }, [activeQuery, page, pageSize, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery) setQuery(initialQuery);
  }, [searchParams]);

  const resetForm = () => {
    setSelectedId(null);
    setFormTitle("");
    setFormExcerpt("");
    setFormSortOrder(0);
    setFormPublished(false);
    setContentJson(DEFAULT_CONTENT);
    setMessage(null);
  };

  const startEdit = (announcement: Announcement) => {
    setSelectedId(announcement.id);
    setFormTitle(announcement.title);
    setFormExcerpt(announcement.excerpt ?? "");
    setFormSortOrder(announcement.sort_order ?? 0);
    setFormPublished(announcement.is_published);
    setContentJson((announcement.content_json as typeof DEFAULT_CONTENT) ?? DEFAULT_CONTENT);
  };

  const applySearch = () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (activeQuery) params.set("q", activeQuery);
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    setPage(1);
    load();
  };

  const saveAnnouncement = async () => {
    setSaving(true);
    setMessage(null);
    const payload = {
      title: formTitle.trim(),
      excerpt: formExcerpt.trim() || null,
      content_json: contentJson ?? DEFAULT_CONTENT,
      is_published: formPublished,
      sort_order: Number(formSortOrder)
    };

    try {
      const res = await fetch(selectedId ? `/api/admin/announcements/${selectedId}` : "/api/admin/announcements", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setMessage(labels.saveFailed);
        return;
      }
      setMessage(labels.saveSuccess);
      await load();
      resetForm();
    } catch {
      setMessage(labels.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const removeAnnouncement = async (id: string) => {
    if (!confirm(labels.delete)) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (selectedId === id) resetForm();
    load();
  };

  const togglePublish = async (announcement: Announcement) => {
    await fetch(`/api/admin/announcements/${announcement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !announcement.is_published })
    });
    load();
  };

  const updateSortOrder = async (id: string, nextValue: number) => {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort_order: nextValue })
    });
    if (selectedId === id) {
      setFormSortOrder(nextValue);
    }
    load();
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((item) => (
              <Button
                key={item}
                type="button"
                variant={status === item ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
              >
                {labels.statusLabels[item]}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full max-w-md"
            />
            <Button type="button" onClick={applySearch} className="h-10 px-6 whitespace-nowrap">
              {labels.search}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-4">{labels.table.title}</th>
                  <th className="py-2 pr-4">{labels.table.status}</th>
                  <th className="py-2 pr-4">{labels.table.sortOrder}</th>
                  <th className="py-2 pr-4">{labels.table.publishedAt}</th>
                  <th className="py-2 pr-4">{labels.table.updatedAt}</th>
                  <th className="py-2 pr-4">{labels.table.viewsTotal}</th>
                  <th className="py-2 pr-4">{labels.table.views24h}</th>
                  <th className="py-2 pr-4">{labels.table.uniqueUsers}</th>
                  <th className="py-2">{labels.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-sm text-slate-500">
                      {labels.noAnnouncements}
                    </td>
                  </tr>
                ) : (
                  announcements.map((announcement) => (
                    <tr key={announcement.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">{announcement.title}</div>
                        <div className="text-xs text-slate-400">{announcement.excerpt ?? "--"}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${announcement.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {announcement.is_published ? labels.published : labels.draft}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                            onClick={() => updateSortOrder(announcement.id, announcement.sort_order + 1)}
                          >
                            {labels.moveUp}
                          </button>
                          <button
                            type="button"
                            className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                            onClick={() => updateSortOrder(announcement.id, announcement.sort_order - 1)}
                          >
                            {labels.moveDown}
                          </button>
                          <Input
                            type="number"
                            value={announcement.sort_order}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              setAnnouncements((prev) =>
                                prev.map((item) =>
                                  item.id === announcement.id ? { ...item, sort_order: next } : item
                                )
                              );
                            }}
                            onBlur={(event) => updateSortOrder(announcement.id, Number(event.target.value))}
                            className="h-8 w-16"
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {announcement.published_at ? formatDate(announcement.published_at) : "--"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {formatDate(announcement.updated_at)}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {announcement.stats?.views_total ?? 0}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {announcement.stats?.views_24h ?? 0}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {announcement.stats?.unique_users_total ?? 0}
                      </td>
                      <td className="py-3 text-xs text-slate-600">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => startEdit(announcement)}
                          >
                            {labels.editAnnouncement}
                          </button>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => togglePublish(announcement)}
                          >
                            {announcement.is_published ? labels.unpublish : labels.publish}
                          </button>
                          {!announcement.is_published && (
                            <Link
                              href={withLang(`/admin/announcements/preview/${announcement.id}`, lang)}
                              className="text-primary hover:underline"
                            >
                              {labels.preview}
                            </Link>
                          )}
                          <button
                            type="button"
                            className="text-rose-600 hover:underline"
                            onClick={() => removeAnnouncement(announcement.id)}
                          >
                            {labels.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{page} / {totalPages}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                ‹
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
              >
                ›
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary">
            {selectedId ? labels.editAnnouncement : labels.newAnnouncement}
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">{labels.table.title}</label>
              <Input
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">{labels.excerpt}</label>
              <Input
                value={formExcerpt}
                onChange={(event) => setFormExcerpt(event.target.value)}
                className="mt-1"
                placeholder={labels.excerptPlaceholder}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">{labels.sortOrder}</label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(event) => setFormSortOrder(Number(event.target.value))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="announce-published"
                type="checkbox"
                checked={formPublished}
                onChange={(event) => setFormPublished(event.target.checked)}
              />
              <label htmlFor="announce-published" className="text-sm text-slate-600">
                {labels.publishToggle}
              </label>
            </div>

            <AnnouncementEditor
              value={contentJson}
              onChange={setContentJson}
              labels={{
                content: labels.content
              }}
            />

            {message && <p className="text-sm text-slate-500">{message}</p>}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={saveAnnouncement} disabled={saving || !formTitle.trim()}>
                {saving ? labels.saving : labels.save}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
