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

export const useGetAdminUsers = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allAdminUsers'],
        queryFn: () => {
            return customAPI.get('/super-admin/admins');
        },
        refetchOnWindowFocus: true
    });

    const adminUsers = data?.data;

    return { adminUsers, isLoading, refetch }
}

export const useArchiveUser = ({id, archiveState}: {id: string, archiveState: boolean}) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.put(`/super-admin/admin/${id}/archive`, {archive: archiveState})
        }
    })
}
