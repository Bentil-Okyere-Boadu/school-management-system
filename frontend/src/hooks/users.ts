import { useMutation, useQuery } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"

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
        mutationFn: (inviteDetails: {name:string, email: string, roleId: string}) => {
            return customAPI.post(`/invitations/admin`, inviteDetails)
        }
    })
}

export const useGetAdminUsers = (page=1,search: string = "", status: string = "", role: string = "" ) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allAdminUsers', { page, search, status, role }],
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

export const useResendAdminInvitation = ({id}: {id: string}) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.post(`/invitations/admin/resend/${id}`)
        }
    })
}