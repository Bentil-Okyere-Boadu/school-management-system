"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/components/common/Dialog";
import InputField  from "@/components/InputField";
import { Select, MultiSelect, Checkbox, Button } from "@mantine/core";
import { PlannerEvent, EventCategory, ClassLevel, VisibilityScope, CreatePlannerEventPayload, ErrorResponse } from "@/@types";
import { useCreatePlannerEvent, useUpdatePlannerEvent, useGetAllSubjects } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { IconX, IconPaperclip, IconDownload, IconFile } from "@tabler/icons-react";
import { customAPI } from "../../../../config/setup";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: PlannerEvent | null;
  initialDate?: Date | null;
  categories: EventCategory[];
  classLevels: ClassLevel[];
  onSuccess: () => void;
}

interface ReminderForm {
  reminderTime: string;
  notificationType: 'email' | 'sms' | 'both';
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
  const [formData, setFormData] = useState<Omit<CreatePlannerEventPayload, 'files' | 'reminders'>>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    isAllDay: false,
    location: "",
    categoryId: "",
    visibilityScope: VisibilityScope.SCHOOL_WIDE,
    targetClassLevelIds: [],
    targetSubjectIds: [],
    sendNotifications: true,
  });
  const [reminders, setReminders] = useState<ReminderForm[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<PlannerEvent['attachments']>([]);

  const createMutation = useCreatePlannerEvent();
  const updateMutation = useUpdatePlannerEvent();
  const { subjects } = useGetAllSubjects();

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;
      
      const targetClassLevelIds = event.targetClassLevelIds || 
        (event.targetClassLevels?.map(cl => cl.id) || []);
      const targetSubjectIds = event.targetSubjectIds || 
        (event.targetSubjects?.map(subj => subj.id || '') || []);
      
      const startDateStr = event.isAllDay
        ? startDate.toISOString().slice(0, 10)
        : startDate.toISOString().slice(0, 16);
      const endDateStr = event.isAllDay
        ? endDate.toISOString().slice(0, 10)
        : endDate.toISOString().slice(0, 16);

      setFormData({
        title: event.title,
        description: event.description || "",
        startDate: startDateStr,
        endDate: endDateStr,
        isAllDay: event.isAllDay,
        location: event.location || "",
        categoryId: event.categoryId || event.category?.id || "",
        visibilityScope: event.visibilityScope,
        targetClassLevelIds,
        targetSubjectIds,
        sendNotifications: event.sendNotifications ?? true,
      });
      
      setReminders(
        event.reminders?.length > 0
          ? event.reminders.map(r => ({
              reminderTime: new Date(r.reminderTime).toISOString().slice(0, 16),
              notificationType: r.notificationType,
            }))
          : []
      );
      
      setExistingAttachments(event.attachments || []);
      setSelectedFiles([]);
    } else if (initialDate) {
      const dateStr = initialDate.toISOString().slice(0, 16);
      setFormData(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
      }));
      setReminders([]);
      setSelectedFiles([]);
      setExistingAttachments([]);
    } else {
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        isAllDay: false,
        location: "",
        categoryId: "",
        visibilityScope: VisibilityScope.SCHOOL_WIDE,
        targetClassLevelIds: [],
        targetSubjectIds: [],
        sendNotifications: true,
      });
      setReminders([]);
      setSelectedFiles([]);
      setExistingAttachments([]);
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

    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (formData.visibilityScope === VisibilityScope.CLASS_LEVEL && (!formData.targetClassLevelIds || formData.targetClassLevelIds.length === 0)) {
      toast.error("Please select at least one class");
      return;
    }

    if (formData.visibilityScope === VisibilityScope.SUBJECT && (!formData.targetSubjectIds || formData.targetSubjectIds.length === 0)) {
      toast.error("Please select at least one subject");
      return;
    }

    try {
      let startDate = new Date(formData.startDate);
      let endDate = formData.endDate ? new Date(formData.endDate) : null;

      if (formData.isAllDay) {
        startDate.setHours(0, 0, 0, 0);
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        } else {
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        }
      }

      const payload: CreatePlannerEventPayload = {
        ...formData,
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : undefined,
        reminders: reminders.length > 0 ? reminders.map(r => ({
          reminderTime: new Date(r.reminderTime).toISOString(),
          notificationType: r.notificationType,
        })) : undefined,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      };

      if (event) {
        await updateMutation.mutateAsync({ id: event.id, payload });
        toast.success("Event updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Event created successfully");
      }
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as ErrorResponse).response?.data?.message
        : "An error occurred";
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const MAX_FILES = 10;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (selectedFiles.length + fileArray.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    setSelectedFiles(prev => [...prev, ...fileArray]);
  };

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addReminder = useCallback(() => {
    setReminders(prev => [...prev, { reminderTime: "", notificationType: 'both' }]);
  }, []);

  const removeReminder = useCallback((index: number) => {
    setReminders(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateReminder = useCallback((index: number, field: keyof ReminderForm, value: string) => {
    setReminders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const classLevelOptions = classLevels.map((cls) => ({
    value: cls.id,
    label: cls.name,
  }));

  const subjectOptions = subjects?.map((subj) => ({
    value: subj.id || "",
    label: subj.name,
  }));

  const visibilityOptions = [
    { value: VisibilityScope.SCHOOL_WIDE, label: "School Wide" },
    { value: VisibilityScope.CLASS_LEVEL, label: "Specific Classes" },
    { value: VisibilityScope.SUBJECT, label: "Specific Subjects" },
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

        <Checkbox
          label="All-day event"
          checked={formData.isAllDay}
          onChange={(e) => {
            const isAllDay = e.currentTarget.checked;
            let newStartDate = formData.startDate;
            let newEndDate = formData.endDate;

            if (isAllDay && formData.startDate) {
              const startDate = new Date(formData.startDate);
              startDate.setHours(0, 0, 0, 0);
              newStartDate = startDate.toISOString().slice(0, 16);

              if (formData.endDate) {
                const endDate = new Date(formData.endDate);
                endDate.setHours(23, 59, 59, 999);
                newEndDate = endDate.toISOString().slice(0, 16);
              } else {
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 1);
                endDate.setHours(23, 59, 59, 999);
                newEndDate = endDate.toISOString().slice(0, 16);
              }
            } else if (!isAllDay && formData.startDate) {
              const startDate = new Date(formData.startDate);
              if (startDate.getHours() === 0 && startDate.getMinutes() === 0) {
                startDate.setHours(9, 0, 0, 0);
                newStartDate = startDate.toISOString().slice(0, 16);
              }

              if (formData.endDate) {
                const endDate = new Date(formData.endDate);
                if (endDate.getHours() === 23 && endDate.getMinutes() === 59) {
                  const newEnd = new Date(startDate);
                  newEnd.setHours(10, 0, 0, 0);
                  newEndDate = newEnd.toISOString().slice(0, 16);
                }
              } else {
                const endDate = new Date(startDate);
                endDate.setHours(10, 0, 0, 0);
                newEndDate = endDate.toISOString().slice(0, 16);
              }
            }

            setFormData({
              ...formData,
              isAllDay,
              startDate: newStartDate,
              endDate: newEndDate,
            });
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <InputField
              className="!py-0"
              label={formData.isAllDay ? "Start date" : "Start date & time"}
              type={formData.isAllDay ? "date" : "datetime-local"}
              value={formData.isAllDay && formData.startDate 
                ? formData.startDate.slice(0, 10) 
                : formData.startDate}
              onChange={(e) => {
                let newStartDate = e.target.value;
                let newEndDate = formData.endDate;

                if (formData.isAllDay) {
                  newStartDate = `${newStartDate}T00:00`;
                  
                  const startDate = new Date(newStartDate);
                  const endDate = new Date(startDate);
                  endDate.setDate(endDate.getDate() + 1);
                  endDate.setHours(23, 59, 59, 999);
                  newEndDate = endDate.toISOString().slice(0, 16);
                } else {
                  if (!newStartDate.includes('T')) {
                    newStartDate = `${newStartDate}T00:00`;
                  }
                }

                setFormData({ 
                  ...formData, 
                  startDate: newStartDate,
                  endDate: newEndDate,
                });
              }}
              required
              isTransulent={false}
            />
          </div>
          <div>
            <InputField
              className="!py-0"
              label={formData.isAllDay ? "End date" : "End date & time"}
              type={formData.isAllDay ? "date" : "datetime-local"}
              value={formData.isAllDay && formData.endDate 
                ? formData.endDate.slice(0, 10) 
                : formData.endDate}
              onChange={(e) => {
                let newEndDate = e.target.value;
                if (formData.isAllDay) {
                  newEndDate = `${newEndDate}T23:59`;
                } else {
                  if (!newEndDate.includes('T')) {
                    newEndDate = `${newEndDate}T00:00`;
                  }
                }
                setFormData({ ...formData, endDate: newEndDate });
              }}
              isTransulent={false}
            />
          </div>
        </div>

        <InputField
          className="!py-0"
          label="Location"
          placeholder="Enter event location (optional)"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          isTransulent={false}
        />

        <Checkbox
          label="Send Notifications"
          checked={formData.sendNotifications ?? true}
          onChange={(e) => setFormData({ ...formData, sendNotifications: e.currentTarget.checked })}
        />

        <Select
          label="Category"
          placeholder="Select category"
          data={categoryOptions}
          value={formData.categoryId || null}
          onChange={(value) => setFormData({ ...formData, categoryId: value || "" })}
          required
        />

        <Select
          label="Visibility Scope"
          placeholder="Select visibility scope"
          data={visibilityOptions}
          value={formData.visibilityScope}
          onChange={(value) => {
            const scope = value as VisibilityScope;
            setFormData({ 
              ...formData, 
              visibilityScope: scope,
              targetClassLevelIds: scope === VisibilityScope.CLASS_LEVEL ? formData.targetClassLevelIds : [],
              targetSubjectIds: scope === VisibilityScope.SUBJECT ? formData.targetSubjectIds : [],
            });
          }}
          required
        />

        {formData.visibilityScope === VisibilityScope.CLASS_LEVEL && (
          <MultiSelect
            label="Select Classes"
            placeholder="Select classes"
            data={classLevelOptions}
            value={formData.targetClassLevelIds || []}
            onChange={(value) => setFormData({ ...formData, targetClassLevelIds: value })}
            searchable
            withCheckIcon
            required
          />
        )}

        {formData.visibilityScope === VisibilityScope.SUBJECT && (
          <MultiSelect
            label="Select Subjects"
            placeholder="Select subjects"
            data={subjectOptions}
            value={formData.targetSubjectIds || []}
            onChange={(value) => setFormData({ ...formData, targetSubjectIds: value })}
            searchable
            withCheckIcon
            required
          />
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Reminders</label>
            <Button size="xs" variant="light" onClick={addReminder}>
              + Add Reminder
            </Button>
          </div>
          {reminders.map((reminder, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <InputField
                className="!py-0 flex-1 !mt-3"
                label=""
                type="datetime-local"
                value={reminder.reminderTime}
                onChange={(e) => updateReminder(index, 'reminderTime', e.target.value)}
                isTransulent={false}
              />
              <Select
                className="flex-1 -mt-3"
                data={[
                  { value: 'email', label: 'Email' },
                  { value: 'sms', label: 'SMS' },
                  { value: 'both', label: 'Both' },
                ]}
                value={reminder.notificationType}
                onChange={(value) => updateReminder(index, 'notificationType', value as 'email' | 'sms' | 'both')}
              />
              <Button
                className="-mt-4"
                size="sm"
                variant="light"
                color="red"
                onClick={() => removeReminder(index)}
              >
                <IconX size={16} />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">Attachments (Max 10 files)</label>
          
          {/* Existing Attachments */}
              {existingAttachments && existingAttachments?.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs text-gray-600 mb-2">Current attachments:</p>
                  {existingAttachments?.map((attachment) => {
                    const signedUrl = attachment.signedUrl;
                    const isImage = attachment.mediaType?.startsWith('image/');
                    const fileSizeKB = attachment.fileSize ? `${(Number(attachment.fileSize) / 1024).toFixed(1)} KB` : '';
                
                return (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isImage ? (
                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <IconFile size={20} className="text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <IconFile size={20} className="text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {fileSizeKB}
                        </p>
                      </div>
                    </div>
                    {signedUrl && (
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                        title="Download or open file"
                      >
                        <IconDownload size={18} />
                      </a>
                    )}
                  </div>
                );
              })}
              <p className="text-xs text-blue-600 mt-1">
                Upload new files below to add more attachments
              </p>
            </div>
          )}
          
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <IconPaperclip size={16} />
            <span>Select Files</span>
          </label>
          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <IconX size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

