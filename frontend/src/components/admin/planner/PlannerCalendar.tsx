"use client";
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, DatesSetArg } from "@fullcalendar/core";

interface PlannerCalendarProps {
  events: EventInput[];
  onDateSelect: (selectInfo: DateSelectArg) => void;
  onEventClick: (clickInfo: EventClickArg) => void;
  onDatesSet: (dateInfo: DatesSetArg) => void;
  isLoading?: boolean;
}

export const PlannerCalendar: React.FC<PlannerCalendarProps> = ({
  events,
  onDateSelect,
  onEventClick,
  onDatesSet,
  isLoading = false,
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
        dayMaxEvents={true}
        weekends={true}
        select={onDateSelect}
        eventClick={onEventClick}
        datesSet={onDatesSet}
        height="auto"
        eventDisplay="block"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: "short",
        }}
      />
    </div>
  );
};

