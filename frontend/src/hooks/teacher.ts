import { Calendar, ClassLevel, ClassSubjectInfo, Student, Teacher, User, PostGradesPayload, StudentResultsResponse, ApproveClassResultsPayload, TeacherSubject } from "@/@types";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { customAPI } from "../../config/setup";

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

export const useGetTeacherClasses = (search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherClasses', { search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";

            return customAPI.get(`/teacher/my-classes?${params}`);
        },
        refetchOnWindowFocus: true
    })

    const classLevels = data?.data as ClassLevel[] || [] ;

    return { classLevels, isLoading, refetch }
}

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


interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
}

interface PostAttendancePayload {
  date: string;
  records: AttendanceRecord[];
}

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

export const useGetTeacherTopics = (search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacherTopics', { search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";

            return customAPI.get(`/teacher/my-topics?${params}`);
        },
        refetchOnWindowFocus: true
    })

    const teacherTopics = data?.data || [] ;

    return { teacherTopics, isLoading, refetch }
}

export const useCreateTeacherTopic = () => {
    return useMutation({
        mutationFn: (payload: { name: string; description: string; subjectCatalogId: string }) =>
            customAPI.post('/teacher/topics', payload),
    });
};

export const useUpdateTeacherTopic = (topicId: string) => {
    return useMutation({
        mutationFn: (payload: { name: string; description: string; subjectCatalogId: string }) =>
            customAPI.patch(`/teacher/topics/${topicId}`, payload),
    });
};

export const useDeleteTeacherTopic = () => {
    return useMutation({
        mutationFn: (topicId: string) =>
            customAPI.delete(`/teacher/topics/${topicId}`),
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
        refetchOnWindowFocus: true
    })

    const teacherAssignments = data?.data || [] ;

    return { teacherAssignments, isLoading, refetch }
}

export const useCreateTeacherAssignment = () => {
    return useMutation({
        mutationFn: (payload: { 
            topicId: string; 
            classLevelId: string;
            title: string; 
            instructions: string; 
            dueDate: string; 
            maxScore: number;
            state: string;
        }) =>
            customAPI.post('/teacher/assignments', payload),
    });
};

export const useUpdateTeacherAssignment = (assignmentId: string) => {
    return useMutation({
        mutationFn: (payload: { 
            title: string; 
            instructions: string; 
            dueDate?: string; 
            maxScore?: number;
            state?: string;
        }) =>
            customAPI.patch(`/teacher/assignments/${assignmentId}`, payload),
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


export const usePostStudentGrades = () => {
  return useMutation({
    mutationFn: (payload: PostGradesPayload) =>
      customAPI.post(`/subject/submit-grades`, payload),
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
  return useMutation({
    mutationFn: (payload: ApproveClassResultsPayload) =>
      customAPI.post(`/subject/toggle-class-results-approval`, payload),
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