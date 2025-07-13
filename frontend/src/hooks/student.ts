import { Parent, Student, User } from "@/@types";
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

    const me = data?.data as User;

    return { me, isPending, refetch }
}

export const useUpdateStudentProfile = () => {
    return useMutation({
        mutationFn: (studentDetails: Student) => {
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
  filterType: string = "month",
  month?: string,
  year?: string,
  week?: string,
  summaryOnly?: boolean
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['classAttendance', { classLevelId, filterType, month, year, week, summaryOnly }],
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
        queryBuilder.push(`week=${week}`);
      }

      if(summaryOnly) {
        queryBuilder.push(`summaryOnly=${summaryOnly}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";
      return customAPI.get(`/student/classes/${classLevelId}/attendance?${params}`);
    },
    enabled: !!classLevelId, // only run if classLevelId is provided
    refetchOnWindowFocus: true,
  });

  const attendanceData = data?.data;

  return { attendanceData, isLoading, refetch };
};
