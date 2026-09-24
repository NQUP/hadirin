"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationItem = { id: string; title: string; message: string; link: string | null; read_at: string | null; created_at: string };

export function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function load() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    setItems(payload.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unreadCount = items.filter((item) => !item.read_at).length;

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
  }

  async function openNotification(item: NotificationItem) {
    if (!item.read_at) {
      await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="relative grid size-9 place-items-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm" aria-label="Notifikasi" aria-expanded={open}>
        <Bell className="size-[18px]" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-4 text-white shadow-sm">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,400px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="font-semibold text-slate-900">Notifikasi</h2><p className="text-xs text-slate-400">{unreadCount ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}</p></div><button type="button" onClick={markAllRead} disabled={!unreadCount} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 disabled:text-slate-300"><CheckCheck className="size-3.5" />Tandai semua</button></div>
        <div className="max-h-[min(70vh,440px)] overflow-y-auto">
          {loading ? <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" />Memuat notifikasi...</div> : items.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">Tidak ada notifikasi</p> : items.map((item) => <button key={item.id} type="button" onClick={() => void openNotification(item)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${item.read_at ? "bg-white" : "bg-blue-50/50"}`}><div className="flex gap-3"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read_at ? "bg-slate-200" : "bg-blue-600"}`} /><span className="min-w-0"><strong className="block text-sm font-semibold text-slate-800">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item.message}</span><span className="mt-1 block text-[11px] text-slate-400">{relativeTime(item.created_at)}</span></span></div></button>)}
        </div>
      </div>}
    </div>
  );
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}