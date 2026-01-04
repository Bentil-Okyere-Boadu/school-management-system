"use client";
import React, { useState, useMemo, useCallback } from "react";
import type { EventInput, EventClickArg } from "@fullcalendar/core";
import type { DatesSetArg } from "@fullcalendar/core";
import { useGetStudentPlannerEvents, useGetStudentEventCategories } from "@/hooks/student";
import { PlannerEvent } from "@/@types";
import { StudentPlannerCalendar } from "@/components/student/planner/StudentPlannerCalendar";
import { StudentEventDetailModal } from "@/components/student/planner/StudentEventDetailModal";
import FilterButton from "@/components/common/FilterButton";
import { Select, Group, Button } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { lightenColor } from "@/utils/colorUtils";
import { calculateEventEndTime } from "@/utils/dateUtils";

interface EventFilters {
  categoryId?: string;
}

const DEFAULT_CATEGORY_COLOR = "#10b981";
const DEFAULT_TEXT_COLOR = "#1F2937";
const LIGHTEN_PERCENT = 85;

const StudentPlannerPage: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [viewStart, setViewStart] = useState<string>("");
  const [viewEnd, setViewEnd] = useState<string>("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});

  const { events } = useGetStudentPlannerEvents(
    viewStart,
    viewEnd,
    filters.categoryId,
  );

  const { categories } = useGetStudentEventCategories();

  const calendarEvents: EventInput[] = useMemo(() => {
    if (!events) return [];
    
    return events.map((event) => {
      const categoryColor = event.category?.color || DEFAULT_CATEGORY_COLOR;
      const lightBackground = lightenColor(categoryColor, LIGHTEN_PERCENT);
      const endTime = calculateEventEndTime(event.startDate, event.endDate, event.isAllDay);

      return {
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: endTime,
        allDay: event.isAllDay,
        backgroundColor: lightBackground,
        borderColor: categoryColor,
        borderWidth: 0,
        textColor: DEFAULT_TEXT_COLOR,
        className: 'planner-event',
        extendedProps: {
          event,
          categoryColor,
        },
        style: {
          borderLeft: `4px solid ${categoryColor}`,
          backgroundColor: lightBackground,
        },
      };
    });
  }, [events]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps.event as PlannerEvent;
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }, []);

  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    setViewStart(dateInfo.start.toISOString());
    setViewEnd(dateInfo.end.toISOString());
  }, []);

  const handleEventModalClose = useCallback(() => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== undefined && value !== "");
  }, [filters]);

  const filterOptions = useMemo(() => ({
    categories: categories?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [],
  }), [categories]);

  const handleFilterChange = useCallback((key: keyof EventFilters, value: string | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-neutral-800">Planner</h1>
      </div>

      <div className="flex flex-col items-start">
        <FilterButton onClick={() => setShowFilterOptions(!showFilterOptions)} />
        {showFilterOptions && (
          <div className="bg-white rounded-lg shadow-sm p-4 pb-2 mt-3 w-full border border-gray-200">
            <div className="flex items-center justify-end">
              {hasActiveFilters && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={14} />}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <Group gap="md" align="flex-start">
              <Select
                label="Category"
                placeholder="All categories"
                data={filterOptions.categories}
                value={filters.categoryId || null}
                onChange={(value) => handleFilterChange('categoryId', value)}
                clearable
                style={{ flex: 1, minWidth: 180, maxWidth: 350 }}
              />
            </Group>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <StudentPlannerCalendar
          events={calendarEvents}
          onEventClick={handleEventClick}
          onDatesSet={handleDatesSet}
        />
      </div>

      {isEventModalOpen && selectedEvent && (
        <StudentEventDetailModal
          isOpen={isEventModalOpen}
          onClose={handleEventModalClose}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default StudentPlannerPage;

