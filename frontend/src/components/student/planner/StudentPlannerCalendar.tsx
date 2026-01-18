"use client";
import React, { useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventClickArg, DatesSetArg, EventContentArg } from "@fullcalendar/core";
import { PlannerEvent } from "@/@types";
import { Button } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";

const DEFAULT_CATEGORY_COLOR = "#10b981";

interface StudentPlannerCalendarProps {
  events: EventInput[];
  onEventClick: (clickInfo: EventClickArg) => void;
  onDatesSet: (dateInfo: DatesSetArg) => void;
}

interface EventContentWrapperProps {
  eventInfo: EventContentArg;
}

const EventContentWrapper: React.FC<EventContentWrapperProps> = ({
  eventInfo,
}) => {
  const event = eventInfo.event.extendedProps.event as PlannerEvent;
  const categoryColor = eventInfo.event.extendedProps.categoryColor || event?.category?.color || DEFAULT_CATEGORY_COLOR;

  const start = eventInfo.event.start ? new Date(eventInfo.event.start) : null;
  const end = eventInfo.event.end ? new Date(eventInfo.event.end) : null;
  const durationMinutes = start && end ? (end.getTime() - start.getTime()) / (1000 * 60) : 0;
  const isShortEvent = durationMinutes > 0 && durationMinutes < 30;

  return (
    <div
      className="fc-event-content-wrapper relative group flex items-start gap-1 cursor-pointer"
      style={{ borderLeftColor: categoryColor }}
    >
      <div className="flex-1 min-w-0">
        {!eventInfo.event.allDay && (
          <div className={`font-medium text-gray-700 ${isShortEvent ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>
            {eventInfo.timeText}
          </div>
        )}
        <div className={`font-semibold text-gray-900 truncate ${isShortEvent ? 'text-xs leading-tight' : 'text-sm'}`} title={eventInfo.event.title}>
          {eventInfo.event.title}
        </div>
        {!isShortEvent && (
          <>
            {event?.location && (
              <div className="fc-event-location text-xs text-gray-500 mt-1">
                {event.location}
              </div>
            )}
            {event?.description && (
              <div className="fc-event-description text-xs text-gray-600 mt-1 line-clamp-1">
                {event.description}
              </div>
            )}
            {event?.category && (
              <div className="fc-event-category text-xs text-gray-500 mt-1">
                {event.category.name}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const StudentPlannerCalendar: React.FC<StudentPlannerCalendarProps> = ({
  events,
  onEventClick,
  onDatesSet,
}) => {
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    return (
      <EventContentWrapper
        eventInfo={eventInfo}
      />
    );
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div id="planner-print-container" className="planner-calendar-container [&_.fc]:font-sans">
      <div className="flex justify-end mb-4 print:hidden">
        <Button
          leftSection={<IconPrinter size={16} />}
          onClick={handlePrint}
          variant="light"
        >
          Print Planner
        </Button>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={false}
        selectable={false}
        dayMaxEvents={false}
        weekends={true}
        eventClick={onEventClick}
        datesSet={onDatesSet}
        height="auto"
        eventDisplay="block"
        eventContent={renderEventContent}
        slotMinTime="07:00:00"
        slotMaxTime="18:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        allDaySlot={true}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: "short",
        }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: "short",
        }}
      />
    </div>
  );
};

