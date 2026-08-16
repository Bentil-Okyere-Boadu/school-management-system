import {
  Calendar,
  Parent,
  Profile,
  Student,
  StudentPerformanceAnalytics,
  StudentResultsResponse,
  PlannerEvent,
  EventCategory,
  PaginatedSchoolPaymentsResponse,
  SchoolPaymentConfig,
  SchoolPaymentReceiptDetail,
  SchoolPaymentsListParams,
  Notification,
} from "@/@types";
import { useMutation, useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { customAPI } from "../../config/setup";

export const useStudentGetMe = () => {
    const { data, isPending, refetch} = useQuery({
        queryKey: ['studentMe'],
        queryFn: () => {
            return customAPI.get(`/student/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as Student;

    return { me, isPending, refetch }
}

export const useUpdateStudentProfile = () => {
    return useMutation({
        mutationFn: (studentDetails: Partial<Profile>) => {
            return customAPI.put(`student/profile/me`, studentDetails);
        }
    })
}

type GuardianMutationOptions = {
  studentId?: string;
  asAdmin?: boolean;
};

export const useCreateGuardian = (
  studentId: string,
  options?: GuardianMutationOptions,
) => {
    return useMutation({
        mutationFn: (guardianDetails: Parent) => {
            const path = options?.asAdmin
              ? `/school-admin/students/${studentId}/parents`
              : `/student/${studentId}/parents`;
            return customAPI.post(path, guardianDetails);
        }
    });
}

export const useUpdateGuardian = (
  parentId: string,
  options?: GuardianMutationOptions,
) => {
    return useMutation({
        mutationFn: (guardianDetails: Partial<Parent>) => {
            const path = options?.asAdmin
              ? `/school-admin/students/${options.studentId}/parents/${parentId}`
              : `/student/${parentId}/parents`;
            return customAPI.patch(path, guardianDetails);
        }
    });
}
export const useDeleteGuardian = (
  parentId: string,
  options?: GuardianMutationOptions,
) => {
    return useMutation({
        mutationFn: () => {
            const path = options?.asAdmin
              ? `/school-admin/students/${options.studentId}/parents/${parentId}`
              : `/student/${parentId}/parents`;
            return customAPI.delete(path);
        }
    });
}

export const useGetClassAttendance = (
  classLevelId: string,
  calendarId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['classAttendance', { classLevelId, calendarId }],
    queryFn: () => {
      return customAPI.get(`/student/classes/${classLevelId}/calendars/${calendarId}/attendance/grouped`);
    },
    enabled: !!calendarId, // only run if calendarId is provided
    refetchOnWindowFocus: true,
  });

  const studentAttendance = data?.data;

  return { studentAttendance, isLoading, refetch };
};

export const useGetCalendars = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['studentCalendars'],
    queryFn: () => {
      return customAPI.get(`/student/calendars`)
    }
  })

  const studentCalendars = data?.data as Calendar[] || [];

  return { studentCalendars, isLoading, refetch }
}

export const useUploadProfileImage = (id: string) => {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return customAPI.post(`/profiles/student/${id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
};

export const useDeleteProfileImage = () => {
  return useMutation({
      mutationFn: (id: string) => {
          return customAPI.delete(`/profiles/student/${id}/avatar`)
      }
  })
}


export const useGetMyResults = (
  academicCalendarId: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myStudentResults', academicCalendarId],
    queryFn: () => {
      return customAPI.get(`/subject/students/results/${academicCalendarId}`);
    },
    enabled: options?.enabled ?? Boolean(academicCalendarId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const resultsData = (data as { data: StudentResultsResponse })?.data || {};

  return { resultsData, isLoading, refetch };
};

export const useStudentPerformanceAnalytics = (
  academicTermId: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["studentPerformanceAnalytics", academicTermId],
    queryFn: () => {
      return customAPI.get(`/student/performance-analytics`, {
        params: { academicTermId },
      });
    },
    enabled: options?.enabled ?? Boolean(academicTermId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const analytics =
    (data as { data: StudentPerformanceAnalytics })?.data ?? null;

  return { analytics, isLoading, refetch };
};

export const useGetStudentAssignments = (status: 'pending' | 'submitted' | 'graded') => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['studentAssignments', status],
    queryFn: () => {
      return customAPI.get(`/student/assignments?${status}`);
    },
    refetchOnWindowFocus: true,
  });

  const assignments = data?.data || [];

  return { assignments, isLoading, refetch };
};

export const useSubmitAssignment = (assignmentId: string) => {
  return useMutation({
    mutationFn: (payload: { file: File; notes: string }) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('notes', payload.notes);

      return customAPI.post(`/student/assignments/${assignmentId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
};

/**
 * STUDENT PLANNER EVENTS (Read-Only)
 */
export const useGetStudentPlannerEvents = (
  startDate?: string,
  endDate?: string,
  categoryId?: string,
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "studentPlannerEvents",
      {
        startDate,
        endDate,
        categoryId,
      },
    ],
    queryFn: () => {
      const queryBuilder: string[] = [];

      if (startDate) {
        queryBuilder.push(`startDate=${startDate}`);
      }

      if (endDate) {
        queryBuilder.push(`endDate=${endDate}`);
      }

      if (categoryId) {
        queryBuilder.push(`categoryId=${categoryId}`);
      }

      const params =
        queryBuilder.length > 0 ? `?${queryBuilder.join("&")}` : "";

      return customAPI.get(`/planner/student/events${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const events = (data?.data as PlannerEvent[]) || [];

  return { events, isLoading, refetch };
};

export const useGetStudentPlannerEvent = (eventId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["studentPlannerEvent", eventId],
    queryFn: () => {
      return customAPI.get(`/planner/student/events/${eventId}`);
    },
    enabled: !!eventId,
    refetchOnWindowFocus: true,
  });

  const event = (data?.data as PlannerEvent) || null;

  return { event, isLoading, refetch };
};

/**
 * STUDENT EVENT CATEGORIES (Read-Only)
 */
export const useGetStudentEventCategories = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["studentEventCategories"],
    queryFn: () => {
      return customAPI.get("/planner/student/categories");
    },
    refetchOnWindowFocus: true,
  });

  const categories = (data?.data as EventCategory[]) || [];

  return { categories, isLoading, refetch };
};

export const useGetStudentPaymentConfig = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["studentPaymentConfig"],
    queryFn: () => customAPI.get("/payments/me/config"),
    refetchOnWindowFocus: true,
  });

  const config = data?.data as SchoolPaymentConfig | undefined;

  return { config, isLoading, refetch };
};

export const useGetMyPayments = (params: SchoolPaymentsListParams) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    studentId = "",
    feeStructureId = "",
    dateFrom = "",
    dateTo = "",
  } = params;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "myPayments",
      {
        page,
        limit,
        search,
        status,
        studentId,
        feeStructureId,
        dateFrom,
        dateTo,
      },
    ],
    queryFn: () => {
      const queryBuilder: string[] = [];
      queryBuilder.push(`page=${page}`);
      queryBuilder.push(`limit=${limit}`);
      if (search) queryBuilder.push(`search=${encodeURIComponent(search)}`);
      if (status) queryBuilder.push(`status=${encodeURIComponent(status)}`);
      if (studentId)
        queryBuilder.push(`studentId=${encodeURIComponent(studentId)}`);
      if (feeStructureId)
        queryBuilder.push(
          `feeStructureId=${encodeURIComponent(feeStructureId)}`
        );
      if (dateFrom)
        queryBuilder.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
      if (dateTo) queryBuilder.push(`dateTo=${encodeURIComponent(dateTo)}`);
      return customAPI.get(`/payments/me?${queryBuilder.join("&")}`);
    },
    refetchOnWindowFocus: true,
  });

  const body = data?.data as PaginatedSchoolPaymentsResponse | undefined;
  const transactions = body?.data ?? [];
  const meta = body?.meta;
  const summary = body?.summary;
  const filters = body?.filters;

  return { transactions, meta, summary, filters, isLoading, refetch };
};

export const useGetMyPaymentReceipt = (
  transactionId: string | null,
  enabled: boolean
) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["myPaymentReceipt", transactionId],
    queryFn: () =>
      customAPI.get(
        `/payments/me/${encodeURIComponent(transactionId as string)}/receipt`
      ),
    enabled: Boolean(transactionId) && enabled,
    refetchOnWindowFocus: false,
  });

  const receipt = data?.data as SchoolPaymentReceiptDetail | undefined;

  return { receipt, isLoading, isFetching, error, refetch };
};

export const useGetMyNotifications = (
  userId?: string,
  search?: string,
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", "student", userId, search],
    queryFn: () => {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
      return customAPI.get(`/student/notifications${queryParams}`);
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
    refetchInterval: 20000,
  });

  const notifications: Notification[] = data?.data || [];

  return { notifications, isLoading, refetch };
};

export const useMarkMyNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.patch(`/student/notifications/${id}/markAsRead`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "student"] });
    },
  });
};

export const useMarkAllMyNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return customAPI.patch(`/student/notifications/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "student"] });
    },
  });
};

export const useDeleteMyNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/student/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "student"] });
    },
  });
};
