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
  root: "p-3 text-foreground",
  month: "space-y-3",
  month_caption: "flex items-center justify-between px-1",
  caption_label: "text-sm font-medium text-foreground",
  nav: "flex items-center gap-1",
  button_previous:
    "inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md text-link transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:fill-current",
  button_next:
    "inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md text-link transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:fill-current",
  chevron: "h-4 w-4 shrink-0 fill-current",
  weekdays: "flex",
  weekday: "w-9 text-center text-xs font-medium text-muted-foreground",
  weeks: "flex flex-col gap-1",
  week: "flex w-full",
  day: "h-9 w-9 text-center text-sm",
  day_button:
    "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:hover:bg-transparent",
  month_grid: "w-full border-collapse",
};

/** Starts with the visible day number so voice-control users can say "click 9". */
const calendarLabels = {
  labelDayButton: (date: Date, modifiers: { selected?: boolean; disabled?: boolean }) =>
    `${date.getDate()} ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", year: "numeric" })}` +
    (modifiers.selected ? ", selected" : modifiers.disabled ? ", no brief" : ""),
};

const calendarModifiersClassNames = {
  disabled: "text-muted-foreground/50",
  selected:
    "rounded-md bg-primary font-semibold text-primary-foreground [&_button]:hover:bg-primary",
  today: "",
  today_available:
    "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-link after:content-['']",
  outside: "opacity-50",
};

interface BriefDatePickerProps {
  selectedDate: string;
  isHistorical: boolean;
  onSelectDate: (date: string) => void;
  dates: string[];
  /** When provided, picker is controlled; parent can hide floating CTA when open. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function CalendarPanel({
  selectedDate,
  availableDates,
  onSelectDate,
  onClose,
}: {
  selectedDate: string;
  availableDates: string[];
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

  if (availableDates.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-6 text-sm text-muted-foreground">
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
      labels={calendarLabels}
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
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-border bg-popover p-4 text-popover-foreground"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <X aria-hidden className="h-4 w-4" />
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
  open: controlledOpen,
  onOpenChange,
}: BriefDatePickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (onOpenChange) onOpenChange(value);
      if (!isControlled) setInternalOpen(value);
    },
    [onOpenChange, isControlled]
  );
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
  }, [open, isMobile, setOpen]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, setOpen]);

  const handleSelect = useCallback(
    (date: string) => {
      onSelectDate(date);
      setOpen(false);
    },
    [onSelectDate, setOpen]
  );

  const today = getTodayDateString();
  const goToToday = useCallback(() => {
    onSelectDate(today);
    setOpen(false);
  }, [onSelectDate, setOpen, today]);

  const calendarPanel = (
    <CalendarPanel
      selectedDate={selectedDate}
      availableDates={dates}
      onSelectDate={handleSelect}
      onClose={() => setOpen(false)}
    />
  );

  return (
    <div className="relative flex min-w-0 items-center gap-1 sm:gap-2">
      <span className="select-none text-border" aria-hidden>
        |
      </span>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Past briefs</span>
      </button>
      {isHistorical && (
        <>
          <span className="select-none text-border" aria-hidden>
            |
          </span>
          <button
            type="button"
            onClick={goToToday}
            className="min-h-11 cursor-pointer rounded-md px-2 py-2 text-left text-sm text-link transition-colors hover:text-link-hover hover:underline"
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
          className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-md border border-border bg-popover text-popover-foreground shadow-xl"
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
