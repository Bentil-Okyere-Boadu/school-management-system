import { useMutation } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { AuthCredentials } from "@/@types"

export const useLogin = (userDetails: AuthCredentials) => {
    return useMutation({} , () => {
        return customAPI.post(`/admin/login`, userDetails)
    })
}
