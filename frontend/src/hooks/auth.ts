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
