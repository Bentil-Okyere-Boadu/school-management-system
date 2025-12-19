"use client";
import React, { useState, useMemo } from "react";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { useGetPlannerEvents, useGetEventCategories, useGetClassLevels } from "@/hooks/school-admin";
import { PlannerEvent } from "@/@types";
import { PlannerCalendar } from "@/components/admin/planner/PlannerCalendar";
import { EventFormModal } from "@/components/admin/planner/EventFormModal";
import { CategoryManagementModal } from "@/components/admin/planner/CategoryManagementModal";
import { Button } from "@mantine/core";
import { IconPlus, IconCategory } from "@tabler/icons-react";

const PlannerPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewStart, setViewStart] = useState<string>("");
  const [viewEnd, setViewEnd] = useState<string>("");

  const { events, refetch: refetchEvents } = useGetPlannerEvents(
    viewStart,
    viewEnd,
  );
  // isLoading: eventsLoading,

  const { categories } = useGetEventCategories();
  const { classLevels } = useGetClassLevels();

  // Utility function to lighten a hex color
  const lightenColor = (hex: string, percent: number = 85): string => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    const newR = Math.round(r + (255 - r) * (percent / 100));
    const newG = Math.round(g + (255 - g) * (percent / 100));
    const newB = Math.round(b + (255 - b) * (percent / 100));
    
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  };

  const calendarEvents: EventInput[] = useMemo(() => {
    return events?.map((event) => {
      // Calculate end time if not provided (default to 1 hour)
      let endTime = event.endDate;
      if (!endTime && !event.isAllDay) {
        const start = new Date(event.startDate);
        endTime = new Date(start.getTime() + 60 * 60 * 1000).toISOString(); // Add 1 hour
      }

      const categoryColor = event.category?.color || "#10b981";
      const lightBackground = lightenColor(categoryColor, 85);

      return {
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: endTime || event.startDate,
        allDay: event.isAllDay,
        backgroundColor: lightBackground,
        borderColor: categoryColor,
        borderWidth: 0,
        textColor: "#1F2937",
        className: 'planner-event',
        extendedProps: {
          event: event,
          categoryColor: categoryColor,
        },
        style: {
          borderLeft: `4px solid ${categoryColor}`,
          backgroundColor: lightBackground,
        },
      };
    });
  }, [events]);

  const handleDateSelect = (selectInfo: { start: Date; end: Date; allDay: boolean }) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event.extendedProps.event as PlannerEvent);
    setIsEventModalOpen(true);
  };

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    setViewStart(dateInfo.start.toISOString());
    setViewEnd(dateInfo.end.toISOString());
  };

  const handleEventModalClose = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-neutral-800">Planner</h1>
        <div className="flex gap-2">
          <Button
            leftSection={<IconCategory size={16} />}
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Manage Categories
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setSelectedDate(new Date());
              setSelectedEvent(null);
              setIsEventModalOpen(true);
            }}
          >
            New Event
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <PlannerCalendar
          events={calendarEvents}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          onDatesSet={handleDatesSet}
          // isLoading={eventsLoading}
        />
      </div>

      {isEventModalOpen && (
        <EventFormModal
          isOpen={isEventModalOpen}
          onClose={handleEventModalClose}
          event={selectedEvent}
          initialDate={selectedDate}
          categories={categories}
          classLevels={classLevels}
          onSuccess={() => {
            refetchEvents();
            handleEventModalClose();
          }}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryManagementModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onSuccess={() => {
            refetchEvents();
          }}
        />
      )}
    </div>
  );
};

export default PlannerPage;

