import { ClassLevel, User } from "@/@types";
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

    const me = data?.data as User;

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
            console.log(params);

            return customAPI.get(`/teacher/my-classes`);
        },
        refetchOnWindowFocus: true
    })

    const classLevels = data?.data as ClassLevel[] || [] ;

    return { classLevels, isLoading, refetch }
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
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['classAttendance', { classLevelId, filterType, month, year, week }],
    queryFn: () => {
      const queryBuilder = [];

      console.log(filterType, month, year);

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

