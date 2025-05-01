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
