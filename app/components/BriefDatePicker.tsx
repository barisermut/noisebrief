"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { getTodayDateString } from "@/lib/date";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = () => setIsMobile(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function dateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const calendarClassNames = {
  root: "p-3 text-zinc-700 dark:text-white/80",
  month: "space-y-3",
  month_caption: "flex items-center justify-between px-1",
  caption_label: "text-sm font-medium text-zinc-800 dark:text-white/80",
  nav: "flex items-center gap-1",
  button_previous:
    "inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 dark:text-teal-400 dark:hover:text-teal-300 [&_svg]:fill-zinc-500 [&_svg]:hover:fill-zinc-900 dark:[&_svg]:!fill-teal-400 dark:[&_svg]:hover:!fill-teal-300",
  button_next:
    "inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 dark:text-teal-400 dark:hover:text-teal-300 [&_svg]:fill-zinc-500 [&_svg]:hover:fill-zinc-900 dark:[&_svg]:!fill-teal-400 dark:[&_svg]:hover:!fill-teal-300",
  chevron: "h-4 w-4 shrink-0 fill-zinc-500 dark:!fill-teal-400",
  weekdays: "flex",
  weekday: "w-9 text-center text-xs font-medium text-zinc-500 dark:text-white/50",
  weeks: "flex flex-col gap-1",
  week: "flex w-full",
  day: "h-9 w-9 text-center text-sm",
  day_button:
    "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 disabled:cursor-not-allowed disabled:opacity-100 dark:hover:bg-white/10",
  month_grid: "w-full border-collapse",
};

const calendarModifiersClassNames = {
  disabled: "text-zinc-300 cursor-not-allowed dark:text-white/20",
  selected:
    "rounded-md bg-teal-500 text-white hover:bg-teal-500 hover:text-white",
  today: "",
  today_available:
    "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-teal-500 after:content-['']",
  outside: "text-zinc-400 dark:text-white/30",
};

interface BriefDatePickerProps {
  selectedDate: string;
  isHistorical: boolean;
  onSelectDate: (date: string) => void;
  dates: string[];
  loadingDates: boolean;
}

function CalendarPanel({
  selectedDate,
  availableDates,
  loadingDates,
  onSelectDate,
  onClose,
}: {
  selectedDate: string;
  availableDates: string[];
  loadingDates: boolean;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}) {
  const availableSet = useMemo(
    () => new Set(availableDates),
    [availableDates]
  );

  const selectedAsDate = useMemo(() => {
    if (!selectedDate) return undefined;
    return new Date(selectedDate + "T12:00:00");
  }, [selectedDate]);

  const defaultMonth = useMemo(() => {
    if (selectedAsDate) return selectedAsDate;
    return new Date();
  }, [selectedAsDate]);

  const disabled = useCallback(
    (date: Date) => !availableSet.has(dateToYYYYMMDD(date)),
    [availableSet]
  );

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const str = dateToYYYYMMDD(date);
      if (!availableSet.has(str)) return;
      onSelectDate(str);
      onClose();
    },
    [onSelectDate, onClose, availableSet]
  );

  const todayStr = getTodayDateString();
  const modifiers = useMemo(
    () => ({
      today_available: (date: Date) =>
        dateToYYYYMMDD(date) === todayStr && availableSet.has(todayStr),
    }),
    [availableSet, todayStr]
  );

  if (loadingDates) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-6 text-sm text-zinc-500 dark:text-white/60">
        Loading dates…
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-6 text-sm text-zinc-500 dark:text-white/60">
        No other dates yet
      </div>
    );
  }

  return (
    <DayPicker
      mode="single"
      selected={selectedAsDate}
      onSelect={handleSelect}
      disabled={disabled}
      defaultMonth={defaultMonth}
      classNames={calendarClassNames}
      modifiersClassNames={calendarModifiersClassNames}
      modifiers={modifiers}
      aria-label="Available brief dates"
      showOutsideDays
    />
  );
}

function MobileBottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — tap to close */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-label="Choose a date for past brief"
        className="absolute inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-zinc-200 bg-white p-4 dark:border-white/8 dark:bg-[#0f0f17]"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-zinc-500 dark:text-white/60" />
        </button>
        <div className="flex flex-col items-center overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export function BriefDatePicker({
  selectedDate,
  isHistorical,
  onSelectDate,
  dates,
  loadingDates,
}: BriefDatePickerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open || isMobile) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, isMobile]);

  const handleSelect = useCallback(
    (date: string) => {
      onSelectDate(date);
      setOpen(false);
    },
    [onSelectDate]
  );

  const today = getTodayDateString();
  const goToToday = useCallback(() => {
    onSelectDate(today);
    setOpen(false);
  }, [onSelectDate, today]);

  const calendarPanel = (
    <CalendarPanel
      selectedDate={selectedDate}
      availableDates={dates}
      loadingDates={loadingDates}
      onSelectDate={handleSelect}
      onClose={() => setOpen(false)}
    />
  );

  return (
    <div className="relative flex min-w-0 items-center gap-1 sm:gap-2">
      <span className="select-none text-[#1a1a1a]/20 dark:text-white/20" aria-hidden>
        |
      </span>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-1.5 px-2 py-2 text-xs text-[#6b6b6b] transition-colors hover:text-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa]/50 dark:text-white/40 dark:hover:text-white/70 sm:min-w-0 sm:px-2"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Choose another date"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>past briefs</span>
      </button>
      {isHistorical && (
        <>
          <span className="select-none text-[#1a1a1a]/20 dark:text-white/20" aria-hidden>
            |
          </span>
          <button
            type="button"
            onClick={goToToday}
            className="min-h-[44px] min-w-[44px] cursor-pointer px-2 py-2 text-left text-xs text-[#6b6b6b] transition-colors hover:text-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa]/50 dark:text-white/40 sm:min-w-0 sm:px-2"
            aria-label="Back to today's brief"
          >
            Back to today
          </button>
        </>
      )}

      {/* Desktop: dropdown panel below trigger */}
      {open && !isMobile && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Available brief dates"
          className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-md border border-zinc-200 bg-white shadow-xl dark:border-white/8 dark:bg-[#0f0f17]"
        >
          {calendarPanel}
        </div>
      )}

      {/* Mobile: custom bottom sheet — no Radix Dialog, no focus trap issues */}
      {isMobile && (
        <MobileBottomSheet open={open} onClose={() => setOpen(false)}>
          {calendarPanel}
        </MobileBottomSheet>
      )}
    </div>
  );
}
