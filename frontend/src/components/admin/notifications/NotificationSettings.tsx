"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { MultiSelect, Select, Textarea } from "@mantine/core";
import CustomUnderlinedButton from "@/components/common/CustomUnderlinedButton";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { SearchBar } from "@/components/common/SearchBar";
import InputField from "@/components/InputField";
import { Dialog } from "@/components/common/Dialog";
import { toast } from "react-toastify";

// hooks
import {
  useGetReminders,
  useCreateReminder,
  useEditReminder,
  useDeleteReminder,
  useGetClassLevels,
  useGetSchoolUsers,
} from "@/hooks/school-admin";
import { ErrorResponse, Reminder, Student } from "@/@types";

export const NotificationSettings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    useState(false);

  const [editMode, setEditMode] = useState(false);
  const [reminderId, setReminderId] = useState("");
  const isShow = false;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("immediate");
  const [status, setStatus] = useState("active");
  const [targetClassLevelIds, setTargetClassLevelIds] = useState<string[]>([]);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [sendToStudents, setSendToStudents] = useState(false);
  const [sendToParents, setSendToParents] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const [reminderTypeOptions] = useState([
    { value: "immediate", label: "Immediate" },
    { value: "scheduled", label: "Scheduled" },
  ]);

  const { classLevels } = useGetClassLevels();
  const allClassLvlOptions = classLevels?.map((classLvl) => {
    return { value: classLvl.id, label: classLvl.name };
  });

  const handleClassesSelect = (value: string[]) => {
    setTargetClassLevelIds(value);
  };

  const { schoolUsers: allStudents } = useGetSchoolUsers(
    1,
    "",
    "",
    "",
    "Student",
    300
  );
  const allStudentOptions = allStudents?.map((student: Student) => {
      return { value: student.id, label: `${student.firstName + ' ' + student.lastName}` };
  });

  const handleStudentsSelect = (value: string[]) => {
    setTargetStudentIds(value);
  };

  const { allReminders, refetch } = useGetReminders(
    searchQuery,
    "", // status,
    "", // type
    "", // dateFrom
    "", // dateTo
    "" // page
  );

  const handleReminderTypeChange = (value: string | null) => {
    if (value) {
      setType(value);
      setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const { mutate: createMutation, isPending: pendingCreate } =
    useCreateReminder();
  const { mutate: editMutation, isPending: pendingEdit } =
    useEditReminder(reminderId);
  const { mutate: deleteMutation, isPending: pendingDelete } =
    useDeleteReminder();

  // reset form
  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("immediate");
    setStatus("active");
    setSendToStudents(false);
    setSendToParents(false);
    setReminderId("");
    setTargetClassLevelIds([]);
    setTargetStudentIds([]);
    setScheduledDate("")
    setScheduledTime("")
  };

  const onAddNewReminder = () => {
    resetForm();
    setEditMode(false);
    setIsReminderDialogOpen(true);
  };

  const buildDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00.000Z`).toISOString();
  };

  const splitDateTime = (dateTime: string | null) => {
  if (!dateTime || typeof dateTime !== "string") return { date: "", time: "" };
    const d = new Date(dateTime);
    const date = d.toISOString()?.slice(0, 10);
    const time = d.toISOString()?.slice(11, 16);

    return { date, time };
  };


  const onEditReminderClick = (reminder: Reminder) => {
    setEditMode(true);
    setReminderId(reminder.id);
    setTitle(reminder.title);
    setMessage(reminder.message);
    setType(reminder.type);
    setStatus(reminder.status);
    setSendToStudents(reminder.sendToStudents);
    setSendToParents(reminder.sendToParents);
    setTargetClassLevelIds(reminder.targetClassLevels?.map(
        (classLvl: { id: string }) => classLvl.id
    ) || []);
    setTargetStudentIds(reminder.targetStudents?.map(
        (student: { id: string }) => student.id
    ) || []);

    if (reminder.type === "scheduled" && reminder.scheduledAt) {
      const { date, time } = splitDateTime(reminder.scheduledAt);
      setScheduledDate(date);
      setScheduledTime(time);
    }

    setIsReminderDialogOpen(true);
  };

  const onDeleteButtonClick = (id: string) => {
    setIsConfirmDeleteDialogOpen(true);
    setReminderId(id);
  };

  // create
  const createReminder = () => {
    let scheduledAt = null;
    if(type === "scheduled"){
      scheduledAt = buildDateTime(scheduledDate, scheduledTime);
      if(!scheduledDate || !scheduledTime){ 
        return toast.error('Please fill schedule date and time.');
      }
    } 
    
    createMutation(
      { title, message, type, status, sendToStudents, sendToParents, targetClassLevelIds, targetStudentIds, scheduledAt },
      {
        onSuccess: () => {
          toast.success("Reminder created successfully.");
          setIsReminderDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
            toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        }
      }
    );
  };

  // edit
  const editReminder = () => {
    let scheduledAt = null;
    if(type === "scheduled"){
      scheduledAt = buildDateTime(scheduledDate, scheduledTime);
      if(!scheduledDate || !scheduledTime){ 
        return toast.error('Please fill schedule date and time.');
      }
    }

    editMutation(
      { title, message, type, status, sendToStudents, sendToParents, targetClassLevelIds, targetStudentIds, scheduledAt },
      {
        onSuccess: () => {
          toast.success("Reminder updated successfully.");
          setIsReminderDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        }
      }
    );
  };

  // delete
  const deleteReminder = () => {
    deleteMutation(reminderId, {
      onSuccess: () => {
        toast.success("Reminder deleted successfully.");
        setIsConfirmDeleteDialogOpen(false);
        refetch();
      },
        onError: (error: unknown) => {
            toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        }
    });
  };

  return (
    <div>
      <SearchBar
        onSearch={(q) => setSearchQuery(q)}
        className="w-[366px] max-md:w-full"
      />

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-5">
          <h1 className="text-md font-semibold text-neutral-800">
            Message Reminders
          </h1>
          <CustomUnderlinedButton
            text="Add New"
            textColor="text-purple-500"
            onClick={onAddNewReminder}
            showIcon={false}
          />
        </div>

        <div className="flex flex-col gap-4 mb-12 max-w-xl">
          {allReminders?.length > 0 ? (
            allReminders.map((reminder: Reminder) => (
              <div
                key={reminder.id}
                className="bg-[#EAEAEAB3] px-6 pt-2 pb-6 rounded-sm"
              >
                <div className="flex justify-end gap-3">
                  <CustomUnderlinedButton
                    text="Edit"
                    textColor="text-gray-500"
                    onClick={() => onEditReminderClick(reminder)}
                    showIcon={false}
                  />
                  <CustomUnderlinedButton
                    text="Delete"
                    textColor="text-gray-500"
                    onClick={() => onDeleteButtonClick(reminder.id)}
                    showIcon={false}
                  />
                </div>
                <div className="grid gap-1 grid-cols-1">
                  <InputField
                    label="Message Title"
                    isTransulent={false}
                    value={reminder.title}
                    readOnly
                  />
                  <Textarea
                    label="Message"
                    autosize
                    minRows={5}
                    maxRows={8}
                    value={reminder.message}
                    readOnly
                  />
                </div>
              </div>
            ))
          ) : (
            <NoAvailableEmptyState message="No Message Reminders available, click ‘Add New’ to create one." />
          )}
        </div>
      </div>

      {/* Create/Edit Reminder Dialog */}
      <Dialog
        isOpen={isReminderDialogOpen}
        busy={pendingCreate || pendingEdit}
        dialogTitle={editMode ? "Edit Reminder" : "Create Reminder"}
        saveButtonText={editMode ? "Save Changes" : "Create Reminder"}
        onClose={() => setIsReminderDialogOpen(false)}
        onSave={editMode ? editReminder : createReminder}
      >
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            placeholder=""
            label="Reminder Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            isTransulent={false}
          />

          <Textarea
            label="Message"
            placeholder="Enter reminder message"
            autosize
            minRows={4}
            maxRows={8}
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
          />

          <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendToStudents}
                  onChange={(e) => setSendToStudents(e.target.checked)}
                />
                Send to Students
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendToParents}
                  onChange={(e) => setSendToParents(e.target.checked)}
                />
                Send to Parents
              </label>
          </div>

          {targetStudentIds?.length === 0 && <MultiSelect
              label="Send to students/parents in these classes"
              placeholder="Select classes"
              data={allClassLvlOptions}
              onChange={handleClassesSelect}
              searchable
              value={targetClassLevelIds}
          />}
          
          {targetClassLevelIds.length === 0 && <MultiSelect
            label="Students"
            placeholder="Select Students"
            data={allStudentOptions}
            onChange={handleStudentsSelect}
            searchable
            value={targetStudentIds}
          />}

          <Select
            label="Type"
            placeholder="Please Select"
            data={reminderTypeOptions}
            value={type}
            onChange={handleReminderTypeChange}
          />

          {type === "scheduled" && (
            <>
              <InputField
                type="date"
                label="Scheduled Date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <InputField
                type="time"
                label="Scheduled Time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </>
          )}

          {isShow &&
            <InputField
                className="!py-0"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                isTransulent={false}
            />
          }
          <div ref={scrollRef}></div>
        </div>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        isOpen={isConfirmDeleteDialogOpen}
        busy={pendingDelete}
        dialogTitle="Delete Reminder"
        saveButtonText="Delete"
        onClose={() => setIsConfirmDeleteDialogOpen(false)}
        onSave={deleteReminder}
      >
        <p>Are you sure you want to delete this reminder?</p>
      </Dialog>
    </div>
  );
};
