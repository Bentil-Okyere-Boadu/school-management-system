import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { School, SuperAdminDashStats, User } from "@/@types";

export const useGetUsers = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['allUsers'],
        queryFn: () => {
            return customAPI.get('/users');
        },
        refetchOnWindowFocus: true
    })

    const users = data?.data

    return { users, isLoading }
 }

 export const useGetUser = (id: string) => {
    const { data, isLoading } = useQuery({
        queryKey: ['user', id],
        queryFn: () => {
            return customAPI.get(`/users/${id}`);
        },
        refetchOnWindowFocus: true
    })

    const user = data?.data[0]

    return { user, isLoading }
 }

 export const useCreateUser = () => {
    return useMutation({ 
        mutationFn: (userDetails) => {
            return customAPI.post(`/users`, userDetails);
        }
    })
}

export const useInviteUser = () => {
    return useMutation({
        mutationFn: (inviteDetails: {firstName:string, lastName:string, email: string, roleId: string}) => {
            return customAPI.post(`/invitations/admin`, inviteDetails)
        }
    })
}

export const useGetAdminUsers = (page=1,search: string = "", status: string = "", role: string = "", limit?: number ) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allAdminUsers', { page, search, status, role, limit }],
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
            
            return customAPI.get(`/super-admin/admins?${params}`);
        },
        refetchOnWindowFocus: true
    });

    const adminUsers = data?.data?.data;
    const paginationValues = data?.data.meta;
    return { adminUsers, isLoading, paginationValues, refetch }
}

export const useArchiveUser = ({id, archiveState}: {id: string, archiveState: boolean}) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.put(`/super-admin/admin/${id}/archive`, {archive: archiveState})
        }
    })
}

export const useGetAllSchools = (page=1,search: string = "", status: string = "", role: string = "", limit?: number ) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSchools', { page, search, status, role, limit }],
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
            
            return customAPI.get(`/super-admin/admins/schools?${params}`);
        },
        refetchOnWindowFocus: true
    });

    const schools = data?.data as School[];
    const paginationValues = data?.data.meta;
    return { schools , isLoading, paginationValues, refetch }
}

export const useGetSchoolById = (id: string, options?: UseQueryOptions) => {
    const { data, isPending} = useQuery({
        queryKey: [id],
        queryFn: () => {
            return customAPI.get(`/schools/${id}`)
        },
        enabled: options?.enabled ?? Boolean(id),
        refetchOnWindowFocus: true,
        ...options,
    })

    const school = (data as {data: School})?.data;
    return { school, isPending }
}

export const useGetMe = () => {
    const { data, isPending} = useQuery({
        queryKey: ['superAdminMe'],
        queryFn: () => {
            return customAPI.get(`/super-admin/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as User;

    return { me, isPending }
}

export const useResendAdminInvitation = ({id}: {id: string}) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.post(`/invitations/admin/resend/${id}`)
        }
    })
}

export const useGetDashboardInfo = () => {
    const { data, isPending} = useQuery({
        queryKey: ['superAdminDasbhoard'],
        queryFn: () => {
            return customAPI.get('schools/dashboard')
        },
        refetchOnWindowFocus: true
    })

    const dashboardStats = data?.data as SuperAdminDashStats;

    return { dashboardStats, isPending }
}

/**
 * SCHOOLS PERFORMANCE
 */
export const useGetSchoolsPerformance = (
  scope: 'range' | 'overall' = "overall",
  from?: string,
  to?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["schoolsPerformance", { scope, from, to }],
    queryFn: () => {
        let query = `scope=${scope}`;

        if (from) query += `&from=${from}`;
        if (to) query += `&to=${to}`;

        return customAPI.get(`/super-admin/dashboard/schools-performance?${query}`);
    },
    refetchOnWindowFocus: false,
  });

  const schoolsPerformance = data?.data || [];

  return { schoolsPerformance, isLoading, refetch };
};
