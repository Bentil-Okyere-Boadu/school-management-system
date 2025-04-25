import { useMutation } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { AuthCredentials, SignUpPayload } from "@/@types"

export const useLogin = (userDetails: AuthCredentials) => {
    return useMutation({ 
        mutationFn: () => {
            return customAPI.post(`/auth/login`, userDetails)
        }
    })
}

export const useSignUp = (signUpDetails: SignUpPayload) => {
    return useMutation({ 
        mutationFn: () => {
            return customAPI.post(`/users`, signUpDetails)
        }
    })
}

export const useRequestPasswordReset = (email: string) => {
    return useMutation({ 
        mutationFn: () => {
            return customAPI.post(`/auth/forgot-password`, { email: email})
        }
    })
}

export const usePasswordReset = (payload: {token: string, password: string}) => {
    return useMutation({ 
        mutationFn: () => {
            return customAPI.post(`/auth/reset-password`, { token: payload.token, password: payload.password})
        }
    })
}