"use client";
import React, { useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { EventResizeDoneArg }  from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, DatesSetArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import { PlannerEvent } from "@/@types";
import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

const DEFAULT_CATEGORY_COLOR = "#10b981";

interface PlannerCalendarProps {
  events: EventInput[];
  onDateSelect: (selectInfo: DateSelectArg) => void;
  onEventClick: (clickInfo: EventClickArg) => void;
  onDeleteClick: (event: PlannerEvent) => void;
  onEventDrop: (dropInfo: EventDropArg) => void;
  onEventResize?: (resizeInfo: EventResizeDoneArg) => void;
  onDatesSet: (dateInfo: DatesSetArg) => void;
  isEventEditable?: (event: PlannerEvent) => boolean;
}

interface EventContentWrapperProps {
  eventInfo: EventContentArg;
  onDeleteClick: (event: PlannerEvent) => void;
  isEditable?: boolean;
}

const EventContentWrapper: React.FC<EventContentWrapperProps> = ({
  eventInfo,
  onDeleteClick,
  isEditable = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const event = eventInfo.event.extendedProps.event as PlannerEvent;
  const categoryColor = eventInfo.event.extendedProps.categoryColor || event?.category?.color || DEFAULT_CATEGORY_COLOR;

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (event && isEditable) {
      onDeleteClick(event);
    }
  }, [event, onDeleteClick, isEditable]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const start = eventInfo.event.start ? new Date(eventInfo.event.start) : null;
  const end = eventInfo.event.end ? new Date(eventInfo.event.end) : null;
  const durationMinutes = start && end ? (end.getTime() - start.getTime()) / (1000 * 60) : 0;
  const isShortEvent = durationMinutes > 0 && durationMinutes < 30;

  return (
    <div
      className="fc-event-content-wrapper relative group flex items-start gap-1 cursor-pointer"
      style={{ borderLeftColor: categoryColor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      {event && isEditable && (
        <ActionIcon
          size="sm"
          variant="filled"
          color="red"
          className={`flex-shrink-0 transition-opacity duration-150 z-10 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          } hover:opacity-100`}
          onClick={handleDeleteClick}
          title="Delete event"
        >
          <IconTrash size={14} />
        </ActionIcon>
      )}
    </div>
  );
};

export const PlannerCalendar: React.FC<PlannerCalendarProps> = ({
  events,
  onDateSelect,
  onEventClick,
  onDeleteClick,
  onEventDrop,
  onEventResize,
  onDatesSet,
  isEventEditable,
}) => {
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const event = eventInfo.event.extendedProps.event as PlannerEvent;
    const editable = isEventEditable ? isEventEditable(event) : true;
    
    return (
      <EventContentWrapper
        eventInfo={eventInfo}
        onDeleteClick={onDeleteClick}
        isEditable={editable}
      />
    );
  }, [onDeleteClick, isEventEditable]);

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
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        datesSet={onDatesSet}
        height="auto"
        eventDisplay="block"
        eventContent={renderEventContent}
        eventAllow={(_dropInfo, draggedEvent) => {
          if (isEventEditable && draggedEvent?.extendedProps?.event) {
            const event = draggedEvent.extendedProps.event as PlannerEvent;
            return isEventEditable(event);
          }
          return true;
        }}
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

