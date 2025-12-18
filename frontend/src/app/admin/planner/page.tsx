"use client";
import React, { useState, useMemo } from "react";
import { EventInput } from "@fullcalendar/core";
import { useGetPlannerEvents, useGetEventCategories, useGetClassLevels } from "@/hooks/school-admin";
import { PlannerEvent, EventVisibility } from "@/@types";
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const { events, isLoading: eventsLoading, refetch: refetchEvents } = useGetPlannerEvents(
    viewStart,
    viewEnd,
    selectedCategoryId
  );
  const { categories } = useGetEventCategories();
  const { classLevels } = useGetClassLevels();

  const calendarEvents: EventInput[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startDate,
      end: event.endDate || event.startDate,
      allDay: event.allDay,
      backgroundColor: event.category?.color || "#3788d8",
      borderColor: event.category?.color || "#3788d8",
      extendedProps: {
        event: event,
      },
    }));
  }, [events]);

  const handleDateSelect = (selectInfo: { start: Date; end: Date; allDay: boolean }) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (clickInfo: { event: { extendedProps: { event: PlannerEvent } } }) => {
    setSelectedEvent(clickInfo.event.extendedProps.event);
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
          isLoading={eventsLoading}
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

