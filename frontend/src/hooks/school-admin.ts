import { useMutation, useQuery } from "@tanstack/react-query"
import { customAPI } from "../../config/setup"
import { FeeStructure, Grade, SchoolAdminInfo } from "@/@types";
import { User } from "@/@types";

export const useGetMySchool = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['mySchool'],
        queryFn: () => {
            return customAPI.get('/school-admin/my-school');
        },
        refetchOnWindowFocus: true
    })

    const school = data?.data

    return { school, isLoading }
}

export const useGetMe = () => {
    const { data, isPending} = useQuery({
        queryKey: ['schoolAdminMe'],
        queryFn: () => {
            return customAPI.get(`/school-admin/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as User;

    return { me, isPending }
}

export const useGetSchoolUsers = (page=1,search: string = "", status: string = "", role: string = "", limit?: number ) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allSchoolUsers', { page, search, status, role, limit }],
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
            
            if(limit) {
                queryBuilder.push(`limit=${limit}`);
            }
            
            const params = queryBuilder.length > 0 ?  queryBuilder.join("&") : "";
            
            return customAPI.get(`/school-admin/users?${params}`);
        },
        refetchOnWindowFocus: true
    });

    const schoolUsers = data?.data?.data;
    const paginationValues = data?.data.meta;
    return { schoolUsers, isLoading, paginationValues, refetch }
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
        mutationFn: (inviteDetails: {firstName:string, lastName:string, email: string}) => {
            return customAPI.post(`/invitations/${role}`, inviteDetails);
        }
    })
}

/**
 * FEE STRUCTURE CRUD
 * @returns 
 */

export const useGetFeeStructure = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myFeeStructure'],
        queryFn: () => {
            return customAPI.get('/fee-structure/my-school');
        },
        refetchOnWindowFocus: true
    })

    const feesStructure = data?.data as FeeStructure[] || [] ;

    return { feesStructure, isLoading, refetch }
}

export const useSaveFeeStructure = () => {
    return useMutation({
        mutationFn: (feeStructure: Partial<FeeStructure>) => {
            return customAPI.post('/fee-structure', feeStructure);
        }
    })
}
export const useEditFeeStructure = (id: string) => {
    return useMutation({
        mutationFn: (feeStructure: Partial<FeeStructure>) => {
            return customAPI.put(`/fee-structure/${id}`, feeStructure);
        }
    })
}

export const useDeleteFeeStructure = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/fee-structure/${id}`)
        }
    })
}

export const useGetSchoolAdminInfo = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['schoolAdminInfo'],
        queryFn: () => {
            return customAPI.get('/school-admin/me');
        },
        refetchOnWindowFocus: true
    })

    const schoolAdminInfo = data?.data

    return { schoolAdminInfo, isLoading }
}

export const useEditSchoolAdminInfo = () => {
    return useMutation({
        mutationFn: (schoolAdminInfo: Partial<SchoolAdminInfo>) => {
            return customAPI.put('/school-admin/profile/me', schoolAdminInfo);
        }
    })
}

/**
 * GRADING SYSTEM CRUD
 */
export const useGetGradingSystem = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myGradingSystem'],
        queryFn: () => {
            return customAPI.get('/grading-system/my-school');
        },
        refetchOnWindowFocus: true
    })

    const grades = data?.data as Grade[] || [] ;

    return { grades, isLoading, refetch }
}

export const useCreateGrade = () => {
    return useMutation({
        mutationFn: (grade: Partial<Grade>) => {
            return customAPI.post('/grading-system', grade);
        }
    })
}

export const useDeleteGrade = () => {
    return useMutation({
        mutationFn: (id: string) => {
            return customAPI.delete(`/grading-system/${id}`)
        }
    })
}

export const useEditGrade = (id: string) => {
    return useMutation({
        mutationFn: (grade: Partial<Grade>) => {
            return customAPI.put(`/grading-system/${id}`, grade);
        }
    })
}