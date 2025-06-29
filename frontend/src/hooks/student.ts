import { Parent, Student, User } from "@/@types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { customAPI } from "../../config/setup";

export const useStudentGetMe = () => {
    const { data, isPending, refetch} = useQuery({
        queryKey: ['studentMe'],
        queryFn: () => {
            return customAPI.get(`/student/me`)
        },
        refetchOnWindowFocus: true
    })

    const me = data?.data as User;

    return { me, isPending, refetch }
}

export const useUpdateStudentProfile = () => {
    return useMutation({
        mutationFn: (studentDetails: Student) => {
            return customAPI.put(`student/profile/me`, studentDetails);
        }
    })
}

export const useCreateGuardian = (studentId: string) => {
    return useMutation({
        mutationFn: (guardianDetails: Parent) => {
            return customAPI.post(`/student/${studentId}/parents`, guardianDetails);
        }
    });
}

export const useUpdateGuardian = (parentId: string) => {
    return useMutation({
        mutationFn: (guardianDetails: Partial<Parent>) => {
            return customAPI.patch(`/student/${parentId}/parents`, guardianDetails);
        }
    });
}
export const useDeleteGuardian = (parentId: string) => {
    return useMutation({
        mutationFn: () => {
            return customAPI.delete(`/student/${parentId}/parents`);
        }
    });
}
