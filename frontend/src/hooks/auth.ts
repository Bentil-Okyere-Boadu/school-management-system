import { useMutation, useQuery } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { AuthCredentials } from "@/@types"

export const useLogin = (userDetails: AuthCredentials) => {
    return useMutation({ 
        mutationFn: (url: string) => {
            return customAPI.post(url, userDetails)
        }
    })
}

export const useAdminSignUp = () => {
    return useMutation({ 
        mutationFn: (signUpDetails: {firstName: string, lastName: string, email: string, password: string}) => {
            return customAPI.post(`/super-admin/auth/signup`, signUpDetails)
        }
    })
}

export const useRequestPasswordReset = (email: string) => {
    return useMutation({ 
        mutationFn: () => {
            return customAPI.post(`/super-admin/auth/forgot-password`, { email: email})
        }
    })
}

export const usePasswordReset = (payload: {token: string, password: string}) => {
    return useMutation({ 
        mutationFn: () => {
            return customAPI.post(`/super-admin/auth/reset-password`, { token: payload.token, password: payload.password})
        }
    })
}

export const useCompleteRegistration = (payload: {token: string, password: string}) => {
    return useMutation({ 
        mutationFn: () => {
            return customAPI.post(`/invitations/complete-registration`, { token: payload.token, password: payload.password})
        }
    })
}

export const useGetRoles = () => {
    const { data, isLoading, error, isSuccess } = useQuery({
        queryFn: () => {
            return customAPI.get('/roles')
        },
        queryKey: ['roles']
    })

    const roles = data?.data

    return { roles , isLoading, error, isSuccess }
}