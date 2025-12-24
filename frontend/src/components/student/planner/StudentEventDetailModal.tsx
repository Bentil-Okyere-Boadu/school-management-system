"use client";
import React from "react";
import { Dialog } from "@/components/common/Dialog";
import { PlannerEvent } from "@/@types";
import { IconDownload, IconFile, IconMapPin, IconCalendar, IconTag } from "@tabler/icons-react";
import { Badge } from "@mantine/core";

interface StudentEventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PlannerEvent | null;
}

export const StudentEventDetailModal: React.FC<StudentEventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!event) return null;

  const formatDate = (dateString: string, isAllDay: boolean) => {
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return date.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getVisibilityScopeLabel = (scope: string) => {
    switch (scope) {
      case 'school_wide':
        return 'School Wide';
      case 'class_level':
        return 'Class Level';
      case 'subject':
        return 'Subject';
      case 'teachers':
        return 'Teachers Only';
      default:
        return scope.charAt(0).toUpperCase() + scope.slice(1).replace('_', ' ');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      dialogTitle={event.title}
      saveButtonText="Close"
      hideCancelButton={true}
      onClose={onClose}
      onSave={onClose}
      dialogWidth="w-[600px] max-w-[601px]"
    >
      <div className="my-3 flex flex-col gap-4 mt-6">
        {event.category && (
          <div className="flex items-center gap-2 flex-wrap">
            <IconTag size={16} className="text-gray-500" />
            <Badge
              style={{ backgroundColor: event.category.color || '#10b981' }}
              variant="filled"
            >
              {event.category.name}
            </Badge>
            <Badge variant="outline" color="gray">
              {getVisibilityScopeLabel(event.visibilityScope)}
            </Badge>
            {event.createdByAdminId && (
              <Badge variant="light" color="blue" size="sm">
                Created by Admin
              </Badge>
            )}
            {event.createdByTeacherId && event.createdByTeacher && (
              <Badge variant="light" color="green" size="sm">
                Created by Teacher ({event.createdByTeacher.firstName} {event.createdByTeacher.lastName})
              </Badge>
            )}
            {event.createdByTeacherId && !event.createdByTeacher && (
              <Badge variant="light" color="green" size="sm">
                Created by Teacher
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-start gap-2">
          <IconCalendar size={18} className="text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Date & Time</p>
            <p className="text-sm text-gray-900">
              {formatDate(event.startDate, event.isAllDay)}
              {!event.isAllDay && event.endDate && (
                <> - {formatTime(event.endDate)}</>
              )}
              {event.isAllDay && event.endDate && (
                <> to {formatDate(event.endDate, true)}</>
              )}
            </p>
            {event.isAllDay && (
              <p className="text-xs text-gray-500 mt-1">All-day event</p>
            )}
          </div>
        </div>

        {event.location && (
          <div className="flex items-start gap-2">
            <IconMapPin size={18} className="text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Location</p>
              <p className="text-sm text-gray-900">{event.location}</p>
            </div>
          </div>
        )}

        {event.description && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Description</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {event.targetClassLevels && event.targetClassLevels.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Target Classes</p>
            <div className="flex flex-wrap gap-2">
              {event.targetClassLevels.map((classLevel) => (
                <Badge key={classLevel.id} variant="light" color="blue">
                  {classLevel.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {event.targetSubjects && event.targetSubjects.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Target Subjects</p>
            <div className="flex flex-wrap gap-2">
              {event.targetSubjects.map((subject) => (
                <Badge key={subject.id} variant="light" color="green">
                  {subject.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {event.attachments && event.attachments.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-sm font-medium text-gray-700">Attachments</p>
            <div className="space-y-2">
              {event.attachments.map((attachment) => {
                const signedUrl = attachment.signedUrl;
                const fileSizeKB = attachment.fileSize ? `${(Number(attachment.fileSize) / 1024).toFixed(1)} KB` : '';
              
                return (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <IconFile size={20} className="text-blue-600" />
                      </div>
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
            </div>
          </div>
        )}

        {event.reminders && event.reminders.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-sm font-medium text-gray-700">Reminders</p>
            <div className="space-y-1">
              {event.reminders.map((reminder, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {formatDate(reminder.reminderTime, false)} - {reminder.notificationType}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Dialog>
  );
};

