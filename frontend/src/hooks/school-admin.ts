import { useMutation, useQuery } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { User, Calendar, FeeStructure, Grade, SchoolAdminInfo, Term, ClassLevel, AdmissionPolicy } from "@/@types";

export const useGetMySchool = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['mySchool'],
        queryFn: () => {
            return customAPI.get('/school-admin/my-school');
        },
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

export const useGetSchoolUsers = (page=1,search: string = "", status: string = "", role: string = "", limit?: number ) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSchoolUsers', { page, search, status, role, limit }],
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
export const useGetClassLevels = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myClassLevels'],
        queryFn: () => {
            return customAPI.get('/class-level');
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
