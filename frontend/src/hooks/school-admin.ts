import { useMutation, useQuery } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { FeeStructure } from "@/@types";

export const useGetMySchool = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['mySchool'],
        queryFn: () => {
            return customAPI.get('/school-admin/my-school');
        },
        refetchOnWindowFocus: true
    })

    const users = data?.data

    return { users, isLoading }
}

export const useGetSchoolUsers = (page=1,search: string = "", status: string = "", role: string = "" ) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSchoolUsers', { page, search, status, role }],
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
            
            return customAPI.get(`/school-admin/users?${params}`);
        },
        refetchOnWindowFocus: true
    });

    const adminUsers = data?.data?.data;
    const paginationValues = data?.data.meta;
    return { adminUsers, isLoading, paginationValues, refetch }
}

export const useGetFeeStructure = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myFeeStructure'],
        queryFn: () => {
            return customAPI.get('/fee-structure/my-school');
        },
        refetchOnWindowFocus: true
    })

    const feesStructure = data?.data as FeeStructure[];

    return { feesStructure, isLoading, refetch }
}

 export const useCreateSchool = () => {
    return useMutation({ 
        mutationFn: (schoolDetails: {name: string, address: string, phone: string, email: string}) => {
            return customAPI.post(`/schools/create`, schoolDetails);
        }
    })
}

export const useInvitation = (role: string) => {
    return useMutation({
        mutationFn: (inviteDetails: {name:string, email: string}) => {
            return customAPI.post(`/invitations/${role}`, inviteDetails);
        }
    })
}

export const useSaveFeeStructure = () => {
    return useMutation({
        mutationFn: (feeStructure: FeeStructure) => {
            return customAPI.post('/fee-structure', feeStructure);
        }
    })
}
export const useEditFeeStructure = (id: string) => {
    return useMutation({
        mutationFn: (feeStructure) => {
            return customAPI.put(`/fee-structure/${id}`, feeStructure);
        }
    })
}

export const useDeleteFeeStructure = (id: string) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.delete(`/fee-structure/${id}`)
        }
    })
}