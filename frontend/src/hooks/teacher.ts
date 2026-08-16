import { useEffect, useMemo, useState } from "react";
import { Calendar, ClassLevel, ClassSubjectInfo, Student, Teacher, User, PostGradesPayload, StudentPerformanceAnalytics, StudentResultsResponse, ApproveClassResultsPayload, TeacherSubject, PlannerEvent, EventCategory, CreatePlannerEventPayload, Subtopic, CurriculumTopicNote, CreateSubtopicPayload, UpdateSubtopicPayload, CreateCurriculumTopicNotePayload, TeacherCurriculumProgressDashboard, TeacherTopicPayload, PostAttendancePayload, ClassSubjectPerformanceResponse, StudentTopicPerformanceResponse, PerformanceCluster, TeacherAnalyticsSubjectsResponse, Notification } from "@/@types";
import { useMutation, useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { customAPI } from "../../config/setup";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";

export const useTeacherGetMe = () => {
    const { data, isPending, refetch} = useQuery({
        queryKey: ['teacherMe'],
        queryFn: () => {
            return customAPI.get(`/teacher/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as Teacher;

    return { me, isPending, refetch }
}

export const useGetTeacherClasses = (
  search: string = "",
  academicTermId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["teacherClasses", { search, academicTermId }],
    queryFn: () => {
      const queryBuilder: string[] = [];
      if (search) {
        queryBuilder.push(`search=${encodeURIComponent(search)}`);
      }
      if (academicTermId) {
        queryBuilder.push(
          `academicTermId=${encodeURIComponent(academicTermId)}`
        );
      }
      const qs = queryBuilder.length > 0 ? `?${queryBuilder.join("&")}` : "";

      return customAPI.get(`/teacher/my-classes${qs}`);
    },
    refetchOnWindowFocus: true,
  });

  const classLevels = (data?.data as ClassLevel[]) || [];

  return { classLevels, isLoading, refetch };
};

export const useGetTeacherSubjectClasses = (search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherSubjectClasses', { search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";

            return customAPI.get(`/subject/my-classes?${params}`);
        },
        refetchOnWindowFocus: true
    })

    const classSubjects = data?.data as ClassSubjectInfo[] || [] ;

    return { classSubjects, isLoading, refetch }
}


export const useGetTeacherClassById = (
  id: string,
  options?: UseQueryOptions
) => {
  const { data, isPending, refetch } = useQuery({
    queryKey: ['teacherClass', id],
    queryFn: () => customAPI.get(`/teacher/classes/${id}/name`),
    enabled: options?.enabled ?? Boolean(id),
    refetchOnWindowFocus: true,
    ...options,
  });

  const classData = (data as { data: ClassLevel })?.data;

  return { classData, isPending, refetch };
};

export const useGetTeacherClassDetail = (id: string) => {
  const { data, isPending, refetch } = useQuery({
    queryKey: ["teacherClassDetail", id],
    queryFn: () => customAPI.get(`/teacher/classes/${id}`),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
  });

  const classDetail = (data as { data: ClassLevel })?.data;

  return { classDetail, isPending, refetch };
};



export const useGetClassAttendance = (
  classLevelId: string,
  filterType: string = "month",
  month?: string,
  year?: string,
  week?: string,
  summaryOnly?: boolean,
  startDate?: string,
  endDate?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['classAttendance', { classLevelId, filterType, month, year, week, summaryOnly, startDate, endDate }],
    queryFn: () => {
      const queryBuilder = [];

      if (filterType) {
        queryBuilder.push(`filterType=${filterType}`);
      }

      if (month) {
        queryBuilder.push(`month=${month}`);
      }

      if (year) {
        queryBuilder.push(`year=${year}`);
      }

      if (week) {
        queryBuilder.push(`weekOfMonth=${week}`);
      }

      if(summaryOnly) {
        queryBuilder.push(`summaryOnly=${summaryOnly}`);
      }
      
      if(startDate) {
        queryBuilder.push(`startDate=${startDate}`);
      }
      
      if(endDate) {
        queryBuilder.push(`endDate=${endDate}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";
      return customAPI.get(`/teacher/classes/${classLevelId}/attendance?${params}`);
    },
    enabled: !!classLevelId, // only run if classLevelId is provided
    refetchOnWindowFocus: true,
  });

  const attendanceData = data?.data;

  return { attendanceData, isLoading, refetch };
};


export const usePostClassAttendance = (classLevelId: string) => {
  return useMutation({
    mutationFn: (payload: PostAttendancePayload) =>
      customAPI.post(`/teacher/classes/${classLevelId}/attendance`, payload),
  });
};

export const useTeacherAttendanceSummary = (classLevelId: string, startDate?: string, endDate?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['summary', classLevelId, startDate, endDate],
    queryFn: () => {
      const queryBuilder = [];
      if(startDate) {
        queryBuilder.push(`startDate=${startDate}`);
      }
      
      if(endDate) {
        queryBuilder.push(`endDate=${endDate}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";
      return customAPI.get(`teacher/${classLevelId}/summary?${params}`);
    }
  })

  const classSummary = data?.data;
  return {classSummary, isLoading}
}

export const useGetStudents = (page=1,search: string = "", status: string = "", role: string = "", roleLabel?: string,  limit?: number ) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['allStudents', { page, search, status, role, roleLabel, limit }],
    queryFn: () => {
      const queryBuilder = [];
      if(search) {
          queryBuilder.push(`search=${search}`);
      }

      if(status) {
          queryBuilder.push(`status=${status}`);
      }
      
      if(role) {
          queryBuilder.push(`role=${role}`);
      }
      
      if(page) {
          queryBuilder.push(`page=${page}`);
      }
      
      if(roleLabel) {
          queryBuilder.push(`roleLabel=${roleLabel}`);
      }

      if(limit) {
          queryBuilder.push(`limit=${limit}`);
      }
      
      const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";
      
      return customAPI.get(`/teacher/students?${params}`);
    },
    refetchOnWindowFocus: true
});

  const studentsData = data?.data?.data;
  const paginationValues = data?.data.meta;
  return { studentsData, isLoading, refetch, paginationValues }
}

export const useGetStudentById = (id: string, options?: UseQueryOptions) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['student', id],
        queryFn: () => {
            return customAPI.get(`/teacher/users/${id}`);
        },
        enabled: options?.enabled ?? Boolean(id),
        refetchOnWindowFocus: true,
         ...options,
    })

    const studentData = (data as {data: User | Student})?.data ;

    return { studentData, isLoading, refetch }
}

export const useEditTeacherInfo = () => {
  return useMutation({
    mutationFn: (teacherData: Partial<Teacher>) => {
      return customAPI.put('/teacher/profile/me', teacherData);
    }
  })
}

export const useUploadProfileImage = (id: string) => {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return customAPI.post(`/profiles/teacher/${id}/avatar`, formData, {
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
          return customAPI.delete(`/profiles/teacher/${id}/avatar`)
      }
  })
}

export const useAdminViewStudentAttendance = (
    classLevelId: string,
    studentId: string,
    calendarId: string
) => {
    const {data, isLoading, refetch} = useQuery({
        queryKey: ['adminStudentAttendance', studentId, calendarId, classLevelId],
        queryFn: () => {
            return customAPI.get(`teacher/classes/${classLevelId}/students/${studentId}/calendars/${calendarId}/attendance/grouped`);
        },
        enabled: !!calendarId,
        refetchOnWindowFocus: true
    })

    const studentAttendance = data?.data;
    return { studentAttendance, isLoading, refetch };
}

export const useGetCalendars = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['studentCalendars'],
    queryFn: () => {
      return customAPI.get(`/teacher/calendars`)
    }
  })

  const studentCalendars = data?.data as Calendar[] || [];

  return { studentCalendars, isLoading, refetch }
}

export const useTeacherAcademicTermSelection = () => {
  const { studentCalendars: calendars, isLoading: calendarsLoading } =
    useGetCalendars();
  const [academicTermId, setAcademicTermId] = useState("");

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars),
    [calendars],
  );

  useEffect(() => {
    if (sortedTerms.length === 0) return;
    setAcademicTermId((prev) => {
      if (prev && sortedTerms.some((t) => t.id === prev)) return prev;
      return sortedTerms[0].id;
    });
  }, [sortedTerms]);

  const latestTermId = sortedTerms[0]?.id;

  return {
    calendars,
    calendarsLoading,
    sortedTerms,
    academicTermId,
    setAcademicTermId,
    latestTermId,
  };
};

export const useGetSubjectClasses = (search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['subjectClasses', { search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";

            return customAPI.get(`/subject/my-classes?${params}`);
        },
        refetchOnWindowFocus: true
    })

    const classSubjects = data?.data as ClassSubjectInfo[] || [] ;

    return { classSubjects, isLoading, refetch }
}

export const useGetTeacherSubjects = (search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherSubjects', { search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";

            return customAPI.get(`/teacher/my-subject?${params}`);
        },
        refetchOnWindowFocus: true
    })

    const teacherSubjects = data?.data as TeacherSubject[] || [] ;

    return { teacherSubjects, isLoading, refetch }
}

export const useGetTeacherTopics = (
  search: string = "",
  academicTermId?: string,
) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherTopics', { search, academicTermId }],
        queryFn: () => {
            const queryBuilder: string[] = [];
            if (search) {
                queryBuilder.push(`search=${encodeURIComponent(search)}`);
            }
            if (academicTermId) {
                queryBuilder.push(
                    `academicTermId=${encodeURIComponent(academicTermId)}`,
                );
            }
            const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";

            return customAPI.get(`/teacher/my-topics?${params}`);
        },
        enabled: Boolean(academicTermId?.trim()),
        refetchOnWindowFocus: true
    })

    const teacherTopics = data?.data || [] ;

    return { teacherTopics, isLoading, refetch }
}

export type TeacherCurriculumProgressFilters = {
    academicTermId: string;
    subjectId?: string;
    classLevelId?: string;
};

export const useGetTeacherCurriculumProgress = (
    filters: TeacherCurriculumProgressFilters | null
) => {
    const { data, isLoading, refetch, error } = useQuery({
        queryKey: ["teacherCurriculumProgress", filters],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set("academicTermId", filters!.academicTermId);
            if (filters!.subjectId) params.set("subjectId", filters!.subjectId);
            if (filters!.classLevelId) {
                params.set("classLevelId", filters!.classLevelId);
            }
            return customAPI.get(
                `/teacher/curriculum/progress?${params.toString()}`
            );
        },
        enabled: Boolean(filters?.academicTermId),
        refetchOnWindowFocus: true,
        refetchOnMount: "always",
    });

    const dashboard = (data as { data?: TeacherCurriculumProgressDashboard })
        ?.data;

    return { dashboard, isLoading, refetch, error };
};

export const useCreateTeacherTopic = () => {
    return useMutation({
        mutationFn: (payload: TeacherTopicPayload) =>
            customAPI.post('/teacher/topics', payload),
    });
};

export const useUpdateTeacherTopic = (topicId: string) => {
    return useMutation({
        mutationFn: (payload: Partial<TeacherTopicPayload>) =>
            customAPI.patch(`/teacher/topics/${topicId}`, payload),
    });
};

export const useDeleteTeacherTopic = () => {
    return useMutation({
        mutationFn: (topicId: string) =>
            customAPI.delete(`/teacher/topics/${topicId}`),
    });
};

export const useGetSubtopicsForTopic = (topicId: string | undefined, enabled = true) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherSubtopics', topicId],
        queryFn: () => customAPI.get(`/teacher/topics/${topicId}/subtopics`),
        enabled: Boolean(topicId) && enabled,
        refetchOnWindowFocus: true,
    });
    const subtopics = (data?.data as Subtopic[]) ?? [];
    return { subtopics, isLoading, refetch };
};

export const useCreateTeacherSubtopic = () => {
    return useMutation({
        mutationFn: ({ topicId, payload }: { topicId: string; payload: CreateSubtopicPayload }) =>
            customAPI.post(`/teacher/topics/${topicId}/subtopics`, {
                name: payload.name,
                description: payload.description,
            }),
    });
};

export const useUpdateTeacherSubtopic = () => {
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSubtopicPayload }) =>
            customAPI.patch(`/teacher/subtopics/${id}`, payload),
    });
};

export const useDeleteTeacherSubtopic = () => {
    return useMutation({
        mutationFn: (id: string) => customAPI.delete(`/teacher/subtopics/${id}`),
    });
};

export const useMarkSubtopicComplete = () => {
    return useMutation({
        mutationFn: ({
            subtopicId,
            subjectId,
            classLevelId,
            academicTermId,
        }: {
            subtopicId: string;
            subjectId: string;
            classLevelId: string;
            academicTermId?: string;
        }) =>
            customAPI.post(`/teacher/subtopics/${subtopicId}/complete`, {
                subjectId,
                classLevelId,
                ...(academicTermId ? { academicTermId } : {}),
            }),
    });
};

export const useUnmarkSubtopicComplete = () => {
    return useMutation({
        mutationFn: ({
            subtopicId,
            subjectId,
            classLevelId,
            academicTermId,
        }: {
            subtopicId: string;
            subjectId: string;
            classLevelId: string;
            academicTermId?: string;
        }) => {
            const params = new URLSearchParams({ subjectId, classLevelId });
            if (academicTermId) params.set('academicTermId', academicTermId);
            return customAPI.delete(
                `/teacher/subtopics/${subtopicId}/complete?${params.toString()}`,
            );
        },
    });
};

export const useGetTeacherTopicNotes = (
    topicId: string | undefined,
    options?: { subjectId?: string; academicTermId?: string; enabled?: boolean },
) => {
    const { subjectId, academicTermId, enabled = true } = options ?? {};
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherTopicNotes', topicId, subjectId, academicTermId],
        queryFn: () => {
            const params = new URLSearchParams();
            if (subjectId) params.set('subjectId', subjectId);
            if (academicTermId) params.set('academicTermId', academicTermId);
            const q = params.toString() ? `?${params.toString()}` : '';
            return customAPI.get(`/teacher/topics/${topicId}/notes${q}`);
        },
        enabled: Boolean(topicId) && enabled,
        refetchOnWindowFocus: true,
    });
    const notes = (data?.data as CurriculumTopicNote[]) ?? [];
    return { notes, isLoading, refetch };
};

export const useReplyToCurriculumNote = () => {
    return useMutation({
        mutationFn: (payload: CreateCurriculumTopicNotePayload) =>
            customAPI.post('/teacher/notes/reply', payload),
    });
};

export const useGetTeacherAssignments = (search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherAssignments', { search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";

            return customAPI.get(`/teacher/assignments?${params}`);
        },
        refetchOnWindowFocus: true,
        refetchOnMount: 'always'
    })

    const teacherAssignments = data?.data || [] ;

    return { teacherAssignments, isLoading, refetch }
}

export const useCreateTeacherAssignment = () => {
    return useMutation({
        mutationFn: (payload: FormData | { 
            topicId: string; 
            classLevelId: string;
            title: string; 
            instructions: string; 
            dueDate: string; 
            maxScore: number;
            state: string;
        }) => {
            const config = payload instanceof FormData ? {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            } : {};
            return customAPI.post('/teacher/assignments', payload, config);
        },
    });
};

export const useUpdateTeacherAssignment = (assignmentId: string) => {
    return useMutation({
        mutationFn: (payload: FormData | { 
            title: string; 
            instructions: string; 
            dueDate?: string; 
            maxScore?: number;
            state?: string;
        }) => {
            const config = payload instanceof FormData ? {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            } : {};
            return customAPI.patch(`/teacher/assignments/${assignmentId}`, payload, config);
        },
    });
};

export const useDeleteTeacherAssignment = () => {
    return useMutation({
        mutationFn: (assignmentId: string) =>
            customAPI.delete(`/teacher/assignments/${assignmentId}`),
    });
};

export const useGetStudentsForGrading = (
  classLevelId?: string,
  subjectId?: string,
  academicCalendarId?: string,
  academicTermId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "studentsForGrading",
      { classLevelId, subjectId, academicCalendarId, academicTermId }
    ],
    queryFn: () => {
      const queryParams = [];

      if (classLevelId) queryParams.push(`classLevelId=${classLevelId}`);
      if (subjectId) queryParams.push(`subjectId=${subjectId}`);
      if (academicCalendarId) queryParams.push(`academicCalendarId=${academicCalendarId}`);
      if (academicTermId) queryParams.push(`academicTermId=${academicTermId}`);

      const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";

      return customAPI.get(`/subject/students-for-grading${queryString}`);
    },
    enabled: !!classLevelId && !!subjectId && !!academicCalendarId && !!academicTermId,
    refetchOnWindowFocus: true,
  });

  const studentsForGrading = data?.data;

  return { studentsForGrading, isLoading, refetch };
};

export type TeacherClassResultsApprovalStatus = {
  isApproved: boolean;
  approvedAt?: string | null;
  schoolAdminApproved: boolean;
  schoolAdminApprovedAt?: string | null;
  term: string;
  termId: string;
};

export const useGetTeacherClassResultsApprovalStatus = (
  classLevelId: string | undefined,
  academicTermId: string | undefined
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["teacherClassApprovalStatus", classLevelId, academicTermId],
    queryFn: () => {
      const q = academicTermId
        ? `?academicTermId=${encodeURIComponent(academicTermId)}`
        : "";
      return customAPI.get(
        `/subject/class-results-approval-status/${classLevelId}${q}`
      );
    },
    enabled: Boolean(classLevelId && academicTermId),
    refetchOnWindowFocus: true,
  });

  const status = data?.data as TeacherClassResultsApprovalStatus | undefined;

  return { status, isLoading, refetch };
};

export const usePostStudentGrades = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostGradesPayload) =>
      customAPI.post(`/subject/submit-grades`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentsForGrading"] });
      queryClient.invalidateQueries({
        queryKey: ["teacherClassApprovalStatus"],
      });
    },
  });
};

export const useGetStudentTermResults = (
  studentId: string,
  academicCalendarId: string,
  academicTermId: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['studentTermResults', studentId, academicCalendarId, academicTermId],
    queryFn: () => {
      return customAPI.get(
        `/subject/students/term-results/${studentId}`,
        {
          params: {
            academicCalendarId,
            academicTermId,
          },
        }
      );
    },
    enabled: options?.enabled ?? Boolean(studentId && academicCalendarId && academicTermId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const resultsData = (data as { data: StudentResultsResponse })?.data || {};

  return { resultsData, isLoading, refetch };
};

export const useTeacherStudentPerformanceAnalytics = (
  studentId: string,
  academicTermId: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "studentPerformanceAnalytics",
      "teacher",
      studentId,
      academicTermId,
    ],
    queryFn: () =>
      customAPI.get(`/teacher/students/${studentId}/performance-analytics`, {
        params: { academicTermId },
      }),
    enabled:
      options?.enabled ?? Boolean(studentId && academicTermId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const analytics =
    (data as { data: StudentPerformanceAnalytics })?.data ?? null;

  return { analytics, isLoading, refetch };
};

const EMPTY_ANALYTICS_SUBJECTS: TeacherAnalyticsSubjectsResponse["subjects"] =
  [];

export const useGetTeacherAnalyticsSubjects = (
  classLevelId: string,
  options?: { enabled?: boolean }
) => {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["teacherAnalyticsSubjects", classLevelId],
    queryFn: () =>
      customAPI.get(`/teacher/classes/${classLevelId}/analytics-subjects`),
    enabled: (options?.enabled ?? true) && Boolean(classLevelId),
    refetchOnWindowFocus: true,
  });

  const analyticsSubjects =
    (data?.data as TeacherAnalyticsSubjectsResponse) ?? null;
  const subjects = analyticsSubjects?.subjects ?? EMPTY_ANALYTICS_SUBJECTS;

  return {
    analyticsSubjects,
    subjects,
    isClassTeacher: analyticsSubjects?.isClassTeacher ?? false,
    isLoading,
    isFetching,
    refetch,
  };
};

export type TeacherClassSubjectPerformanceFilters = {
  classLevelId: string;
  academicTermId: string;
  subjectCatalogId: string;
  cluster?: PerformanceCluster;
  scoreRangeMin?: number;
  scoreRangeMax?: number;
  aggregatedAsOf?: string;
};

export const useGetTeacherClassSubjectPerformance = (
  filters: TeacherClassSubjectPerformanceFilters,
  options?: { enabled?: boolean }
) => {
  const {
    classLevelId,
    academicTermId,
    subjectCatalogId,
    cluster,
    scoreRangeMin,
    scoreRangeMax,
    aggregatedAsOf,
  } = filters;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["teacherClassSubjectPerformance", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("academicTermId", academicTermId);
      params.set("subjectCatalogId", subjectCatalogId);
      if (cluster) params.set("cluster", cluster);
      if (scoreRangeMin !== undefined)
        params.set("scoreRangeMin", String(scoreRangeMin));
      if (scoreRangeMax !== undefined)
        params.set("scoreRangeMax", String(scoreRangeMax));
      if (aggregatedAsOf) params.set("aggregatedAsOf", aggregatedAsOf);

      return customAPI.get(
        `/teacher/classes/${classLevelId}/subject-performance?${params.toString()}`
      );
    },
    enabled:
      (options?.enabled ?? true) &&
      Boolean(classLevelId && academicTermId && subjectCatalogId),
    refetchOnWindowFocus: true,
  });

  const performance =
    (data?.data as ClassSubjectPerformanceResponse) ?? null;

  return { performance, isLoading, isFetching, refetch };
};

export const useGetTeacherStudentTopicPerformance = (
  studentId: string,
  academicTermId: string,
  subjectCatalogId: string,
  options?: { enabled?: boolean }
) => {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "teacherStudentTopicPerformance",
      studentId,
      academicTermId,
      subjectCatalogId,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("academicTermId", academicTermId);
      params.set("subjectCatalogId", subjectCatalogId);
      return customAPI.get(
        `/teacher/students/${studentId}/topic-performance?${params.toString()}`
      );
    },
    enabled:
      (options?.enabled ?? true) &&
      Boolean(studentId && academicTermId && subjectCatalogId),
    refetchOnWindowFocus: true,
  });

  const topicPerformance =
    (data?.data as StudentTopicPerformanceResponse) ?? null;

  return { topicPerformance, isLoading, isFetching, refetch };
};


export const useSubmitStudentTermRemarks = (studentId: string, termId: string) => {
  return useMutation({
    mutationFn: (remarks: string) => {
      return customAPI.post(`/subject/students/${studentId}/terms/${termId}/remarks`, {
        remarks,
      });
    },
  });
};

export const useApproveClassResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveClassResultsPayload) =>
      customAPI.post(`/subject/toggle-class-results-approval`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
      queryClient.invalidateQueries({
        queryKey: ["teacherClassApprovalStatus"],
      });
    },
  });
};

interface isClassTeacherData {
  isClassTeacher: boolean;
}

export const useIsClassTeacher = (
  classLevelId: string,
  options?: UseQueryOptions
) => {
  const { data, isPending, refetch } = useQuery({
    queryKey: ["isClassTeacher", classLevelId],
    queryFn: () =>
      customAPI.get(
        `/teacher/me/is-class-teacher?classLevelId=${classLevelId}`
      ),
    enabled: options?.enabled ?? Boolean(classLevelId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const isClassTeacher = (data as { data: isClassTeacherData })?.data.isClassTeacher;

  return { isClassTeacher, isPending, refetch };
};

export const useGetAssignmentSubmittedStudents = (assignmentId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['assignmentSubmittedStudents', assignmentId],
    queryFn: () => {
      return customAPI.get(`/teacher/assignments/${assignmentId}/students?submitted`);
    },
    enabled: !!assignmentId,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const submittedStudents = data?.data || [];

  return { submittedStudents, isLoading, refetch };
};

export const useGetAssignmentPendingStudents = (assignmentId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['assignmentPendingStudents', assignmentId],
    queryFn: () => {
      return customAPI.get(`/teacher/assignments/${assignmentId}/students?pending`);
    },
    enabled: !!assignmentId,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const pendingStudents = data?.data || [];

  return { pendingStudents, isLoading, refetch };
};

export const useGradeAssignmentSubmission = () => {
  return useMutation({
    mutationFn: ({ assignmentId, studentId, ...payload }: { 
      assignmentId: string;
      studentId: string;
      score: number; 
      feedback?: string;
    }) =>
      customAPI.patch(`/teacher/assignments/${assignmentId}/submissions/${studentId}/grade`, payload),
  });
};

export const useGetStudentSubmissionDetails = (assignmentId: string, studentId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['studentSubmission', assignmentId, studentId],
    queryFn: () => customAPI.get(`/teacher/assignments/${assignmentId}/submissions/${studentId}`),
    enabled: enabled && !!assignmentId && !!studentId,
  });
};

/**
 * TEACHER PLANNER EVENTS CRUD
 */
export const useGetTeacherPlannerEvents = (
  startDate?: string,
  endDate?: string,
  categoryId?: string,
  classLevelId?: string,
  subjectId?: string,
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "teacherPlannerEvents",
      {
        startDate,
        endDate,
        categoryId,
        classLevelId,
        subjectId,
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

      if (classLevelId) {
        queryBuilder.push(`classLevelId=${classLevelId}`);
      }

      if (subjectId) {
        queryBuilder.push(`subjectId=${subjectId}`);
      }

      const params =
        queryBuilder.length > 0 ? `?${queryBuilder.join("&")}` : "";

      return customAPI.get(`/planner/teacher/events${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const events = (data?.data as PlannerEvent[]) || [];

  return { events, isLoading, refetch };
};

export const useCreateTeacherPlannerEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePlannerEventPayload) => {
      const formData = new FormData();

      formData.append("title", payload.title);
      if (payload.description) {
        formData.append("description", payload.description);
      }
      formData.append("startDate", payload.startDate);
      if (payload.endDate) {
        formData.append("endDate", payload.endDate);
      }
      formData.append("isAllDay", String(payload.isAllDay ?? false));
      if (payload.location) {
        formData.append("location", payload.location);
      }
      formData.append("categoryId", payload.categoryId);
      formData.append("visibilityScope", payload.visibilityScope);

      if (
        payload.targetClassLevelIds &&
        payload.targetClassLevelIds.length > 0
      ) {
        payload.targetClassLevelIds.forEach((id) => {
          formData.append("targetClassLevelIds[]", id);
        });
      }

      if (payload.targetSubjectIds && payload.targetSubjectIds.length > 0) {
        payload.targetSubjectIds.forEach((id) => {
          formData.append("targetSubjectIds[]", id);
        });
      }

      if (payload.reminders && payload.reminders.length > 0) {
        payload.reminders.forEach((reminder, index) => {
          formData.append(
            `reminders[${index}][reminderTime]`,
            reminder.reminderTime
          );
          if (reminder.notificationType) {
            formData.append(
              `reminders[${index}][notificationType]`,
              reminder.notificationType
            );
          }
        });
      }

      if (payload.files && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      if (payload.sendNotifications !== undefined) {
        formData.append("sendNotifications", String(payload.sendNotifications));
      }

      return customAPI.post("/planner/teacher/events", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherPlannerEvents"] });
    },
  });
};

export const useUpdateTeacherPlannerEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreatePlannerEventPayload>;
    }) => {
      const formData = new FormData();

      if (payload.title !== undefined) {
        formData.append("title", payload.title);
      }
      if (payload.description !== undefined) {
        formData.append("description", payload.description || "");
      }
      if (payload.startDate !== undefined) {
        formData.append("startDate", payload.startDate);
      }
      if (payload.endDate !== undefined) {
        formData.append("endDate", payload.endDate || "");
      }
      if (payload.isAllDay !== undefined) {
        formData.append("isAllDay", String(payload.isAllDay));
      }
      if (payload.location !== undefined) {
        formData.append("location", payload.location || "");
      }
      if (payload.categoryId !== undefined) {
        formData.append("categoryId", payload.categoryId);
      }
      if (payload.visibilityScope !== undefined) {
        formData.append("visibilityScope", payload.visibilityScope);
      }

      if (payload.targetClassLevelIds !== undefined) {
        if (payload.targetClassLevelIds.length > 0) {
          payload.targetClassLevelIds.forEach((id) => {
            formData.append("targetClassLevelIds[]", id);
          });
        }
      }

      if (payload.targetSubjectIds !== undefined) {
        if (payload.targetSubjectIds.length > 0) {
          payload.targetSubjectIds.forEach((id) => {
            formData.append("targetSubjectIds[]", id);
          });
        }
      }

      if (payload.reminders !== undefined) {
        payload.reminders.forEach((reminder, index) => {
          formData.append(
            `reminders[${index}][reminderTime]`,
            reminder.reminderTime
          );
          if (reminder.notificationType) {
            formData.append(
              `reminders[${index}][notificationType]`,
              reminder.notificationType
            );
          }
        });
      }

      if (payload.files !== undefined && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      if (payload.sendNotifications !== undefined) {
        formData.append("sendNotifications", String(payload.sendNotifications));
      }

      return customAPI.put(`/planner/teacher/events/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherPlannerEvents"] });
    },
  });
};

export const useDeleteTeacherPlannerEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/planner/teacher/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherPlannerEvents"] });
    },
  });
};

/**
 * TEACHER EVENT CATEGORIES (Read-only)
 */
export const useGetTeacherEventCategories = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["teacherEventCategories"],
    queryFn: () => {
      return customAPI.get("/planner/teacher/categories");
    },
    refetchOnWindowFocus: true,
  });

  const categories = (data?.data as EventCategory[]) || [];

  return { categories, isLoading, refetch };
};

export const useGetMyNotifications = (
  userId?: string,
  search?: string,
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", "teacher", userId, search],
    queryFn: () => {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
      return customAPI.get(`/teacher/notifications${queryParams}`);
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
      return customAPI.patch(`/teacher/notifications/${id}/markAsRead`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "teacher"] });
    },
  });
};

export const useMarkAllMyNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return customAPI.patch(`/teacher/notifications/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "teacher"] });
    },
  });
};

export const useDeleteMyNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/teacher/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "teacher"] });
    },
  });
};