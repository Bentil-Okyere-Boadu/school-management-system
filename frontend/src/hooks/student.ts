import { ClassLevel, Parent, Profile, Student } from "@/@types";
import { useMutation, useQuery } from "@tanstack/react-query";
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

export const useCreateGuardian = (studentId: string) => {
    return useMutation({
        mutationFn: (guardianDetails: Parent) => {
            return customAPI.post(`/student/${studentId}/parents`, guardianDetails);
        }
    });
}

export const useUpdateGuardian = (parentId: string) => {
    return useMutation({
        mutationFn: (guardianDetails: Partial<Parent>) => {
            return customAPI.patch(`/student/${parentId}/parents`, guardianDetails);
        }
    });
}
export const useDeleteGuardian = (parentId: string) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.delete(`/student/${parentId}/parents`);
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

  const studentCalendars = data?.data as ClassLevel[];

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