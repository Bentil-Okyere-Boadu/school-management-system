"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/common/Dialog";
import InputField  from "@/components/InputField";
import { Select, MultiSelect, Checkbox } from "@mantine/core";
import { PlannerEvent, EventCategory, ClassLevel, EventVisibility, CreatePlannerEventPayload } from "@/@types";
import { useCreatePlannerEvent, useUpdatePlannerEvent } from "@/hooks/school-admin";
import { toast } from "react-toastify";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: PlannerEvent | null;
  initialDate?: Date | null;
  categories: EventCategory[];
  classLevels: ClassLevel[];
  onSuccess: () => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  event,
  initialDate,
  categories,
  classLevels,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreatePlannerEventPayload>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allDay: false,
    categoryId: "",
    visibility: EventVisibility.SCHOOL_WIDE,
    classLevelIds: [],
    hasReminder: false,
    reminderDate: "",
  });

  const createMutation = useCreatePlannerEvent();
  const updateMutation = useUpdatePlannerEvent();

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;
      
      setFormData({
        title: event.title,
        description: event.description || "",
        startDate: startDate.toISOString().slice(0, 16),
        endDate: endDate.toISOString().slice(0, 16),
        allDay: event.allDay,
        categoryId: event.categoryId || "",
        visibility: event.visibility,
        classLevelIds: event.classLevelIds || [],
        hasReminder: event.hasReminder,
        reminderDate: event.reminderDate ? new Date(event.reminderDate).toISOString().slice(0, 16) : "",
      });
    } else if (initialDate) {
      const dateStr = initialDate.toISOString().slice(0, 16);
      setFormData({
        ...formData,
        startDate: dateStr,
        endDate: dateStr,
      });
    } else {
      // Reset form
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        allDay: false,
        categoryId: "",
        visibility: EventVisibility.SCHOOL_WIDE,
        classLevelIds: [],
        hasReminder: false,
        reminderDate: "",
      });
    }
  }, [event, initialDate]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    if (!formData.startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (formData.visibility === EventVisibility.CLASS && (!formData.classLevelIds || formData.classLevelIds.length === 0)) {
      toast.error("Please select at least one class");
      return;
    }

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        reminderDate: formData.hasReminder && formData.reminderDate ? new Date(formData.reminderDate).toISOString() : undefined,
      };

      if (event) {
        await updateMutation.mutateAsync({ id: event.id, payload });
        toast.success("Event updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Event created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save event");
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const classLevelOptions = classLevels.map((cls) => ({
    value: cls.id,
    label: cls.name,
  }));

  const visibilityOptions = [
    { value: EventVisibility.SCHOOL_WIDE, label: "School Wide" },
    { value: EventVisibility.CLASS, label: "Specific Classes" },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      dialogTitle={event ? "Edit Event" : "Create New Event"}
      saveButtonText={event ? "Update Event" : "Create Event"}
      onClose={onClose}
      onSave={handleSubmit}
      busy={createMutation.isPending || updateMutation.isPending}
      dialogWidth="w-[700px] max-w-[701px]"
    >
      <div className="my-3 flex flex-col gap-4">
        <InputField
          className="!py-0"
          label="Event Title"
          placeholder="Enter event title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          isTransulent={false}
        />

        <InputField
          className="!py-0"
          label="Description"
          placeholder="Enter event description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          isTransulent={false}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <InputField
              className="!py-0"
              label="Start Date & Time"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              isTransulent={false}
            />
          </div>
          <div>
            <InputField
              className="!py-0"
              label="End Date & Time"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              isTransulent={false}
            />
          </div>
        </div>

        <Checkbox
          label="All Day Event"
          checked={formData.allDay}
          onChange={(e) => setFormData({ ...formData, allDay: e.currentTarget.checked })}
        />

        <Select
          label="Category"
          placeholder="Select category (optional)"
          data={categoryOptions}
          value={formData.categoryId || null}
          onChange={(value) => setFormData({ ...formData, categoryId: value || "" })}
          clearable
        />

        <Select
          label="Visibility"
          placeholder="Select visibility"
          data={visibilityOptions}
          value={formData.visibility}
          onChange={(value) => setFormData({ ...formData, visibility: value as EventVisibility, classLevelIds: value === EventVisibility.CLASS ? formData.classLevelIds : [] })}
          required
        />

        {formData.visibility === EventVisibility.CLASS && (
          <MultiSelect
            label="Select Classes"
            placeholder="Select classes"
            data={classLevelOptions}
            value={formData.classLevelIds || []}
            onChange={(value) => setFormData({ ...formData, classLevelIds: value })}
            searchable
            withCheckIcon
            required
          />
        )}

        <Checkbox
          label="Set Reminder"
          checked={formData.hasReminder}
          onChange={(e) => setFormData({ ...formData, hasReminder: e.currentTarget.checked })}
        />

        {formData.hasReminder && (
          <InputField
            className="!py-0"
            label="Reminder Date & Time"
            type="datetime-local"
            value={formData.reminderDate}
            onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
            isTransulent={false}
          />
        )}
      </div>
    </Dialog>
  );
};

