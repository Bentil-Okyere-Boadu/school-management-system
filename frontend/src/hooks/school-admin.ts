import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { User, Calendar, FeeStructure, Grade, SchoolAdminInfo, Term, ClassLevel, AdmissionPolicy, Student, StudentInformation, Guardian, AdditionalInformation, AdmissionData, AdmissionDashboardInfo, AdminDashboardStats, Subject, AssignSubjectTeacherPayload, StudentResultsResponse, Notification, Reminder } from "@/@types";

export const useGetMySchool = (enabled: boolean = true) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['mySchool'],
        queryFn: () => {
            return customAPI.get('/school-admin/my-school');
        },
        enabled,
        refetchOnWindowFocus: true
    })

    const school = data?.data

    return { school, isLoading, refetch }
}

export const useGetMe = () => {
    const { data, isPending} = useQuery({
        queryKey: ['schoolAdminMe'],
        queryFn: () => {
            return customAPI.get(`/school-admin/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as User;

    return { me, isPending }
}

export const useGetSchoolUsers = (page=1,search: string = "", status: string = "", role: string = "", roleLabel?: string,  limit?: number ) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSchoolUsers', { page, search, status, role, roleLabel, limit }],
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
            
            return customAPI.get(`/school-admin/users?${params}`);
        },
        refetchOnWindowFocus: true
    });

    const schoolUsers = data?.data?.data;
    const paginationValues = data?.data.meta;
    return { schoolUsers, isLoading, paginationValues, refetch }
}

export const useArchiveUser = ({id, archiveState}: {id: string, archiveState: boolean}) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.put(`/school-admin/users/${id}/archive`, {archive: archiveState})
        }
    })
}

export const useResendAdminInvitation = ({id, role}: {id: string, role: string}) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.post(`/invitations/${role}/resend/${id}`)
        }
    })
}


 export const useCreateSchool = () => {
    return useMutation({ 
        mutationFn: (schoolDetails: {name: string, address: string, phone: string, email: string}) => {
            return customAPI.post(`/schools/create`, schoolDetails);
        }
    })
}

export const useInvitation = (role: string) => {
    return useMutation({
        mutationFn: (inviteDetails: {firstName:string, lastName:string, email: string}) => {
            return customAPI.post(`/invitations/${role}`, inviteDetails);
        }
    })
}

export const useGetSchoolAdminInfo = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['schoolAdminInfo'],
        queryFn: () => {
            return customAPI.get('/school-admin/me');
        },
        refetchOnWindowFocus: true
    })

    const schoolAdminInfo = data?.data

    return { schoolAdminInfo, isLoading }
}

export const useEditSchoolAdminInfo = () => {
    return useMutation({
        mutationFn: (schoolAdminInfo: Partial<SchoolAdminInfo>) => {
            return customAPI.put('/school-admin/profile/me', schoolAdminInfo);
        }
    })
}

export const useUploadProfileImage = (id: string) => {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return customAPI.post(`/profiles/school-admin/${id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
};

export const useUploadSchoolLogoFile = () => {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return customAPI.post('/schools/logo', formData, {
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
            return customAPI.delete(`/profiles/school-admin/${id}/avatar`)
        }
    })
}

export const useDeleteSchoolLogo = () => {
    return useMutation({
        mutationFn: () => {
            return customAPI.delete('/schools/logo')
        }
    })
}

/**
 * FEE STRUCTURE CRUD
 * @returns 
 */

export const useGetFeeStructure = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myFeeStructure'],
        queryFn: () => {
            return customAPI.get('/fee-structure/my-school');
        },
        refetchOnWindowFocus: true
    })

    const feesStructure = data?.data as FeeStructure[] || [] ;

    return { feesStructure, isLoading, refetch }
}

export const useSaveFeeStructure = () => {
    return useMutation({
        mutationFn: (feeStructure: Partial<FeeStructure>) => {
            return customAPI.post('/fee-structure', feeStructure);
        }
    })
}
export const useEditFeeStructure = (id: string) => {
    return useMutation({
        mutationFn: (feeStructure: Partial<FeeStructure>) => {
            return customAPI.put(`/fee-structure/${id}`, feeStructure);
        }
    })
}

export const useDeleteFeeStructure = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/fee-structure/${id}`)
        }
    })
}


/**
 * GRADING SYSTEM CRUD
 */
export const useGetGradingSystem = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myGradingSystem'],
        queryFn: () => {
            return customAPI.get('/grading-system/my-school');
        },
        refetchOnWindowFocus: true
    })

    const grades = data?.data as Grade[] || [] ;

    return { grades, isLoading, refetch }
}

export const useCreateGrade = () => {
    return useMutation({
        mutationFn: (grade: Partial<Grade>) => {
            return customAPI.post('/grading-system', grade);
        }
    })
}

export const useDeleteGrade = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/grading-system/${id}`)
        }
    })
}

export const useEditGrade = (id: string) => {
    return useMutation({
        mutationFn: (grade: Partial<Grade>) => {
            return customAPI.put(`/grading-system/${id}`, grade);
        }
    })
}


/**
 * ACADEMIC CALENDAR CRUD
 * @returns 
 */
export const useGetCalendars = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['academicCalendars'],
        queryFn: () => {
            return customAPI.get('/academic-calendar');
        },
        refetchOnWindowFocus: true
    })

    const calendars = data?.data as Calendar[] || [] ;

    return { calendars, isLoading, refetch }
}

export const useCreateCalendar = () => {
    return useMutation({
        mutationFn: (calendar: Partial<Calendar>) => {
            return customAPI.post('/academic-calendar', calendar);
        }
    })
}

export const useDeleteCalendar = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/academic-calendar/${id}`)
        }
    })
}

export const useEditCalendar = (id: string) => {
    return useMutation({
        mutationFn: (calendar: Partial<Calendar>) => {
            return customAPI.put(`/academic-calendar/${id}`, calendar);
        }
    })
}


/**
 * CALENDAR TERMS CRUD
 * @returns 
 */
export const useGetTerms = (id: string) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['academicTerm'],
        queryFn: () => {
            return customAPI.get(`/academic-calendar/${id}/terms`);
        },
        refetchOnWindowFocus: true
    })

    const terms = data?.data as Term[] || [] ;

    return { terms, isLoading, refetch }
}

export const useCreateTerm = () => {
    return useMutation({
        mutationFn: (term: Partial<Term>) => {
            return customAPI.post('/academic-calendar/term', term);
        }
    })
}

export const useDeleteTerm = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/academic-calendar/term/${id}`)
        }
    })
}

export const useEditTerm = (id: string) => {
    return useMutation({
        mutationFn: (term: Partial<Term>) => {
            return customAPI.put(`/academic-calendar/term/${id}`, term);
        }
    })
}

/**
 * CLASS LEVELS CRUD
 */
export const useGetClassLevels = (search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myClassLevels', { search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";

            return customAPI.get(`/class-level?${params}`);
        },
        refetchOnWindowFocus: true
    })

    const classLevels = data?.data as ClassLevel[] || [] ;

    return { classLevels, isLoading, refetch }
}

export const useCreateClassLevel = () => {
    return useMutation({
        mutationFn: (classLevel: Partial<ClassLevel>) => {
            return customAPI.post('/class-level', classLevel);
        }
    })
}

export const useDeleteClassLevel = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/class-level/${id}`)
        }
    })
}

export const useEditClassLevel = (id: string) => {
    return useMutation({
        mutationFn: (classLevel: Partial<ClassLevel>) => {
            return customAPI.patch(`/class-level/${id}`, classLevel);
        }
    })
}

/**
 * ADMISSION POLICY CRUD
 */
export const useGetAdmissionPolicies = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myAdmissionPolicies'],
        queryFn: () => {
            return customAPI.get('/admission-policies');
        },
        refetchOnWindowFocus: true
    })

    const admissionPolicies = data?.data as AdmissionPolicy[] || [] ;

    return { admissionPolicies, isLoading, refetch }
}

export const useCreateAdmissionPolicy = () => {
  return useMutation({
    mutationFn: ({name, file}: {name: string, file: File}) => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('file', file);

      return customAPI.post('/admission-policies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
};

export const useDeleteAdmissionPolicy = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/admission-policies/${id}/document`)
        }
    })
}

// View student/teacher  
export const useGetSchoolUserById = (id: string, options?: UseQueryOptions) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['schoolUser', id],
        queryFn: () => {
            return customAPI.get(`/school-admin/users/${id}`);
        },
        enabled: options?.enabled ?? Boolean(id),
        refetchOnWindowFocus: true,
         ...options,
    })

    const schoolUser = (data as {data: User | Student})?.data ;

    return { schoolUser, isLoading, refetch }
}


/**
 * ADMISSION FORMS
 */
export const useSubmitAdmissionForm = () => {
  return useMutation({
    mutationFn: ({
      studentData,
      guardians,
      additionalInfo,
      schoolId,
    }: {
      studentData: StudentInformation;
      guardians: Guardian[];
      additionalInfo: AdditionalInformation;
      schoolId: string;
    }) => {
      const formData = new FormData();

      // Flat student data
      formData.append('schoolId', schoolId);
      formData.append('studentFirstName', studentData.firstName);
      formData.append('studentLastName', studentData.lastName);
      formData.append('studentOtherNames', studentData.otherNames);
      formData.append('studentEmail', studentData.email);
      formData.append('studentGender', studentData.gender)
      formData.append('studentDOB', studentData.dateOfBirth);
      formData.append('studentPlaceOfBirth', studentData.placeOfBirth)
      formData.append('studentNationality', studentData.nationality);
      formData.append('studentReligion', studentData.religion);
      formData.append('studentPhone', studentData.phone);
      formData.append('studentStreetAddress', studentData.streetAddress)
      formData.append('studentBoxAddress', studentData.boxAddress);
      formData.append('academicYear', studentData.academicYear);
      formData.append('forClassId', studentData.classFor);
      studentData.languagesSpoken.forEach(lang => {
        formData.append('studentLanguages[]', lang); // format for sending a array of strings
      });
      formData.append('homePrimaryLanguage', additionalInfo.primaryHomeLanguage);
      formData.append('homeOtherLanguage', additionalInfo.studentPrimaryLanguage);
      if (studentData.birthCertificateFile)
        formData.append('studentBirthCert', studentData.birthCertificateFile);
      if (studentData.headshotFile)
        formData.append('studentHeadshot', studentData.headshotFile);

      // Previous School
      if (additionalInfo.hasAcademicHistory === 'yes' && additionalInfo.previousSchool) {
        const ps = additionalInfo.previousSchool;
        formData.append('previousSchoolName', ps.name);
        formData.append('previousSchoolUrl', ps.url);
        formData.append('previousSchoolStreetAddress', ps.street);
        formData.append('previousSchoolCity', ps.city);
        formData.append('previousSchoolState', ps.state);
        formData.append('previousSchoolCountry', ps.country);
        formData.append('previousSchoolAttendedFrom', ps.attendedFrom);
        formData.append('previousSchoolAttendedTo', ps.attendedTo);
        formData.append('previousSchoolGradeClass', ps.grade);

        ps.reportCards?.forEach((file, index) => {
          formData.append(`previousSchoolResult${index}`, file);
        });
      }

      // Guardians
      guardians.forEach((guardian, index) => {
        formData.append(`guardians[${index}][firstName]`, guardian.firstName);
        formData.append(`guardians[${index}][lastName]`, guardian.lastName);
        formData.append(`guardians[${index}][email]`, guardian.email);
        formData.append(`guardians[${index}][relationship]`, guardian.relationship);
        formData.append(`guardians[${index}][guardianPhone]`, guardian.phone);
        formData.append(`guardians[${index}][guardianOtherPhone]`, guardian.optionalPhone);
        formData.append(`guardians[${index}][occupation]`, guardian.occupation);
        formData.append(`guardians[${index}][company]`, guardian.company);
        formData.append(`guardians[${index}][nationality]`, guardian.nationality);
        formData.append(`guardians[${index}][streetAddress]`, guardian.streetAddress);
        formData.append(`guardians[${index}][boxAddress]`, guardian.boxAddress);

        if (guardian.headshotFile) {
          formData.append(`guardianHeadshot${index}`, guardian.headshotFile);
        }
      });

      return customAPI.post('/admissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
};

export const useGetAdmissionClassLevels = (id: string) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admissionClassLevel'],
        queryFn: () => {
            return customAPI.get(`/admissions/class-levels/${id}`);
        },
        refetchOnWindowFocus: true
    })

    const classLevels = data?.data as ClassLevel[] || [] ;

    return { classLevels, isLoading, refetch }
}

export const useGetSchoolAdmissions = (page=1, search: string = "", status: string = "", role: string = "", roleLabel?: string,  limit?: number) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSchoolAdmissions', { page, search, status, role, roleLabel, limit }],
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
            
            return customAPI.get(`/school-admin/admissions?${params}`);
        },
        refetchOnWindowFocus: true
    });

    const admissionsList = data?.data?.data;
    const paginationValues = data?.data.meta;
    return { admissionsList, isLoading, paginationValues, refetch }
}

export const useGetAdmissionById = (id: string, options?: UseQueryOptions) => {

    const { data, isPending, refetch} = useQuery({
        queryKey: ['admission', id],
        queryFn: () => {
            return customAPI.get(`/school-admin/admissions/${id}`)
        },
        enabled: options?.enabled ?? Boolean(id),
        refetchOnWindowFocus: true,
        ...options,
    })

    const admissionData = (data as {data:  AdmissionData})?.data;
    return { admissionData, isPending, refetch }
}

export const useArchiveAdmission = (id: string) => {
    return useMutation({
        mutationFn: (archive: {archive: boolean}) => {
            return customAPI.put(`/school-admin/admissions/${id}/archive`, archive)
        }
    })
}

export const useEditAdmission = (id: string) => {
    return useMutation({
        mutationFn: (statusData: Partial<AdmissionData>) => {
            return customAPI.patch(`/school-admin/admissions/${id}/status`, statusData);
        }
    })
}

export const useInterviewInvitation = (id: string) => {
    return useMutation({
        mutationFn: (inviteDetails: {interviewDate:string, interviewTime:string}) => {
            return customAPI.post(`/school-admin/admissions/${id}/interview`, inviteDetails);
        }
    })
}

export const useGetAdmisssionDashboardInfo = () => {
    const { data, isPending} = useQuery({
        queryKey: ['admissionDashboard'],
        queryFn: () => {
            return customAPI.get('school-admin/admissions/analytics')
        },
        refetchOnWindowFocus: true
    })

    const dashboardStats = data?.data as AdmissionDashboardInfo;

    return { dashboardStats, isPending }
}

export const useGetAdminDashboardStats = () => {
    const { data, isPending} = useQuery({
        queryKey: ['adminDashboardStats'],
        queryFn: () => {
            return customAPI.get('school-admin/dashboard/stats')
        },
        refetchOnWindowFocus: true
    })

    const dashboardStats = data?.data as AdminDashboardStats;

    return { dashboardStats, isPending }
}

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
      return customAPI.get(`/school-admin/classes/${classLevelId}/attendance?${params}`);
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
      customAPI.post(`/school-admin/classes/${classLevelId}/attendance`, payload),
  });
};

export const useAdminViewStudentAttendance = (
    classLevelId: string,
    studentId: string,
    calendarId: string
) => {
    const {data, isLoading, refetch} = useQuery({
        queryKey: ['adminStudentAttendance', studentId, calendarId, classLevelId],
        queryFn: () => {
            return customAPI.get(`school-admin/classes/${classLevelId}/students/${studentId}/calendars/${calendarId}/attendance/grouped`);
        },
        enabled: !!calendarId,
        refetchOnWindowFocus: true
    })

    const studentAttendance = data?.data;
    return { studentAttendance, isLoading, refetch };
}

export const useGetAllSubjects = (enabled: boolean = true) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSubjects'],
        queryFn: () => {
            return customAPI.get('/subject-catalog');
        },
        enabled,
        refetchOnWindowFocus: true
    })

    const subjects: Subject[] = data?.data

    return { subjects, isLoading, refetch }
}

export const useGetSubjectById = (id: string) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSubjects', id],
        queryFn: () => {
            return customAPI.get(`/subject-catalog/${id}`);
        },
        enabled: id.length > 0,
        refetchOnWindowFocus: true
    })

    const subjects = data?.data

    return { subjects, isLoading, refetch }
}

export const useCreateSubject = () => {
    return useMutation({
        mutationFn: (subject: Subject) => {
            return customAPI.post(`/subject-catalog`, subject);
        }
    })
}

export const useUpdateSubject = () => {
    return useMutation({
        mutationFn: (subject: Subject) => {
            return customAPI.put(`/subject-catalog/${subject.id}`, subject);
        }
    })
}

export const useDeleteSubject = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/subject-catalog/${id}`);
        }
    })
}

export const useAssignSubjectTeacher = () => {
    return useMutation({
        mutationFn: (payload: AssignSubjectTeacherPayload) => {
            return customAPI.post(`/subject`, payload);
        }
    })
}

export const useUpdateSubjectTeacher = (id: string) => {
    return useMutation({
        mutationFn: (payload: AssignSubjectTeacherPayload) => {
            return customAPI.patch(`/subject/${id}`, payload);
        }
    })
}

export const useRemoveSubjectAssignment = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/subject/${id}`);
        }
    })
}

export const useGetStudentResults = (
  studentId: string,
  academicCalendarId: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['studentResults', studentId, academicCalendarId],
    queryFn: () => {
      return customAPI.get(`/subject/students/${studentId}/results/${academicCalendarId}`);
    },
    enabled: options?.enabled ?? Boolean(studentId && academicCalendarId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const resultsData = (data as {data: StudentResultsResponse})?.data || {};

  return { resultsData, isLoading, refetch };
};

export const useGetNotifications = (schoolId: string | null | undefined) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['notifications', schoolId],
        queryFn: () => {
            return customAPI.get(`/notifications/school/${schoolId}`);
        },
        enabled: !!schoolId,
        refetchOnWindowFocus: true
    })

    const notifications: Notification[] = data?.data || [];

    return { notifications, isLoading, refetch }
}


export const useMarkNotificationAsRead = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.patch(`/notifications/${id}/markAsRead`);
        }
    })
}

export const useCreateNotification = () => {
    return useMutation({
        mutationFn: (notification: Notification) => {
            return customAPI.post('/notifications', notification);
        }
    })
}

export const useGetReminders = (
  search: string = "",
  status: string = "",
  type: string = "",
  dateFrom?: string,
  dateTo?: string,
  page?: number | string,
//   limit?: number
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["allReminders", { search }],
    queryFn: () => {
      const queryBuilder: string[] = [];

      if (search) queryBuilder.push(`search=${search?.toLowerCase()}`);
      if (status) queryBuilder.push(`status=${status}`);
      if (type) queryBuilder.push(`type=${type}`);
      if (dateFrom) queryBuilder.push(`dateFrom=${dateFrom}`);
      if (dateTo) queryBuilder.push(`to=${dateTo}`);
      if (page) queryBuilder.push(`page=${page}`);
    //   if (limit) queryBuilder.push(`limit=${limit}`);

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";

      return customAPI.get(`/message-reminders?${params}`);
    },
    refetchOnWindowFocus: true,
  });

  console.log(data, "data here")

  const allReminders = data?.data || [];
//   const paginationValues = data?.data?.meta;

  return { allReminders, isLoading, refetch };
};

/**
 * REMINDERS CRUD
 */

export const useCreateReminder = () => {
  return useMutation({
    mutationFn: (reminder: Partial<Reminder>) => {
      return customAPI.post('/message-reminders', reminder);
    }
  });
};

export const useDeleteReminder = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/message-reminders/${id}`);
    }
  });
};

export const useEditReminder = (id: string) => {
  return useMutation({
    mutationFn: (reminder: Partial<Reminder>) => {
      return customAPI.patch(`/message-reminders/${id}`, reminder);
    }
  });
};
