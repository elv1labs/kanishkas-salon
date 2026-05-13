"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, X, ChevronDown, ChevronUp, SlidersHorizontal,
  CalendarDays, RotateCcw,
} from "lucide-react";

type ProductOption = { id: string; name: string };
type SortField = "date" | "amount" | "client";
type SortDir = "asc" | "desc";
type PaymentFilter = "All" | "PAID" | "PENDING";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
const PAYMENT_OPTIONS = ["All", "PAID", "PENDING"] as const;
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};
const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
] as const;

function formatDate(d: Date) { return d.toISOString().split("T")[0]; }
function startOfThisWeek() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d;
}
function endOfThisWeek() {
  const d = new Date(startOfThisWeek()); d.setDate(d.getDate() + 6); d.setHours(23,59,59,999); return d;
}
function startOfThisMonth() {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}
function endOfThisMonth() {
  return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  productIds: string[];
  statuses: string[];
  paymentStatus: PaymentFilter;
  amountMin: string;
  amountMax: string;
  sortBy: SortField;
  sortDir: SortDir;
  search: string;
}

const DEFAULT_FILTERS: FilterState = {
  dateFrom: "",
  dateTo: "",
  productIds: [],
  statuses: [],
  paymentStatus: "All",
  amountMin: "",
  amountMax: "",
  sortBy: "date",
  sortDir: "desc",
  search: "",
};

interface Props {
  total: number;
  loading: boolean;
  products: ProductOption[];
  onFilterChange?: () => void;
}

export default function OrdersFilterBar({
  total, loading, products, onFilterChange,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
    productIds: searchParams.get("productId") ? [searchParams.get("productId")!] : [],
    statuses: searchParams.get("status") ? [searchParams.get("status")!] : [],
    paymentStatus: (searchParams.get("paymentStatus") as PaymentFilter) ?? "All",
    amountMin: searchParams.get("amountMin") ?? "",
    amountMax: searchParams.get("amountMax") ?? "",
    sortBy: (searchParams.get("sortBy") as SortField) ?? "date",
    sortDir: (searchParams.get("sortOrder") as SortDir) ?? "desc",
    search: searchParams.get("search") ?? "",
  }));

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pushFilters = useCallback((f: FilterState) => {
    const params = new URLSearchParams();
    if (f.dateFrom) params.set("dateFrom", f.dateFrom);
    if (f.dateTo) params.set("dateTo", f.dateTo);
    if (f.productIds[0]) params.set("productId", f.productIds[0]);
    if (f.statuses[0]) params.set("status", f.statuses[0]);
    if (f.paymentStatus !== "All") params.set("paymentStatus", f.paymentStatus);
    if (f.amountMin) params.set("amountMin", f.amountMin);
    if (f.amountMax) params.set("amountMax", f.amountMax);
    if (f.sortBy !== "date" || f.sortDir !== "desc") {
      params.set("sortBy", f.sortBy);
      params.set("sortOrder", f.sortDir);
    }
    if (f.search) params.set("search", f.search);
    router.replace(`?${params.toString()}`, { scroll: false });
    onFilterChange?.();
  }, [router, onFilterChange]);

  const applyDatePreset = (preset: typeof DATE_PRESETS[number]["value"]) => {
    const now = new Date();
    let from = "", to = "";
    if (preset === "today") {
      from = formatDate(now); to = formatDate(now);
    } else if (preset === "week") {
      from = formatDate(startOfThisWeek()); to = formatDate(endOfThisWeek());
    } else if (preset === "month") {
      from = formatDate(startOfThisMonth()); to = formatDate(endOfThisMonth());
    }
    const next = { ...filters, dateFrom: from, dateTo: to };
    setFilters(next);
    pushFilters(next);
  };

  const update = (patch: Partial<FilterState>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    pushFilters(next);
  };

  const handleSearch = (val: string) => {
    setFilters(f => ({ ...f, search: val }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      pushFilters({ ...filters, search: val });
    }, 300);
  };

  const toggleMulti = (key: "productIds" | "statuses", value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    update({ [key]: next });
  };

  const activeFilterCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    filters.productIds.length +
    filters.statuses.length +
    (filters.amountMin ? 1 : 0) +
    (filters.amountMax ? 1 : 0) +
    (filters.search ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const clearAll = () => {
    setFilters({ ...DEFAULT_FILTERS, sortBy: filters.sortBy, sortDir: filters.sortDir });
    pushFilters({ ...DEFAULT_FILTERS, sortBy: filters.sortBy, sortDir: filters.sortDir });
  };

  const chips: { label: string; onRemove: () => void }[] = [];
  if (filters.dateFrom) chips.push({ label: `From: ${filters.dateFrom}`, onRemove: () => update({ dateFrom: "" }) });
  if (filters.dateTo) chips.push({ label: `To: ${filters.dateTo}`, onRemove: () => update({ dateTo: "" }) });
  filters.productIds.forEach(id => {
    const p = products.find(x => x.id === id);
    if (p) chips.push({ label: p.name, onRemove: () => toggleMulti("productIds", id) });
  });
  filters.statuses.forEach(s => chips.push({ label: STATUS_LABELS[s] ?? s, onRemove: () => toggleMulti("statuses", s) }));
  if (filters.amountMin) chips.push({ label: `Min ₹${filters.amountMin}`, onRemove: () => update({ amountMin: "" }) });
  if (filters.amountMax) chips.push({ label: `Max ₹${filters.amountMax}`, onRemove: () => update({ amountMax: "" }) });
  if (filters.search) chips.push({ label: `"${filters.search}"`, onRemove: () => { setFilters(f => ({ ...f, search: "" })); pushFilters({ ...filters, search: "" }); } });

  const FilterBarContent = () => (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
          <input
            type="text"
            defaultValue={filters.search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search client, order ref..."
            className="w-full bg-white border border-cream-darker/50 rounded-sm py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/40 placeholder:text-charcoal-lighter/60"
          />
        </div>

        <div className="flex items-center gap-1.5 text-sm text-charcoal-lighter">
          <CalendarDays size={14} />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => update({ dateFrom: e.target.value })}
            className="bg-white border border-cream-darker/50 rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-gold/40"
          />
          <span>–</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => update({ dateTo: e.target.value })}
            className="bg-white border border-cream-darker/50 rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-gold/40"
            min={filters.dateFrom || undefined}
          />
        </div>

        <div className="flex items-center gap-1">
          {DATE_PRESETS.map(p => (
            <button key={p.value} onClick={() => applyDatePreset(p.value)}
              className="text-[11px] px-2.5 py-1.5 rounded-sm border border-cream-darker/50 bg-white text-charcoal-lighter hover:border-gold/30 hover:text-espresso transition-all">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <MultiSelect
          label="Product"
          options={products}
          selected={filters.productIds}
          onToggle={id => toggleMulti("productIds", id)}
          display={p => p.name}
        />
        <MultiSelect
          label="Status"
          options={STATUS_OPTIONS.map(s => ({ id: s, name: STATUS_LABELS[s] ?? s }))}
          selected={filters.statuses}
          onToggle={id => toggleMulti("statuses", id)}
          display={s => s.name}
        />
        <MultiSelect
          label="Payment"
          options={PAYMENT_OPTIONS.map(s => ({ id: s, name: s === "All" ? "All Payment" : s === "PAID" ? "✓ Paid" : "⏳ Pending" }))}
          selected={[filters.paymentStatus]}
          onToggle={id => update({ paymentStatus: id as PaymentFilter })}
          display={s => s.name}
          single
        />

        <div className="flex items-center gap-1.5 text-sm text-charcoal-lighter">
          <span className="text-[11px]">₹</span>
          <input
            type="number"
            placeholder="Min"
            value={filters.amountMin}
            onChange={e => update({ amountMin: e.target.value })}
            className="w-20 bg-white border border-cream-darker/50 rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-gold/40"
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.amountMax}
            onChange={e => update({ amountMax: e.target.value })}
            className="w-20 bg-white border border-cream-darker/50 rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-gold/40"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-charcoal-lighter" />
          <span className="text-xs font-semibold text-espresso uppercase tracking-wider">Filters</span>
          {hasActiveFilters && (
            <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-bold">{activeFilterCount}</span>
          )}
          <span className="text-xs text-charcoal-lighter">
            Showing <span className="font-semibold text-espresso">{total}</span> order{total !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-[11px] text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
              <RotateCcw size={11} /> Clear all
            </button>
          )}
          <button onClick={() => setMobileOpen(o => !o)}
            className="md:hidden flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border border-cream-darker/50 bg-white text-charcoal-lighter hover:border-gold/30 transition-all">
            <SlidersHorizontal size={13} />
            Filters {hasActiveFilters && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-sm border border-cream-darker/30 p-4 space-y-3">
        <FilterBarContent />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-[min(400px,92vw)] h-full bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-darker/20">
              <h2 className="font-display text-base text-espresso">Filters</h2>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-full hover:bg-cream/60">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <FilterBarContent />
            </div>
            <div className="px-5 py-4 border-t border-cream-darker/20 flex gap-3">
              <button onClick={() => { clearAll(); setMobileOpen(false); }}
                className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-sm text-charcoal-lighter hover:border-gold/30 transition-all">
                Clear all
              </button>
              <button onClick={() => setMobileOpen(false)}
                className="flex-1 py-2.5 text-sm bg-espresso text-cream rounded-sm font-semibold hover:bg-espresso/90 transition-all">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip, i) => (
            <button key={i} onClick={chip.onRemove}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-espresso hover:bg-gold/20 transition-all">
              {chip.label}
              <X size={10} className="text-gold" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect<T extends { id: string; name: string }>({
  label, options, selected, onToggle, display, single,
}: {
  label: string;
  options: T[];
  selected: string[];
  onToggle: (id: string) => void;
  display: (item: T) => string;
  single?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = selected.length === 0
    ? label
    : selected.length === 1
    ? display(options.find(o => o.id === selected[0])!)
    : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm border transition-all ${
          selected.length > 0
            ? "bg-gold/10 border-gold/40 text-espresso font-medium"
            : "bg-white border-cream-darker/50 text-charcoal-lighter hover:border-gold/30"
        }`}
      >
        {selectedLabel}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 w-48 bg-white border border-cream-darker/50 rounded-sm shadow-lg py-1 max-h-56 overflow-y-auto">
          {options.map(opt => {
            const isSel = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onToggle(opt.id);
                  if (single) setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                  isSel
                    ? "bg-gold/10 text-espresso font-semibold"
                    : "text-charcoal-lighter hover:bg-cream/50"
                }`}
              >
                <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center flex-shrink-0 ${
                  isSel ? "bg-gold border-gold" : "border-charcoal-lighter/30"
                }`}>
                  {isSel && <span className="w-2 h-2 bg-white rounded-sm" />}
                </span>
                {display(opt)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
