"use client";
import React, { useState, useMemo, useCallback } from "react";
import { EventInput, EventClickArg, EventDropArg, EventResizeArg } from "@fullcalendar/core";
import { useGetPlannerEvents, useGetEventCategories, useGetClassLevels, useGetAllSubjects, useDeletePlannerEvent, useUpdatePlannerEvent } from "@/hooks/school-admin";
import { PlannerEvent, VisibilityScope } from "@/@types";
import { PlannerCalendar } from "@/components/admin/planner/PlannerCalendar";
import { EventFormModal } from "@/components/admin/planner/EventFormModal";
import { CategoryManagementModal } from "@/components/admin/planner/CategoryManagementModal";
import { Dialog } from "@/components/common/Dialog";
import FilterButton from "@/components/common/FilterButton";
import { Button, Select, Group } from "@mantine/core";
import { IconPlus, IconCategory, IconX } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { lightenColor } from "@/utils/colorUtils";
import { calculateEventEndTime, calculateAllDayEventDuration, setAllDayStartTime, setAllDayEndTime } from "@/utils/dateUtils";

interface EventFilters {
  categoryId?: string;
  classLevelId?: string;
  subjectId?: string;
  visibilityScope?: VisibilityScope;
}

const DEFAULT_CATEGORY_COLOR = "#10b981";
const DEFAULT_TEXT_COLOR = "#1F2937";
const LIGHTEN_PERCENT = 85;

const PlannerPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<PlannerEvent | null>(null);
  const [viewStart, setViewStart] = useState<string>("");
  const [viewEnd, setViewEnd] = useState<string>("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});

  const { events, refetch: refetchEvents } = useGetPlannerEvents(
    viewStart,
    viewEnd,
    filters.categoryId,
    filters.classLevelId,
    filters.subjectId,
    filters.visibilityScope,
  );

  const { categories } = useGetEventCategories();
  const { classLevels } = useGetClassLevels();
  const { subjects } = useGetAllSubjects();
  const deleteEventMutation = useDeletePlannerEvent();
  const updateEventMutation = useUpdatePlannerEvent();

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

  const handleDateSelect = useCallback((selectInfo: { start: Date; end: Date; allDay: boolean }) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps.event as PlannerEvent;
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((event: PlannerEvent) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!eventToDelete) return;

    try {
      await deleteEventMutation.mutateAsync(eventToDelete.id);
      toast.success("Event deleted successfully");
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
      refetchEvents();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to delete event";
      toast.error(errorMessage || "Failed to delete event");
    }
  }, [eventToDelete, deleteEventMutation, refetchEvents]);

  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const event = dropInfo.event.extendedProps.event as PlannerEvent;
    if (!event) return;

    const newStartDate = dropInfo.event.start;
    if (!newStartDate) {
      dropInfo.revert();
      toast.error("Invalid date");
      return;
    }

    let newEndDate: Date | undefined;

    if (dropInfo.event.allDay) {
      if (dropInfo.event.end) {
        newEndDate = dropInfo.event.end;
        setAllDayEndTime(newEndDate);
      } else {
        const durationDays = calculateAllDayEventDuration(
          new Date(event.startDate),
          event.endDate ? new Date(event.endDate) : null,
        );
        
        newEndDate = new Date(newStartDate);
        setAllDayStartTime(newEndDate);
        newEndDate.setDate(newEndDate.getDate() + durationDays);
        setAllDayEndTime(newEndDate);
      }
      setAllDayStartTime(newStartDate);
    } else {
      if (dropInfo.event.end) {
        newEndDate = dropInfo.event.end;
      } else if (event.endDate) {
        const originalDuration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
        newEndDate = new Date(newStartDate.getTime() + originalDuration);
      } else {
        newEndDate = new Date(newStartDate.getTime() + 60 * 60 * 1000);
      }
    }

    try {
      await updateEventMutation.mutateAsync({
        id: event.id,
        payload: {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate ? newEndDate.toISOString() : undefined,
          isAllDay: dropInfo.event.allDay,
        },
      });
      toast.success("Event updated successfully");
      refetchEvents();
    } catch (error: unknown) {
      dropInfo.revert();
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to update event";
      toast.error(errorMessage || "Failed to update event");
    }
  }, [updateEventMutation, refetchEvents]);

  const handleEventResize = useCallback(async (resizeInfo: EventResizeArg) => {
    const event = resizeInfo.event.extendedProps.event as PlannerEvent;
    if (!event) return;

    const newStartDate = resizeInfo.event.start;
    const newEndDate = resizeInfo.event.end || resizeInfo.event.start;

    if (!newStartDate || !newEndDate) {
      resizeInfo.revert();
      toast.error("Invalid date range");
      return;
    }

    try {
      await updateEventMutation.mutateAsync({
        id: event.id,
        payload: {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        },
      });
      toast.success("Event updated successfully");
      refetchEvents();
    } catch (error: unknown) {
      resizeInfo.revert();
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to update event";
      toast.error(errorMessage || "Failed to update event");
    }
  }, [updateEventMutation, refetchEvents]);

  const handleDatesSet = useCallback((dateInfo: { start: Date; end: Date }) => {
    setViewStart(dateInfo.start.toISOString());
    setViewEnd(dateInfo.end.toISOString());
  }, []);

  const handleEventModalClose = useCallback(() => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleNewEventClick = useCallback(() => {
    setSelectedDate(new Date());
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== undefined && value !== "");
  }, [filters]);

  const filterOptions = useMemo(() => ({
    categories: categories?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [],
    classLevels: classLevels?.map((cls) => ({
      value: cls.id,
      label: cls.name,
    })) || [],
    subjects: subjects?.map((subj) => ({
      value: subj.id || "",
      label: subj.name,
    })) || [],
    visibilityScopes: [
      { value: VisibilityScope.SCHOOL_WIDE, label: "School Wide" },
      { value: VisibilityScope.CLASS_LEVEL, label: "Class Level" },
      { value: VisibilityScope.SUBJECT, label: "Subject" },
    ],
  }), [categories, classLevels, subjects]);

  const handleFilterChange = useCallback((key: keyof EventFilters, value: string | VisibilityScope | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-semibold text-neutral-800">Planner</h1>
          <div className="flex flex-col items-start mt-2">
            <FilterButton onClick={() => setShowFilterOptions(!showFilterOptions)} />
            {showFilterOptions && (
              <div className="bg-white rounded-lg shadow-sm p-4 mt-3 w-full border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
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
                    style={{ flex: 1, minWidth: 180 }}
                  />
                  <Select
                    label="Class Level"
                    placeholder="All classes"
                    data={filterOptions.classLevels}
                    value={filters.classLevelId || null}
                    onChange={(value) => handleFilterChange('classLevelId', value)}
                    clearable
                    style={{ flex: 1, minWidth: 180 }}
                  />
                  <Select
                    label="Subject"
                    placeholder="All subjects"
                    data={filterOptions.subjects}
                    value={filters.subjectId || null}
                    onChange={(value) => handleFilterChange('subjectId', value)}
                    clearable
                    style={{ flex: 1, minWidth: 180 }}
                  />
                  <Select
                    label="Visibility Scope"
                    placeholder="All scopes"
                    data={filterOptions.visibilityScopes}
                    value={filters.visibilityScope || null}
                    onChange={(value) => handleFilterChange('visibilityScope', value as VisibilityScope)}
                    clearable
                    style={{ flex: 1, minWidth: 180 }}
                  />
                </Group>
              </div>
            )}
          </div>
        </div>
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
            onClick={handleNewEventClick}
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
          onDeleteClick={handleDeleteClick}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onDatesSet={handleDatesSet}
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

      <Dialog
        isOpen={isDeleteDialogOpen}
        busy={deleteEventMutation.isPending}
        dialogTitle="Delete Event"
        saveButtonText="Delete"
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setEventToDelete(null);
        }}
        onSave={handleDeleteConfirm}
      >
        <div className="my-3 flex flex-col gap-4">
          <p>
            Are you sure you want to delete the event &quot;{eventToDelete?.title}&quot;?
            This action cannot be undone.
          </p>
        </div>
      </Dialog>
    </div>
  );
};

export default PlannerPage;

