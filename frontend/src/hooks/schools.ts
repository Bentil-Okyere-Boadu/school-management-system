import { useQuery } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"

export const useGetSchool = (id: string) => {
    const { data, isLoading } = useQuery({
        queryKey: ['school', id],
        queryFn: () => {
            return customAPI.get(`/schools/${id}`);
        },
        refetchOnWindowFocus: true
    })

    const school = data?.data

    return { school, isLoading }
}

export const useGetAllSchools = (page=1, search: string = "") => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSchools', { page, search }],
        queryFn: () => {
            const queryBuilder = [];
            if(search) {
                queryBuilder.push(`search=${search}`);
            }
            
            if(page) {
                queryBuilder.push(`page=${page}`);
            }
            
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";
            
            return customAPI.get(`/super-admin/admins/schools?${params}`);
        },
        refetchOnWindowFocus: true
    });

    const allSchools = data?.data;

    return { allSchools, isLoading, refetch }
}
