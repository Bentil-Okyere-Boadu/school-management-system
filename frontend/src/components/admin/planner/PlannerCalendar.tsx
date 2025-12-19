"use client";
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, DatesSetArg, EventContentArg } from "@fullcalendar/core";
import { PlannerEvent } from "@/@types";

interface PlannerCalendarProps {
  events: EventInput[];
  onDateSelect: (selectInfo: DateSelectArg) => void;
  onEventClick: (clickInfo: EventClickArg) => void;
  onDatesSet: (dateInfo: DatesSetArg) => void;
  // isLoading?: boolean;
}

// Custom event content renderer to match timetable style
const renderEventContent = (eventInfo: EventContentArg) => {
  const event = eventInfo.event.extendedProps.event as PlannerEvent;
  const startTime = eventInfo.timeText;
  const isAllDay = eventInfo.event.allDay;
  const categoryColor = eventInfo.event.extendedProps.categoryColor || event?.category?.color || "#10b981";

  return (
    <div 
      className="fc-event-content-wrapper"
      style={{
        borderLeftColor: categoryColor,
      }}
    >
      {!isAllDay && (
        <div className="fc-event-time text-xs font-medium text-gray-700 mb-1">
          {startTime}
        </div>
      )}
      <div className="fc-event-title font-semibold text-sm text-gray-900">
        {eventInfo.event.title}
      </div>
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
    </div>
  );
};

export const PlannerCalendar: React.FC<PlannerCalendarProps> = ({
  events,
  onDateSelect,
  onEventClick,
  onDatesSet,
  // isLoading = false,
}) => {
  return (
    <div className="planner-calendar-container [&_.fc]:font-sans">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={false}
        weekends={true}
        select={onDateSelect}
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

