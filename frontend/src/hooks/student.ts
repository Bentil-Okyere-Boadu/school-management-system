import { User } from "@/@types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { customAPI } from "../../config/setup";

export const useStudentGetMe = () => {
    const { data, isPending} = useQuery({
        queryKey: ['studentMe'],
        queryFn: () => {
            return customAPI.get(`/student/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as User;

    return { me, isPending }
}

export const useUpdateStudentProfile = () => {
    return useMutation({
        mutationFn: (studentDetails) => {
            return customAPI.put(`student/profile/me`, studentDetails);
        }
    })
}
