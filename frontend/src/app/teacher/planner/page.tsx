"use client";
import React, { useState, useMemo, useCallback } from "react";
import type { EventInput, EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useGetTeacherPlannerEvents, useGetTeacherEventCategories, useGetTeacherClasses, useGetTeacherSubjects, useDeleteTeacherPlannerEvent, useUpdateTeacherPlannerEvent, useTeacherGetMe } from "@/hooks/teacher";
import { PlannerEvent, Subject } from "@/@types";
import { PlannerCalendar } from "@/components/admin/planner/PlannerCalendar";
import { TeacherEventFormModal } from "@/components/teacher/planner/TeacherEventFormModal";
import { Dialog } from "@/components/common/Dialog";
import FilterButton from "@/components/common/FilterButton";
import { Button, Select, Group } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { lightenColor } from "@/utils/colorUtils";
import { calculateEventEndTime, calculateAllDayEventDuration, setAllDayStartTime, setAllDayEndTime } from "@/utils/dateUtils";

interface EventFilters {
  categoryId?: string;
  classLevelId?: string;
  subjectId?: string;
}

const DEFAULT_CATEGORY_COLOR = "#10b981";
const DEFAULT_TEXT_COLOR = "#1F2937";
const LIGHTEN_PERCENT = 85;

const TeacherPlannerPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<PlannerEvent | null>(null);
  const [viewStart, setViewStart] = useState<string>("");
  const [viewEnd, setViewEnd] = useState<string>("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});

  const { events, refetch: refetchEvents } = useGetTeacherPlannerEvents(
    viewStart,
    viewEnd,
    filters.categoryId,
    filters.classLevelId,
    filters.subjectId,
  );

  const { categories } = useGetTeacherEventCategories();
  const { classLevels } = useGetTeacherClasses();
  const { teacherSubjects } = useGetTeacherSubjects();
  const { me: currentTeacher } = useTeacherGetMe();
  const deleteEventMutation = useDeleteTeacherPlannerEvent();
  const updateEventMutation = useUpdateTeacherPlannerEvent();

  // Check if an event is editable (not admin-created)
  const isEventEditable = useCallback((event: PlannerEvent): boolean => {
    if (event.createdByAdminId) {
      return false;
    }
    if (event.createdByTeacherId && currentTeacher?.id) {
      return event.createdByTeacherId === currentTeacher.id;
    }
    
    return true;
  }, [currentTeacher]);

  const calendarEvents: EventInput[] = useMemo(() => {
    if (!events) return [];
    
    return events.map((event) => {
      const categoryColor = event.category?.color || DEFAULT_CATEGORY_COLOR;
      const lightBackground = lightenColor(categoryColor, LIGHTEN_PERCENT);
      const endTime = calculateEventEndTime(event.startDate, event.endDate, event.isAllDay);
      const editable = isEventEditable(event);

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
        editable: editable,
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
  }, [events, isEventEditable]);

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
    // Prevent deleting admin-created events
    if (!isEventEditable(event)) {
      toast.error("Cannot delete admin-created events");
      return;
    }
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  }, [isEventEditable]);

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

    // Prevent dropping admin-created events
    if (!isEventEditable(event)) {
      dropInfo.revert();
      toast.error("Cannot modify admin-created events");
      return;
    }

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
  }, [updateEventMutation, refetchEvents, isEventEditable]);

  const handleEventResize = useCallback(async (resizeInfo: EventResizeDoneArg) => {
    const event = resizeInfo.event.extendedProps.event as PlannerEvent;
    if (!event) return;

    // Prevent resizing admin-created events
    if (!isEventEditable(event)) {
      resizeInfo.revert();
      toast.error("Cannot modify admin-created events");
      return;
    }

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
  }, [updateEventMutation, refetchEvents, isEventEditable]);

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

  // Get unique subject catalogs from teacher subjects
  // Note: teacherSubjects is actually SubjectCatalog[] from backend
  const subjectOptions = useMemo(() => {
    return (teacherSubjects)?.map((subj: Subject) => ({
      value: subj.id || "",
      label: subj.name || "",
    })) || [];
  }, [teacherSubjects]);

  const filterOptions = useMemo(() => ({
    categories: categories?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [],
    classLevels: classLevels?.map((cls) => ({
      value: cls.id,
      label: cls.name,
    })) || [],
    subjects: subjectOptions,
  }), [categories, classLevels, subjectOptions]);

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
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleNewEventClick}
        >
          New Event
        </Button>
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
            </Group>
          </div>
        )}
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
          isEventEditable={isEventEditable}
        />
      </div>

      {isEventModalOpen && (
        <TeacherEventFormModal
          isOpen={isEventModalOpen}
          onClose={handleEventModalClose}
          event={selectedEvent}
          initialDate={selectedDate}
          categories={categories}
          classLevels={classLevels}
          teacherSubjects={teacherSubjects}
          onSuccess={() => {
            refetchEvents();
            handleEventModalClose();
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

export default TeacherPlannerPage;

