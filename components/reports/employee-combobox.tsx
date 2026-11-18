"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

type EmployeeOption = { id: string; name: string; number: string };

export function EmployeeCombobox({
  name = "employeeId",
  employees,
  defaultValue = "",
  value,
  onChange,
  disabled = false,
  placeholder = "Semua employee",
  includeAll = true,
  className = "mt-1.5",
}: {
  name?: string;
  employees: EmployeeOption[];
  defaultValue?: string; // mode tidak terkontrol (form GET)
  value?: string; // mode terkontrol (state React)
  onChange?: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  includeAll?: boolean;
  className?: string;
}) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = isControlled ? value : inner;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? employees.filter(
          (e) => e.name.toLowerCase().includes(q) || e.number.toLowerCase().includes(q),
        )
      : employees;
    if (q || !includeAll) return filtered;
    return [{ id: "", name: placeholder, number: "" }, ...filtered];
  }, [employees, query, includeAll, placeholder]);

  const selected = employees.find((e) => e.id === current);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function choose(id: string) {
    if (!isControlled) setInner(id);
    onChange?.(id);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (options[active]) choose(options[active].id);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <input type="hidden" name={name} value={current} />
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setActive(0);
        }}
        className={`field flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className={`truncate ${selected ? "text-slate-900" : "text-slate-500"}`}>
          {selected ? `${selected.name} (${selected.number})` : placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder="Cari nama atau nomor..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {options.map((option, index) => (
              <li key={option.id || "all"} role="option" aria-selected={option.id === current}>
                <button
                  type="button"
                  onClick={() => choose(option.id)}
                  onMouseEnter={() => setActive(index)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                    index === active ? "bg-blue-50 text-blue-700" : "text-slate-700"
                  }`}
                >
                  <span className="truncate">
                    {option.name}
                    {option.number && (
                      <span className="ml-2 text-xs text-slate-500">{option.number}</span>
                    )}
                  </span>
                  {option.id === current && <Check className="size-4 shrink-0" />}
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                Karyawan tidak ditemukan
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}