import { useQuery } from "@tanstack/react-query";
import { customAPI } from "../../config/setup";
import { User } from "@/@types";

export const useGetMe = () => {
    const { data, isPending} = useQuery({
        queryKey: ['teacherMe'],
        queryFn: () => {
            return customAPI.get(`/teacher/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as User;

    return { me, isPending }
}