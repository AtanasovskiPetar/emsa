import type { DayHeaderContentArg, EventContentArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarRange, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type { Workshop } from "@/constants/types";
import { cn } from "@/lib/utils";

type CalendarView = "timeGridWeek" | "listMonth";

interface WorkshopsCalendarProps {
  workshops: Workshop[];
  getWorkshopAction: (w: Workshop) => { label: string; disabled: boolean; action?: () => void };
  onEventClick: (workshop: Workshop) => void;
}

function WorkshopDayHeader({ info }: { info: DayHeaderContentArg }) {
  const [weekday] = info.text.split(" ");
  const dateNum = info.date.getDate();

  return (
    <div className="flex w-full flex-col items-center space-y-0.5 py-1 text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{weekday}</span>
      {info.isToday ? (
        <div className="flex size-6 items-center justify-center rounded-full bg-primary">
          <span className="text-xs font-medium text-primary-foreground">{dateNum}</span>
        </div>
      ) : (
        <div className="flex size-6 items-center justify-center">
          <span className="text-xs text-foreground">{dateNum}</span>
        </div>
      )}
    </div>
  );
}

function WorkshopEventItem({
  info,
  workshops,
  getWorkshopAction,
}: {
  info: EventContentArg;
  workshops: Workshop[];
  getWorkshopAction: (w: Workshop) => { label: string; disabled: boolean; action?: () => void };
}) {
  const isRegistered = info.event.extendedProps.myRegistration as boolean;

  if (info.view.type === "listMonth") {
    const w = workshops.find((wk) => wk.id === info.event.id);
    if (!w) return null;
    const action = getWorkshopAction(w);
    return (
      <div className="flex w-full items-center justify-between gap-3 pr-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{w.title}</span>
          {w.myRegistration && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Registered
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            action.action?.();
          }}
          disabled={action.disabled}
          className={cn(
            "shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors",
            action.disabled
              ? "cursor-not-allowed opacity-50"
              : w.myRegistration
                ? "border border-border hover:bg-muted"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {action.label}
        </button>
      </div>
    );
  }

  // timeGridWeek — full-height colored block with 2-line content
  const [startPart, endPart] = info.timeText.split(" - ");
  const timeRange = endPart ? `${startPart} – ${endPart}` : startPart;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col -space-y-0.5 overflow-hidden rounded-sm px-1 py-0.5",
        isRegistered
          ? "bg-primary text-primary-foreground"
          : "border border-primary/40 bg-primary/15 text-primary"
      )}
    >
      <span className="truncate text-[0.65rem] font-semibold leading-tight">
        {info.event.title}
      </span>
      <span className="truncate text-[0.6rem] leading-tight opacity-80">{timeRange}</span>
    </div>
  );
}

export function WorkshopsCalendar({
  workshops,
  getWorkshopAction,
  onEventClick,
}: WorkshopsCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<CalendarView>("timeGridWeek");
  const [periodTitle, setPeriodTitle] = useState("");

  const initialDate = useMemo(() => {
    if (workshops.length === 0) return undefined;
    return [...workshops].sort(
      (a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime()
    )[0].startingAt;
  }, [workshops]);

  function handleViewChange(newView: CalendarView) {
    setView(newView);
    calendarRef.current?.getApi().changeView(newView);
  }

  // backgroundColor/borderColor/textColor are omitted — colors are applied
  // inside the custom eventContent to avoid CSS variable resolution issues
  // (FullCalendar inline styles don't resolve oklch-based design tokens)
  const calendarEvents = workshops.map((w) => ({
    id: w.id,
    title: w.title,
    start: w.startingAt,
    end: w.endingAt ?? undefined,
    backgroundColor: "transparent",
    borderColor: "transparent",
    extendedProps: { myRegistration: w.myRegistration },
  }));

  return (
    <div className="flex flex-col gap-3">
      {/* Custom nav bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => calendarRef.current?.getApi().prev()}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-medium">{periodTitle}</span>
          <button
            onClick={() => calendarRef.current?.getApi().next()}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <button
              onClick={() => handleViewChange("timeGridWeek")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "timeGridWeek"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarRange className="size-3.5" />
              Week
            </button>
            <button
              onClick={() => handleViewChange("listMonth")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "listMonth"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" />
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="overflow-hidden rounded-xl border">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, listPlugin]}
          initialView="timeGridWeek"
          initialDate={initialDate}
          events={calendarEvents}
          headerToolbar={false}
          height={600}
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="23:59:00"
          scrollTime="08:00:00"
          firstDay={1}
          nowIndicator={true}
          eventDisplay="block"
          datesSet={(info) => setPeriodTitle(info.view.title)}
          dayHeaderContent={(info) => <WorkshopDayHeader info={info} />}
          eventContent={(info) => (
            <WorkshopEventItem
              info={info}
              workshops={workshops}
              getWorkshopAction={getWorkshopAction}
            />
          )}
          eventClick={(info) => {
            if (info.view.type === "timeGridWeek") {
              const w = workshops.find((wk) => wk.id === info.event.id);
              if (w) onEventClick(w);
            }
          }}
        />
      </div>
    </div>
  );
}
