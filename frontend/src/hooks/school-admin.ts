import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { customAPI } from "../../config/setup";
import {
  User,
  Calendar,
  FeeStructure,
  Grade,
  GradingScheme,
  GradingSchemeStatus,
  CreateGradingSchemePayload,
  UpdateGradingSchemePayload,
  SchoolAdminInfo,
  Term,
  ClassLevel,
  AdmissionPolicy,
  Student,
  StudentInformation,
  Guardian,
  AdditionalInformation,
  AdmissionData,
  AdmissionDashboardInfo,
  AdminDashboardStats,
  Subject,
  AssignSubjectTeacherPayload,
  StudentPerformanceAnalytics,
  ClassSubjectPerformanceResponse,
  StudentTopicPerformanceResponse,
  PerformanceCluster,
  StudentResultsResponse,
  Notification,
  Reminder,
  School,
  ApproveClassResultsPayload,
  CurriculumItem,
  CurriculumPayload,
  CurriculumProgressDashboardData,
  CurriculumTopicDetailData,
  CurriculumTopicNote,
  CreateCurriculumTopicNotePayload,
  CreateSubtopicPayload,
  UpdateSubtopicPayload,
  Topic,
  TopicPayload,
  DuplicateTopicsToTermPayload,
  AdminAssignment,
  AssignmentSubmission,
  PlannerEvent,
  EventCategory,
  CreatePlannerEventPayload,
  CreateEventCategoryPayload,
  VisibilityScope,
  SchoolPaymentTransaction,
  PaginatedSchoolPaymentsResponse,
  SchoolPaymentReceiptDetail,
  SchoolPaymentsListParams,
  SchoolPaymentConfig,
  PostAttendancePayload,
  FinanceStudentsListParams,
  PaginatedFinanceStudentsResponse,
  FinanceStudentRow,
  FinanceClassesResponse,
  FinanceClassRow,
  FinanceStudentDetailResponse,
} from "@/@types";

export const useGetMySchool = (enabled: boolean = true) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mySchool"],
    queryFn: () => {
      return customAPI.get("/school-admin/my-school");
    },
    enabled,
    refetchOnWindowFocus: true,
  });

  const school = data?.data as School;

  return { school, isLoading, refetch };
};

export const useGetMe = () => {
  const { data, isPending } = useQuery({
    queryKey: ["schoolAdminMe"],
    queryFn: () => {
      return customAPI.get(`/school-admin/me`);
    },
    refetchOnWindowFocus: true,
  });

  const me = data?.data as User;

  return { me, isPending };
};

export const useGetSchoolUsers = (
  page = 1,
  search: string = "",
  status: string = "",
  role: string = "",
  roleLabel?: string,
  limit?: number
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "allSchoolUsers",
      { page, search, status, role, roleLabel, limit },
    ],
    queryFn: () => {
      const queryBuilder = [];
      if (search) {
        queryBuilder.push(`search=${search}`);
      }

      if (status) {
        queryBuilder.push(`status=${status}`);
      }

      if (role) {
        queryBuilder.push(`role=${role}`);
      }

      if (page) {
        queryBuilder.push(`page=${page}`);
      }

      if (roleLabel) {
        queryBuilder.push(`roleLabel=${roleLabel}`);
      }

      if (limit) {
        queryBuilder.push(`limit=${limit}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";

      return customAPI.get(`/school-admin/users?${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const schoolUsers = data?.data?.data;
  const paginationValues = data?.data.meta;
  return { schoolUsers, isLoading, paginationValues, refetch };
};

export const useGetStudentsForClassAssignment = (
  search: string = "",
  withoutClass?: boolean,
  excludeClassId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "studentsForClassAssignment",
      { search, withoutClass, excludeClassId },
    ],
    queryFn: () => {
      const queryBuilder = [];
      if (search) {
        queryBuilder.push(`search=${search}`);
      }

      if (withoutClass) {
        queryBuilder.push(`withoutClass=true`);
      }

      if (excludeClassId) {
        queryBuilder.push(`excludeClassId=${excludeClassId}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";

      return customAPI.get(
        `/school-admin/students/for-class-assignment?${params}`
      );
    },
    refetchOnWindowFocus: true,
  });

  const students = (data?.data as Student[]) || [];
  return { students, isLoading, refetch };
};

export const useArchiveUser = ({
  id,
  archiveState,
}: {
  id: string;
  archiveState: boolean;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return customAPI.put(`/school-admin/users/${id}/archive`, {
        archive: archiveState,
      });
    },
    onSuccess: () => {
      // Invalidate all user-related queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: [
          "allSchoolUsers", 
          "allStudents", 
          "schoolAdminInfo", 
          "adminDashboardStats", 
          "studentsForClassAssignment"
        ] 
      });
      queryClient.invalidateQueries({ queryKey: ["schoolUser", id] });
    },
  });
};

export const useGetTeacherAssignments = (teacherId: string) => {
  return useQuery({
    queryKey: ["teacherAssignments", teacherId],
    queryFn: () => {
      return customAPI.get(`/school-admin/teachers/${teacherId}/assignments`);
    },
    enabled: !!teacherId,
  });
};

export const useSuspendTeacher = ({
  id,
  suspendState,
}: {
  id: string;
  suspendState: boolean;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return customAPI.put(`/school-admin/teachers/${id}/suspend`, {
        suspend: suspendState,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [
        "allSchoolUsers",
        "schoolAdminInfo",
        "adminDashboardStats"
      ] });
      queryClient.invalidateQueries({ queryKey: ["schoolUser", id] });
    },
  });
};

/** Resends a PIN email for a pending tenant student or teacher. `id` is the tenant user id, not a platform_invitation id. */
export const useResendAdminInvitation = ({
  id,
  role,
}: {
  id: string;
  role: string;
}) => {
  return useMutation({
    mutationFn: () => {
      return customAPI.post(`/invitations/${role}/resend/${id}`);
    },
  });
};

export const useInvitation = (role: string) => {
  return useMutation({
    mutationFn: (inviteDetails: {
      firstName: string;
      lastName: string;
      email: string;
    }) => {
      return customAPI.post(`/invitations/${role}`, inviteDetails);
    },
  });
};

export const useGetSchoolAdminInfo = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["schoolAdminInfo"],
    queryFn: () => {
      return customAPI.get("/school-admin/me");
    },
    refetchOnWindowFocus: true,
  });

  const schoolAdminInfo = data?.data;

  return { schoolAdminInfo, isLoading };
};

export const useEditSchoolAdminInfo = () => {
  return useMutation({
    mutationFn: (schoolAdminInfo: Partial<SchoolAdminInfo>) => {
      return customAPI.put("/school-admin/profile/me", schoolAdminInfo);
    },
  });
};

export const useUploadProfileImage = (id: string) => {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return customAPI.post(`/profiles/school-admin/${id}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  });
};

export const useUploadSchoolLogoFile = () => {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return customAPI.post("/schools/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  });
};

export const useDeleteProfileImage = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/profiles/school-admin/${id}/avatar`);
    },
  });
};

export const useDeleteSchoolLogo = () => {
  return useMutation({
    mutationFn: () => {
      return customAPI.delete("/schools/logo");
    },
  });
};

/**
 * FEE STRUCTURE CRUD
 * @returns
 */

export const useGetFeeStructure = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["myFeeStructure"],
    queryFn: () => {
      return customAPI.get("/fee-structure/my-school");
    },
    refetchOnWindowFocus: true,
  });

  const feesStructure = (data?.data as FeeStructure[]) || [];

  return { feesStructure, isLoading, refetch };
};

export const useSaveFeeStructure = () => {
  return useMutation({
    mutationFn: (feeStructure: Partial<FeeStructure>) => {
      return customAPI.post("/fee-structure", feeStructure);
    },
  });
};
export const useEditFeeStructure = (id: string) => {
  return useMutation({
    mutationFn: (feeStructure: Partial<FeeStructure>) => {
      return customAPI.put(`/fee-structure/${id}`, feeStructure);
    },
  });
};

export const useDeleteFeeStructure = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/fee-structure/${id}`);
    },
  });
};

/**
 * GRADING SYSTEM CRUD
 */
export const useGetGradingSystem = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["myGradingSystem"],
    queryFn: () => {
      return customAPI.get("/grading-system/my-school");
    },
    refetchOnWindowFocus: true,
  });

  const grades = (data?.data as Grade[]) || [];

  return { grades, isLoading, refetch };
};

export const useCreateGrade = () => {
  return useMutation({
    mutationFn: (grade: Partial<Grade>) => {
      return customAPI.post("/grading-system", grade);
    },
  });
};

export const useDeleteGrade = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/grading-system/${id}`);
    },
  });
};

export const useEditGrade = (id: string) => {
  return useMutation({
    mutationFn: (grade: Partial<Grade>) => {
      return customAPI.put(`/grading-system/${id}`, grade);
    },
  });
};

/**
 * GRADING SCHEMES (named schemes with draft/activate lifecycle)
 */
export const useGetGradingSchemes = (status?: GradingSchemeStatus | "") => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gradingSchemes", { status: status || "" }],
    queryFn: () => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : "";
      return customAPI.get(`/grading-schemes${qs}`);
    },
    refetchOnWindowFocus: true,
  });

  const schemes = (data?.data as GradingScheme[]) || [];
  return { schemes, isLoading, refetch };
};

export const useGetGradingScheme = (id: string | null, enabled = true) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gradingScheme", id],
    queryFn: () => customAPI.get(`/grading-schemes/${id}`),
    enabled: Boolean(id) && enabled,
    refetchOnWindowFocus: false,
  });

  const scheme = (data?.data as GradingScheme) || null;
  return { scheme, isLoading, refetch };
};

export const useCreateGradingScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGradingSchemePayload) =>
      customAPI.post("/grading-schemes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      queryClient.invalidateQueries({ queryKey: ["myGradingSystem"] });
    },
  });
};

export const useUpdateGradingScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateGradingSchemePayload;
    }) => customAPI.patch(`/grading-schemes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      queryClient.invalidateQueries({ queryKey: ["gradingScheme"] });
      queryClient.invalidateQueries({ queryKey: ["myGradingSystem"] });
    },
  });
};

export const useDuplicateGradingScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customAPI.post(`/grading-schemes/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
    },
  });
};

export const useActivateGradingScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customAPI.post(`/grading-schemes/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      queryClient.invalidateQueries({ queryKey: ["gradingScheme"] });
      queryClient.invalidateQueries({ queryKey: ["myGradingSystem"] });
    },
  });
};

export const useDeactivateGradingScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customAPI.post(`/grading-schemes/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      queryClient.invalidateQueries({ queryKey: ["gradingScheme"] });
    },
  });
};

export const useDeleteGradingScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customAPI.delete(`/grading-schemes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      queryClient.invalidateQueries({ queryKey: ["gradingScheme"] });
    },
  });
};

export const useNewGradingSchemeVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customAPI.post(`/grading-schemes/${id}/new-version`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
    },
  });
};

/**
 * ACADEMIC CALENDAR CRUD
 * @returns
 */
export const useGetCalendars = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["academicCalendars"],
    queryFn: () => {
      return customAPI.get("/academic-calendar");
    },
    refetchOnWindowFocus: true,
  });

  const calendars = (data?.data as Calendar[]) || [];

  return { calendars, isLoading, refetch };
};

export const useCreateCalendar = () => {
  return useMutation({
    mutationFn: (calendar: Partial<Calendar>) => {
      return customAPI.post("/academic-calendar", calendar);
    },
  });
};

export const useDeleteCalendar = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/academic-calendar/${id}`);
    },
  });
};

export const useEditCalendar = (id: string) => {
  return useMutation({
    mutationFn: (calendar: Partial<Calendar>) => {
      return customAPI.put(`/academic-calendar/${id}`, calendar);
    },
  });
};

/**
 * CALENDAR TERMS CRUD
 * @returns
 */
export const useGetTerms = (id: string, enabled: boolean = true) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["academicTerm", id],
    queryFn: () => {
      return customAPI.get(`/academic-calendar/${id}/terms`);
    },
    enabled: Boolean(id) && enabled,
    refetchOnWindowFocus: true,
  });

  const terms = (data?.data as Term[]) || [];

  return { terms, isLoading, refetch };
};

export const useCreateTerm = () => {
  return useMutation({
    mutationFn: (term: Partial<Term>) => {
      return customAPI.post("/academic-calendar/term", term);
    },
  });
};

export const useDeleteTerm = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/academic-calendar/term/${id}`);
    },
  });
};

export const useEditTerm = (id: string) => {
  return useMutation({
    mutationFn: (term: Partial<Term>) => {
      return customAPI.put(`/academic-calendar/term/${id}`, term);
    },
  });
};

/**
 * CLASS LEVELS CRUD
 */
export const useGetClassLevels = (
  search: string = "",
  academicTermId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["myClassLevels", { search, academicTermId }],
    queryFn: () => {
      const queryBuilder: string[] = [];
      if (search) {
        queryBuilder.push(`search=${encodeURIComponent(search)}`);
      }
      if (academicTermId) {
        queryBuilder.push(
          `academicTermId=${encodeURIComponent(academicTermId)}`
        );
      }
      const qs = queryBuilder.length > 0 ? `?${queryBuilder.join("&")}` : "";

      return customAPI.get(`/class-level${qs}`);
    },
    refetchOnWindowFocus: true,
  });

  const classLevels = (data?.data as ClassLevel[]) || [];

  return { classLevels, isLoading, refetch };
};

export const useCreateClassLevel = () => {
  return useMutation({
    mutationFn: (classLevel: Partial<ClassLevel>) => {
      return customAPI.post("/class-level", classLevel);
    },
  });
};

export const useDeleteClassLevel = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/class-level/${id}`);
    },
  });
};

export const useEditClassLevel = (id: string) => {
  return useMutation({
    mutationFn: (classLevel: Partial<ClassLevel>) => {
      return customAPI.patch(`/class-level/${id}`, classLevel);
    },
  });
};

export const useGetClassLevelById = (
  classId: string,
  options?: { enabled?: boolean }
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["classLevel", classId],
    queryFn: () => customAPI.get(`/class-level/${classId}`),
    enabled: !!classId && (options?.enabled ?? true),
    refetchOnWindowFocus: true,
  });

  const classLevel = (data?.data as ClassLevel) ?? null;
  return { classLevel, isLoading, refetch };
};

/**
 * CURRICULUM CRUD
 */
export const useGetCurricula = (
  search: string = "",
  page: number = 1,
  limit: number = 100
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["curricula", { search, page, limit }],
    queryFn: () => {
      const queryBuilder = [];
      if (search) {
        queryBuilder.push(`search=${encodeURIComponent(search)}`);
      }
      queryBuilder.push(`page=${page}`);
      queryBuilder.push(`limit=${limit}`);
      const params = queryBuilder.join("&");

      return customAPI.get(`/curriculum?${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const resData = data?.data;

  const curricula = resData?.data ?? [];
  const total = resData?.total ?? 0;
  const resolvedLimit = resData?.limit ?? limit;
  const totalPages =
    total === 0 ? 1 : Math.max(1, Math.ceil(total / resolvedLimit));

  return {
    curricula,
    isLoading,
    refetch,
    paginationValues: {
      totalPages,
      total,
      page: resData?.page ?? page,
      limit: resolvedLimit,
    },
  };
};

export const useCreateCurriculum = () => {
  return useMutation({
    mutationFn: (payload: CurriculumPayload) => {
      return customAPI.post("/curriculum", payload);
    },
  });
};

export const useEditCurriculum = (id: string) => {
  return useMutation({
    mutationFn: (payload: Partial<CurriculumPayload>) => {
      return customAPI.patch(`/curriculum/${id}`, payload);
    },
  });
};

export const useDeleteCurriculum = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/curriculum/${id}`);
    },
  });
};

export const useGetCurriculumById = (id: string, options?: UseQueryOptions) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["curriculum", id],
    queryFn: () => {
      return customAPI.get(`/curriculum/${id}`);
    },
    enabled: options?.enabled ?? Boolean(id),
    refetchOnWindowFocus: true,
    ...options,
  });

  const curriculum = (data as { data: CurriculumItem })?.data || {};

  return { curriculum, isLoading, refetch };
};

// Patch curriculum by passing id at call time - useful for quick toggles
export const useEditCurriculumById = () => {
  return useMutation({
    mutationFn: (payload: Partial<CurriculumPayload> & { id: string }) => {
      const { id, ...rest } = payload;
      return customAPI.patch(`/curriculum/${id}`, rest);
    },
  });
};

export type CurriculumProgressDashboardFilters = {
  curriculumId?: string;
  subjectCatalogId?: string;
  classLevelId?: string;
  teacherId?: string;
  academicTermId?: string;
};

export const useGetCurriculumProgressDashboard = (
  filters: CurriculumProgressDashboardFilters
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["curriculumProgressDashboard", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.curriculumId)
        params.set("curriculumId", filters.curriculumId);
      if (filters.subjectCatalogId)
        params.set("subjectCatalogId", filters.subjectCatalogId);
      if (filters.classLevelId)
        params.set("classLevelId", filters.classLevelId);
      if (filters.teacherId) params.set("teacherId", filters.teacherId);
      if (filters.academicTermId)
        params.set("academicTermId", filters.academicTermId);
      const qs = params.toString();
      return customAPI.get(
        `/curriculum/progress-dashboard${qs ? `?${qs}` : ""}`
      );
    },
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const dashboard = data?.data as CurriculumProgressDashboardData | undefined;

  return { dashboard, isLoading, refetch };
};

export const useGetCurriculumTopicDetail = (
  topicId: string,
  subjectId: string,
  classLevelId: string,
  academicTermId?: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: [
      "curriculumTopicDetail",
      topicId,
      subjectId,
      classLevelId,
      academicTermId,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("subjectId", subjectId);
      params.set("classLevelId", classLevelId);
      if (academicTermId) params.set("academicTermId", academicTermId);
      return customAPI.get(
        `/curriculum/topics/${topicId}/detail?${params.toString()}`
      );
    },
    enabled:
      (options?.enabled ?? true) && Boolean(topicId && subjectId && classLevelId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const detail = (data as { data?: CurriculumTopicDetailData } | undefined)
    ?.data;

  return { detail, isLoading, refetch, error };
};

export const useGetCurriculumTopicNotes = (
  topicId: string,
  subjectId?: string,
  academicTermId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["curriculumTopicNotes", topicId, subjectId, academicTermId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (subjectId) params.set("subjectId", subjectId);
      if (academicTermId) params.set("academicTermId", academicTermId);
      const qs = params.toString();
      return customAPI.get(
        `/curriculum/topics/${topicId}/notes${qs ? `?${qs}` : ""}`
      );
    },
    enabled: Boolean(topicId),
    refetchOnWindowFocus: true,
  });

    const notes =
      (data?.data as CurriculumTopicNote[] | undefined) ?? [];

  return { notes, isLoading, refetch };
};

export const useCreateCurriculumTopicNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCurriculumTopicNotePayload) =>
      customAPI.post("/curriculum/notes", payload),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ["curriculumTopicNotes", v.topicId],
      });
    },
  });
};

/** DELETE /curriculum/notes/:id */
export const useDeleteCurriculumTopicNote = (topicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) =>
      customAPI.delete(`/curriculum/notes/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curriculumTopicNotes", topicId],
      });
    },
  });
};

export const useCreateSubtopic = (topicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubtopicPayload) =>
      customAPI.post(`/curriculum/topics/${topicId}/subtopics`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curriculumTopicDetail", topicId],
      });
    },
  });
};

/** PATCH /curriculum/subtopics/:id — pass subtopic id at call time */
export const useUpdateSubtopic = (topicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubtopicPayload;
    }) => customAPI.patch(`/curriculum/subtopics/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curriculumTopicDetail", topicId],
      });
    },
  });
};

/** DELETE /curriculum/subtopics/:id */
export const useDeleteSubtopic = (topicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subtopicId: string) =>
      customAPI.delete(`/curriculum/subtopics/${subtopicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curriculumTopicDetail", topicId],
      });
    },
  });
};

/**
 * TOPICS CRUD
 */
export const useGetTopics = (
  search: string = "",
  page: number = 1,
  limit: number = 20,
  academicTermId?: string,
  queryEnabled: boolean = true
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["curriculumTopics", { search, page, limit, academicTermId }],
    queryFn: () => {
      const queryBuilder = [];
      if (search) {
        queryBuilder.push(`search=${encodeURIComponent(search)}`);
      }
      if (academicTermId) {
        queryBuilder.push(
          `academicTermId=${encodeURIComponent(academicTermId)}`
        );
      }
      queryBuilder.push(`page=${page}`);
      queryBuilder.push(`limit=${limit}`);
      const params = queryBuilder.join("&");
      return customAPI.get(`/curriculum/topics?${params}`);
    },
    enabled: queryEnabled,
    refetchOnWindowFocus: true,
  });

  const resData = data?.data;

  const topics = resData?.data ?? [];
  const total = resData?.total ?? 0;
  const resolvedLimit = resData?.limit ?? limit;
  const totalPages =
    total === 0 ? 1 : Math.max(1, Math.ceil(total / resolvedLimit));

  return {
    topics,
    isLoading,
    refetch,
    paginationValues: {
      totalPages,
      total,
      page: resData?.page ?? page,
      limit: resolvedLimit,
    },
  };
};

export const useCreateTopic = () => {
  return useMutation({
    mutationFn: (payload: TopicPayload) => {
      return customAPI.post("/curriculum/topics", payload);
    },
  });
};

export const useEditTopic = (id: string) => {
  return useMutation({
    mutationFn: (payload: Partial<TopicPayload>) => {
      return customAPI.patch(`/curriculum/topics/${id}`, payload);
    },
  });
};

export const useDeleteTopic = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/curriculum/topics/${id}`);
    },
  });
};

export const useDuplicateTopicsToTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DuplicateTopicsToTermPayload) =>
      customAPI.post("/curriculum/topics/duplicate-to-term", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["curriculumTopics"] });
    },
  });
};

export const useGetSubjectTopics = (
  subjectCatalogId?: string,
  academicTermId?: string,
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["subjectCatalogTopics", subjectCatalogId, academicTermId],
    queryFn: () => {
      const qs = academicTermId
        ? `?academicTermId=${encodeURIComponent(academicTermId)}`
        : "";
      return customAPI.get(
        `/curriculum/subject-catalogs/${subjectCatalogId}/topics${qs}`
      );
    },
    enabled: Boolean(subjectCatalogId),
    refetchOnWindowFocus: true,
  });

  const topics = (data?.data as Topic[]) || (data?.data?.data as Topic[]) || [];

  return { topics, isLoading, refetch };
};

/**
 * ADMISSION POLICY CRUD
 */
export const useGetAdmissionPolicies = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["myAdmissionPolicies"],
    queryFn: () => {
      return customAPI.get("/admission-policies");
    },
    refetchOnWindowFocus: true,
  });

  const admissionPolicies = (data?.data as AdmissionPolicy[]) || [];

  return { admissionPolicies, isLoading, refetch };
};

export const useCreateAdmissionPolicy = () => {
  return useMutation({
    mutationFn: ({ name, file }: { name: string; file: File }) => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("file", file);

      return customAPI.post("/admission-policies", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  });
};

export const useDeleteAdmissionPolicy = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/admission-policies/${id}/document`);
    },
  });
};

// View student/teacher
export const useGetSchoolUserById = (id: string, options?: UseQueryOptions) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["schoolUser", id],
    queryFn: () => {
      return customAPI.get(`/school-admin/users/${id}`);
    },
    enabled: options?.enabled ?? Boolean(id),
    refetchOnWindowFocus: true,
    ...options,
  });

  const schoolUser = (data as { data: User | Student })?.data;

  return { schoolUser, isLoading, refetch };
};

/**
 * ADMISSION FORMS
 */
export const useSubmitAdmissionForm = () => {
  return useMutation({
    mutationFn: ({
      studentData,
      guardians,
      additionalInfo,
      schoolId,
    }: {
      studentData: StudentInformation;
      guardians: Guardian[];
      additionalInfo: AdditionalInformation;
      schoolId: string;
    }) => {
      const formData = new FormData();

      // Flat student data
      formData.append("schoolId", schoolId);
      formData.append("studentFirstName", studentData.firstName);
      formData.append("studentLastName", studentData.lastName);
      formData.append("studentOtherNames", studentData.otherNames);
      formData.append("studentEmail", studentData.email);
      formData.append("studentGender", studentData.gender);
      formData.append("studentDOB", studentData.dateOfBirth);
      formData.append("studentPlaceOfBirth", studentData.placeOfBirth);
      formData.append("studentNationality", studentData.nationality);
      formData.append("studentReligion", studentData.religion);
      formData.append("studentPhone", studentData.phone);
      formData.append("studentStreetAddress", studentData.streetAddress);
      formData.append("studentBoxAddress", studentData.boxAddress);
      formData.append("forClassId", studentData.classFor);
      studentData.languagesSpoken.forEach((lang) => {
        formData.append("studentLanguages[]", lang); // format for sending a array of strings
      });
      formData.append(
        "homePrimaryLanguage",
        additionalInfo.primaryHomeLanguage
      );
      formData.append(
        "homeOtherLanguage",
        additionalInfo.studentPrimaryLanguage
      );
      if (studentData.birthCertificateFile)
        formData.append("studentBirthCert", studentData.birthCertificateFile);
      if (studentData.headshotFile)
        formData.append("studentHeadshot", studentData.headshotFile);

      // Previous School
      if (
        additionalInfo.hasAcademicHistory === "yes" &&
        additionalInfo.previousSchool
      ) {
        const ps = additionalInfo.previousSchool;
        formData.append("previousSchoolName", ps.name);
        formData.append("previousSchoolUrl", ps.url);
        formData.append("previousSchoolStreetAddress", ps.street);
        formData.append("previousSchoolCity", ps.city);
        formData.append("previousSchoolState", ps.state);
        formData.append("previousSchoolCountry", ps.country);
        formData.append("previousSchoolAttendedFrom", ps.attendedFrom);
        formData.append("previousSchoolAttendedTo", ps.attendedTo);
        formData.append("previousSchoolGradeClass", ps.grade);

        ps.reportCards?.forEach((file, index) => {
          formData.append(`previousSchoolResult${index}`, file);
        });
      }

      // Guardians
      guardians.forEach((guardian, index) => {
        formData.append(`guardians[${index}][firstName]`, guardian.firstName);
        formData.append(`guardians[${index}][lastName]`, guardian.lastName);
        formData.append(`guardians[${index}][email]`, guardian.email);
        formData.append(
          `guardians[${index}][relationship]`,
          guardian.relationship
        );
        formData.append(`guardians[${index}][guardianPhone]`, guardian.phone);
        formData.append(
          `guardians[${index}][guardianOtherPhone]`,
          guardian.optionalPhone
        );
        formData.append(`guardians[${index}][occupation]`, guardian.occupation);
        formData.append(`guardians[${index}][company]`, guardian.company);
        formData.append(
          `guardians[${index}][nationality]`,
          guardian.nationality
        );
        formData.append(
          `guardians[${index}][streetAddress]`,
          guardian.streetAddress
        );
        formData.append(`guardians[${index}][boxAddress]`, guardian.boxAddress);

        if (guardian.headshotFile) {
          formData.append(`guardianHeadshot${index}`, guardian.headshotFile);
        }
      });

      return customAPI.post("/admissions", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  });
};

export const useGetAdmissionClassLevels = (id: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admissionClassLevel"],
    queryFn: () => {
      return customAPI.get(`/admissions/class-levels/${id}`);
    },
    refetchOnWindowFocus: true,
  });

  const classLevels = (data?.data as ClassLevel[]) || [];

  return { classLevels, isLoading, refetch };
};

export const useGetSchoolAdmissions = (
  page = 1,
  search: string = "",
  status: string = "",
  role: string = "",
  roleLabel?: string,
  limit?: number
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "allSchoolAdmissions",
      { page, search, status, role, roleLabel, limit },
    ],
    queryFn: () => {
      const queryBuilder = [];
      if (search) {
        queryBuilder.push(`search=${search}`);
      }

      if (status) {
        queryBuilder.push(`status=${status}`);
      }

      if (role) {
        queryBuilder.push(`role=${role}`);
      }

      if (page) {
        queryBuilder.push(`page=${page}`);
      }

      if (roleLabel) {
        queryBuilder.push(`roleLabel=${roleLabel}`);
      }

      if (limit) {
        queryBuilder.push(`limit=${limit}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";

      return customAPI.get(`/school-admin/admissions?${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const admissionsList = data?.data?.data;
  const paginationValues = data?.data.meta;
  return { admissionsList, isLoading, paginationValues, refetch };
};

export const useGetAdmissionById = (id: string, options?: UseQueryOptions) => {
  const { data, isPending, refetch } = useQuery({
    queryKey: ["admission", id],
    queryFn: () => {
      return customAPI.get(`/school-admin/admissions/${id}`);
    },
    enabled: options?.enabled ?? Boolean(id),
    refetchOnWindowFocus: true,
    ...options,
  });

  const admissionData = (data as { data: AdmissionData })?.data;
  return { admissionData, isPending, refetch };
};

export const useArchiveAdmission = (id: string) => {
  return useMutation({
    mutationFn: (archive: { archive: boolean }) => {
      return customAPI.put(`/school-admin/admissions/${id}/archive`, archive);
    },
  });
};

export const useEditAdmission = (id: string) => {
  return useMutation({
    mutationFn: (statusData: Partial<AdmissionData>) => {
      return customAPI.patch(
        `/school-admin/admissions/${id}/status`,
        statusData
      );
    },
  });
};

export const useInterviewInvitation = (id: string) => {
  return useMutation({
    mutationFn: (inviteDetails: {
      interviewDate: string;
      interviewTime: string;
    }) => {
      return customAPI.post(
        `/school-admin/admissions/${id}/interview`,
        inviteDetails
      );
    },
  });
};

export const useGetAdmisssionDashboardInfo = () => {
  const { data, isPending } = useQuery({
    queryKey: ["admissionDashboard"],
    queryFn: () => {
      return customAPI.get("school-admin/admissions/analytics");
    },
    refetchOnWindowFocus: true,
  });

  const dashboardStats = data?.data as AdmissionDashboardInfo;

  return { dashboardStats, isPending };
};

export const useGetAdminDashboardStats = () => {
  const { data, isPending } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => {
      return customAPI.get("school-admin/dashboard/stats");
    },
    refetchOnWindowFocus: true,
  });

  const dashboardStats = data?.data as AdminDashboardStats;

  return { dashboardStats, isPending };
};

export const useGetClassAttendance = (
  classLevelId: string,
  filterType: string = "month",
  month?: string,
  year?: string,
  week?: string,
  summaryOnly?: boolean,
  startDate?: string,
  endDate?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "classAttendance",
      {
        classLevelId,
        filterType,
        month,
        year,
        week,
        summaryOnly,
        startDate,
        endDate,
      },
    ],
    queryFn: () => {
      const queryBuilder = [];

      if (filterType) {
        queryBuilder.push(`filterType=${filterType}`);
      }

      if (month) {
        queryBuilder.push(`month=${month}`);
      }

      if (year) {
        queryBuilder.push(`year=${year}`);
      }

      if (week) {
        queryBuilder.push(`weekOfMonth=${week}`);
      }

      if (summaryOnly) {
        queryBuilder.push(`summaryOnly=${summaryOnly}`);
      }

      if (startDate) {
        queryBuilder.push(`startDate=${startDate}`);
      }

      if (endDate) {
        queryBuilder.push(`endDate=${endDate}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";
      return customAPI.get(
        `/school-admin/classes/${classLevelId}/attendance?${params}`
      );
    },
    enabled: !!classLevelId, // only run if classLevelId is provided
    refetchOnWindowFocus: true,
  });

  const attendanceData = data?.data;

  return { attendanceData, isLoading, refetch };
};

export const usePostClassAttendance = (classLevelId: string) => {
  return useMutation({
    mutationFn: (payload: PostAttendancePayload) =>
      customAPI.post(
        `/school-admin/classes/${classLevelId}/attendance`,
        payload
      ),
  });
};

export const useAdminViewStudentAttendance = (
  classLevelId: string,
  studentId: string,
  calendarId: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminStudentAttendance", studentId, calendarId, classLevelId],
    queryFn: () => {
      return customAPI.get(
        `school-admin/classes/${classLevelId}/students/${studentId}/calendars/${calendarId}/attendance/grouped`
      );
    },
    enabled: !!calendarId,
    refetchOnWindowFocus: true,
  });

  const studentAttendance = data?.data;
  return { studentAttendance, isLoading, refetch };
};

export const useGetAllSubjects = (enabled: boolean = true) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["allSubjects"],
    queryFn: () => {
      return customAPI.get("/subject-catalog");
    },
    enabled,
    refetchOnWindowFocus: true,
  });

  const subjects: Subject[] = data?.data;

  return { subjects, isLoading, refetch };
};

export const useGetSubjectById = (id: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["allSubjects", id],
    queryFn: () => {
      return customAPI.get(`/subject-catalog/${id}`);
    },
    enabled: id.length > 0,
    refetchOnWindowFocus: true,
  });

  const subjects = data?.data;

  return { subjects, isLoading, refetch };
};

export const useCreateSubject = () => {
  return useMutation({
    mutationFn: (subject: Subject) => {
      return customAPI.post(`/subject-catalog`, subject);
    },
  });
};

export const useUpdateSubject = () => {
  return useMutation({
    mutationFn: (subject: Subject) => {
      return customAPI.put(`/subject-catalog/${subject.id}`, subject);
    },
  });
};

export const useDeleteSubject = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/subject-catalog/${id}`);
    },
  });
};

export const useAssignSubjectTeacher = () => {
  return useMutation({
    mutationFn: (payload: AssignSubjectTeacherPayload) => {
      return customAPI.post(`/subject`, payload);
    },
  });
};

export const useUpdateSubjectTeacher = (id: string) => {
  return useMutation({
    mutationFn: (payload: AssignSubjectTeacherPayload) => {
      return customAPI.patch(`/subject/${id}`, payload);
    },
  });
};

export const useRemoveSubjectAssignment = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/subject/${id}`);
    },
  });
};

export const useGetStudentResults = (
  studentId: string,
  academicCalendarId: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["studentResults", studentId, academicCalendarId],
    queryFn: () => {
      return customAPI.get(
        `/subject/students/${studentId}/results/${academicCalendarId}`
      );
    },
    enabled: options?.enabled ?? Boolean(studentId && academicCalendarId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const resultsData = (data as { data: StudentResultsResponse })?.data || {};

  return { resultsData, isLoading, refetch };
};

export const useAdminStudentPerformanceAnalytics = (
  studentId: string,
  academicTermId: string,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "studentPerformanceAnalytics",
      "admin",
      studentId,
      academicTermId,
    ],
    queryFn: () =>
      customAPI.get(`/school-admin/students/${studentId}/performance-analytics`, {
        params: { academicTermId },
      }),
    enabled:
      options?.enabled ?? Boolean(studentId && academicTermId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const analytics =
    (data as { data: StudentPerformanceAnalytics })?.data ?? null;

  return { analytics, isLoading, refetch };
};

export type ClassSubjectPerformanceFilters = {
  classLevelId: string;
  academicTermId: string;
  subjectCatalogId: string;
  cluster?: PerformanceCluster;
  scoreRangeMin?: number;
  scoreRangeMax?: number;
  aggregatedAsOf?: string;
};

export const useGetClassSubjectPerformance = (
  filters: ClassSubjectPerformanceFilters,
  options?: { enabled?: boolean }
) => {
  const {
    classLevelId,
    academicTermId,
    subjectCatalogId,
    cluster,
    scoreRangeMin,
    scoreRangeMax,
    aggregatedAsOf,
  } = filters;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["classSubjectPerformance", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("academicTermId", academicTermId);
      params.set("subjectCatalogId", subjectCatalogId);
      if (cluster) params.set("cluster", cluster);
      if (scoreRangeMin !== undefined)
        params.set("scoreRangeMin", String(scoreRangeMin));
      if (scoreRangeMax !== undefined)
        params.set("scoreRangeMax", String(scoreRangeMax));
      if (aggregatedAsOf) params.set("aggregatedAsOf", aggregatedAsOf);

      return customAPI.get(
        `/school-admin/classes/${classLevelId}/subject-performance?${params.toString()}`
      );
    },
    enabled:
      (options?.enabled ?? true) &&
      Boolean(classLevelId && academicTermId && subjectCatalogId),
    refetchOnWindowFocus: true,
  });

  const performance =
    (data?.data as ClassSubjectPerformanceResponse) ?? null;

  return { performance, isLoading, isFetching, refetch };
};

export const useGetStudentTopicPerformance = (
  studentId: string,
  academicTermId: string,
  subjectCatalogId: string,
  options?: { enabled?: boolean }
) => {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "studentTopicPerformance",
      studentId,
      academicTermId,
      subjectCatalogId,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("academicTermId", academicTermId);
      params.set("subjectCatalogId", subjectCatalogId);
      return customAPI.get(
        `/school-admin/students/${studentId}/topic-performance?${params.toString()}`
      );
    },
    enabled:
      (options?.enabled ?? true) &&
      Boolean(studentId && academicTermId && subjectCatalogId),
    refetchOnWindowFocus: true,
  });

  const topicPerformance =
    (data?.data as StudentTopicPerformanceResponse) ?? null;

  return { topicPerformance, isLoading, isFetching, refetch };
};

export const useGetNotifications = (
  schoolId: string | null | undefined,
  search?: string,
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", schoolId, search],
    queryFn: () => {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
      return customAPI.get(`/notifications/school/${schoolId}${queryParams}`);
    },
    enabled: !!schoolId,
    refetchOnWindowFocus: true,
    refetchInterval: 20000,
  });

  const notifications: Notification[] = data?.data || [];

  return { notifications, isLoading, refetch };
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.patch(`/notifications/${id}/markAsRead`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schoolId: string) => {
      return customAPI.patch(`/notifications/school/${schoolId}/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useCreateNotification = () => {
  return useMutation({
    mutationFn: (notification: Notification) => {
      return customAPI.post("/notifications", notification);
    },
  });
};

export const useGetReminders = (
  search: string = "",
  status: string = "",
  type: string = "",
  dateFrom?: string,
  dateTo?: string,
  page?: number | string
  //   limit?: number
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["allReminders", { search }],
    queryFn: () => {
      const queryBuilder: string[] = [];

      if (search) queryBuilder.push(`search=${search?.toLowerCase()}`);
      if (status) queryBuilder.push(`status=${status}`);
      if (type) queryBuilder.push(`type=${type}`);
      if (dateFrom) queryBuilder.push(`dateFrom=${dateFrom}`);
      if (dateTo) queryBuilder.push(`to=${dateTo}`);
      if (page) queryBuilder.push(`page=${page}`);
      //   if (limit) queryBuilder.push(`limit=${limit}`);

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";

      return customAPI.get(`/message-reminders?${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const allReminders = data?.data || [];
  //   const paginationValues = data?.data?.meta;

  return { allReminders, isLoading, refetch };
};

/**
 * REMINDERS CRUD
 */

export const useCreateReminder = () => {
  return useMutation({
    mutationFn: (reminder: Partial<Reminder>) => {
      return customAPI.post("/message-reminders", reminder);
    },
  });
};

export const useDeleteReminder = () => {
  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/message-reminders/${id}`);
    },
  });
};

export const useEditReminder = (id: string) => {
  return useMutation({
    mutationFn: (reminder: Partial<Reminder>) => {
      return customAPI.patch(`/message-reminders/${id}`, reminder);
    },
  });
};

export const useUpdateGradingPercentages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      schoolId: string;
      classScorePercentage: number;
      examScorePercentage: number;
    }) => {
      return customAPI.put('/schools/update-grading-percentages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySchool'] });
    },
  });
};

export const useUpdateCalendlyUrl = () => {
  return useMutation({
    mutationFn: (payload: { calendlyUrl: string; schoolId: string }) => {
      return customAPI.put("/schools/update-calendly-url", payload);
    },
  });
};

export const useAdminApproveClassResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApproveClassResultsPayload) => {
      return customAPI.post(
        `/subject/school-admin/toggle-class-results-approval`,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
      queryClient.invalidateQueries({ queryKey: ["myClassLevels"] });
      queryClient.invalidateQueries({ queryKey: ["adminResultsReview"] });
    },
  });
};

export const useAdminCheckResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { classLevelId: string; academicTermId: string }) =>
      customAPI.post(`/subject/school-admin/check-results`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myClassLevels"] });
      queryClient.invalidateQueries({ queryKey: ["adminResultsReview"] });
    },
  });
};

export const useAdminReturnResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      classLevelId: string;
      academicTermId: string;
      returnNote: string;
    }) => customAPI.post(`/subject/school-admin/return-results`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myClassLevels"] });
      queryClient.invalidateQueries({ queryKey: ["adminResultsReview"] });
    },
  });
};

export const useAdminPublishResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { classLevelId: string; academicTermId: string }) =>
      customAPI.post(`/subject/school-admin/publish-results`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myClassLevels"] });
      queryClient.invalidateQueries({ queryKey: ["adminResultsReview"] });
    },
  });
};

export const useAdminResultsReview = (filters: {
  classLevelId?: string;
  subjectId?: string;
  teacherId?: string;
  academicTermId?: string;
}) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminResultsReview", filters],
    enabled: !!filters.academicTermId,
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.classLevelId) params.set("classLevelId", filters.classLevelId);
      if (filters.subjectId) params.set("subjectId", filters.subjectId);
      if (filters.teacherId) params.set("teacherId", filters.teacherId);
      if (filters.academicTermId) {
        params.set("academicTermId", filters.academicTermId);
      }
      const q = params.toString();
      return customAPI.get(`/subject/school-admin/results-review${q ? `?${q}` : ""}`);
    },
  });
  return { review: data?.data, isLoading, refetch };
};

export const useUpdateParentResultVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      parentShowScores: boolean;
      parentShowGrades: boolean;
      parentShowLabels: boolean;
      parentShowFeedback: boolean;
    }) => customAPI.patch("/schools/parent-result-visibility", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySchool"] });
    },
  });
};

/**
 * ASSIGNMENTS CRUD
 */
export const useGetAssignments = (
  page: number = 1,
  search: string = "",
  teacherId: string = "",
  classLevelId: string = "",
  limit?: number,
  academicTermId?: string,
  curriculumId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "adminAssignments",
      {
        page,
        search,
        teacherId,
        classLevelId,
        limit,
        academicTermId,
        curriculumId,
      },
    ],
    queryFn: () => {
      const queryBuilder: string[] = [];

      if (search) {
        queryBuilder.push(`search=${encodeURIComponent(search)}`);
      }

      if (teacherId) {
        queryBuilder.push(`teacherId=${encodeURIComponent(teacherId)}`);
      }

      if (classLevelId) {
        queryBuilder.push(`classLevelId=${encodeURIComponent(classLevelId)}`);
      }

      if (academicTermId) {
        queryBuilder.push(
          `academicTermId=${encodeURIComponent(academicTermId)}`
        );
      }

      if (curriculumId) {
        queryBuilder.push(`curriculumId=${encodeURIComponent(curriculumId)}`);
      }

      if (page) {
        queryBuilder.push(`page=${page}`);
      }

      if (limit) {
        queryBuilder.push(`limit=${limit}`);
      }

      const params = queryBuilder.length > 0 ? queryBuilder.join("&") : "";

      return customAPI.get(`/school-admin/assignments?${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const assignments = (data?.data?.data as AdminAssignment[]) || [];
  const paginationValues = data?.data?.meta;

  return { assignments, isLoading, paginationValues, refetch };
};

export const useGetAssignmentStudents = (
  assignmentId: string,
  filter: "pending" | "submitted" | null = null,
  options?: UseQueryOptions
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["assignmentStudents", assignmentId, filter],
    queryFn: () => {
      const queryParam = filter ? `?${filter}=true` : "";
      return customAPI.get(
        `/school-admin/assignments/${assignmentId}/students${queryParam}`
      );
    },
    enabled: options?.enabled ?? Boolean(assignmentId),
    refetchOnWindowFocus: true,
    ...options,
  });

  const students = (data as { data?: AssignmentSubmission[] })?.data || [];

  return { students, isLoading, refetch };
};

/**
 * PLANNER EVENTS CRUD
 */
export const useGetPlannerEvents = (
  startDate?: string,
  endDate?: string,
  categoryId?: string,
  classLevelId?: string,
  subjectId?: string,
  visibilityScope?: VisibilityScope
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "plannerEvents",
      {
        startDate,
        endDate,
        categoryId,
        classLevelId,
        subjectId,
        visibilityScope,
      },
    ],
    queryFn: () => {
      const queryBuilder: string[] = [];

      if (startDate) {
        queryBuilder.push(`startDate=${startDate}`);
      }

      if (endDate) {
        queryBuilder.push(`endDate=${endDate}`);
      }

      if (categoryId) {
        queryBuilder.push(`categoryId=${categoryId}`);
      }

      if (classLevelId) {
        queryBuilder.push(`classLevelId=${classLevelId}`);
      }

      if (subjectId) {
        queryBuilder.push(`subjectId=${subjectId}`);
      }

      if (visibilityScope) {
        queryBuilder.push(`visibilityScope=${visibilityScope}`);
      }

      const params =
        queryBuilder.length > 0 ? `?${queryBuilder.join("&")}` : "";

      return customAPI.get(`/planner/events${params}`);
    },
    refetchOnWindowFocus: true,
  });

  const events = (data?.data as PlannerEvent[]) || [];

  return { events, isLoading, refetch };
};

export const useCreatePlannerEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePlannerEventPayload) => {
      const formData = new FormData();

      formData.append("title", payload.title);
      if (payload.description) {
        formData.append("description", payload.description);
      }
      formData.append("startDate", payload.startDate);
      if (payload.endDate) {
        formData.append("endDate", payload.endDate);
      }
      // Send isAllDay as string - backend Transform decorator will convert to boolean
      formData.append("isAllDay", String(payload.isAllDay ?? false));
      if (payload.location) {
        formData.append("location", payload.location);
      }
      formData.append("categoryId", payload.categoryId);
      formData.append("visibilityScope", payload.visibilityScope);

      if (
        payload.targetClassLevelIds &&
        payload.targetClassLevelIds.length > 0
      ) {
        payload.targetClassLevelIds.forEach((id) => {
          formData.append("targetClassLevelIds[]", id);
        });
      }

      if (payload.targetSubjectIds && payload.targetSubjectIds.length > 0) {
        payload.targetSubjectIds.forEach((id) => {
          formData.append("targetSubjectIds[]", id);
        });
      }

      if (payload.reminders && payload.reminders.length > 0) {
        payload.reminders.forEach((reminder, index) => {
          formData.append(
            `reminders[${index}][reminderTime]`,
            reminder.reminderTime
          );
          if (reminder.notificationType) {
            formData.append(
              `reminders[${index}][notificationType]`,
              reminder.notificationType
            );
          }
        });
      }

      if (payload.files && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      if (payload.sendNotifications !== undefined) {
        formData.append("sendNotifications", String(payload.sendNotifications));
      }

      return customAPI.post("/planner/events", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannerEvents"] });
    },
  });
};

export const useUpdatePlannerEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreatePlannerEventPayload>;
    }) => {
      const formData = new FormData();

      // Always send title if it exists in payload (even if empty string)
      if (payload.title !== undefined) {
        formData.append("title", payload.title);
      }
      if (payload.description !== undefined) {
        formData.append("description", payload.description || "");
      }
      if (payload.startDate !== undefined) {
        formData.append("startDate", payload.startDate);
      }
      if (payload.endDate !== undefined) {
        formData.append("endDate", payload.endDate || "");
      }
      if (payload.isAllDay !== undefined) {
        formData.append("isAllDay", String(payload.isAllDay));
      }
      if (payload.location !== undefined) {
        formData.append("location", payload.location || "");
      }
      if (payload.categoryId !== undefined) {
        formData.append("categoryId", payload.categoryId);
      }
      if (payload.visibilityScope !== undefined) {
        formData.append("visibilityScope", payload.visibilityScope);
      }

      // Send arrays even if empty to clear associations
      if (payload.targetClassLevelIds !== undefined) {
        if (payload.targetClassLevelIds.length > 0) {
          payload.targetClassLevelIds.forEach((id) => {
            formData.append("targetClassLevelIds[]", id);
          });
        }
        // If empty array, send empty array to clear associations
        // Backend will handle empty array
      }

      if (payload.targetSubjectIds !== undefined) {
        if (payload.targetSubjectIds.length > 0) {
          payload.targetSubjectIds.forEach((id) => {
            formData.append("targetSubjectIds[]", id);
          });
        }
        // If empty array, send empty array to clear associations
      }

      if (payload.reminders !== undefined) {
        payload.reminders.forEach((reminder, index) => {
          formData.append(
            `reminders[${index}][reminderTime]`,
            reminder.reminderTime
          );
          if (reminder.notificationType) {
            formData.append(
              `reminders[${index}][notificationType]`,
              reminder.notificationType
            );
          }
        });
      }

      if (payload.files !== undefined && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      if (payload.sendNotifications !== undefined) {
        formData.append("sendNotifications", String(payload.sendNotifications));
      }

      return customAPI.put(`/planner/events/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      // Invalidate all planner-related queries
      queryClient.invalidateQueries({ queryKey: ["plannerEvents"] });
      queryClient.invalidateQueries({ queryKey: ["planner"] });
    },
  });
};

export const useDeletePlannerEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/planner/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannerEvents"] });
    },
  });
};

/**
 * EVENT CATEGORIES CRUD
 */
export const useGetEventCategories = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["eventCategories"],
    queryFn: () => {
      return customAPI.get("/planner/categories");
    },
    refetchOnWindowFocus: true,
  });

  const categories = (data?.data as EventCategory[]) || [];

  return { categories, isLoading, refetch };
};

export const useCreateEventCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventCategoryPayload) => {
      return customAPI.post("/planner/categories", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventCategories"] });
    },
  });
};

export const useUpdateEventCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateEventCategoryPayload>;
    }) => {
      return customAPI.put(`/planner/categories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventCategories"] });
    },
  });
};

export const useDeleteEventCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return customAPI.delete(`/planner/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventCategories"] });
      queryClient.invalidateQueries({ queryKey: ["plannerEvents"] });
    },
  });
};

export const useGetSchoolPaymentConfig = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["schoolPaymentConfig"],
    queryFn: () => customAPI.get("/payments/my-school/config"),
    refetchOnWindowFocus: true,
  });

  const config = data?.data as SchoolPaymentConfig | undefined;

  return { config, isLoading, refetch };
};

export const useRequestPaymentSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { contactEmail?: string; note?: string }) =>
      customAPI.post("/payments/my-school/request-setup", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolPaymentConfig"] });
    },
  });
};

export const useGetSchoolPayments = (params: SchoolPaymentsListParams, queryEnabled: boolean = true) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    studentId = "",
    dateFrom = "",
    dateTo = "",
  } = params;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "schoolPayments",
      { page, limit, search, status, studentId, dateFrom, dateTo },
    ],
    queryFn: () => {
      const queryBuilder: string[] = [];
      queryBuilder.push(`page=${page}`);
      queryBuilder.push(`limit=${limit}`);
      if (search) queryBuilder.push(`search=${encodeURIComponent(search)}`);
      if (status) queryBuilder.push(`status=${encodeURIComponent(status)}`);
      if (studentId) queryBuilder.push(`studentId=${encodeURIComponent(studentId)}`);
      if (dateFrom) queryBuilder.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
      if (dateTo) queryBuilder.push(`dateTo=${encodeURIComponent(dateTo)}`);
      return customAPI.get(`/payments/my-school?${queryBuilder.join("&")}`);
    },
    enabled: queryEnabled,
    refetchOnWindowFocus: true,
  });

  const body = data?.data as PaginatedSchoolPaymentsResponse | undefined;
  const transactions = (body?.data ?? []) as SchoolPaymentTransaction[];
  const meta = body?.meta;
  const summary = body?.summary;

  return { transactions, meta, summary, isLoading, refetch };
};

export const useGetSchoolPaymentReceipt = (
  transactionId: string | null,
  enabled: boolean
) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["schoolPaymentReceipt", transactionId],
    queryFn: () =>
      customAPI.get(
        `/payments/my-school/${encodeURIComponent(transactionId as string)}/receipt`
      ),
    enabled: Boolean(transactionId) && enabled,
    refetchOnWindowFocus: false,
  });

  const receipt = data?.data as SchoolPaymentReceiptDetail | undefined;

  return { receipt, isLoading, isFetching, error, refetch };
};

export const useGetFinanceStudents = (
  params: FinanceStudentsListParams,
  queryEnabled: boolean = true
) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    classLevelId = "",
    balanceStatus = "all",
  } = params;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "financeStudents",
      { page, limit, search, classLevelId, balanceStatus },
    ],
    queryFn: () => {
      const queryBuilder: string[] = [];
      queryBuilder.push(`page=${page}`);
      queryBuilder.push(`limit=${limit}`);
      if (search) queryBuilder.push(`search=${encodeURIComponent(search)}`);
      if (classLevelId)
        queryBuilder.push(`classLevelId=${encodeURIComponent(classLevelId)}`);
      if (balanceStatus && balanceStatus !== "all") {
        queryBuilder.push(
          `balanceStatus=${encodeURIComponent(balanceStatus)}`
        );
      }
      return customAPI.get(
        `/finance/my-school/students?${queryBuilder.join("&")}`
      );
    },
    enabled: queryEnabled,
    refetchOnWindowFocus: true,
  });

  const body = data?.data as PaginatedFinanceStudentsResponse | undefined;
  const students = (body?.data ?? []) as FinanceStudentRow[];
  const meta = body?.meta;
  const summary = body?.summary;

  return { students, meta, summary, isLoading, refetch };
};

export const useGetFinanceClasses = (queryEnabled: boolean = true) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["financeClasses"],
    queryFn: () => customAPI.get("/finance/my-school/classes"),
    enabled: queryEnabled,
    refetchOnWindowFocus: true,
  });

  const body = data?.data as FinanceClassesResponse | undefined;
  const classes = (body?.data ?? []) as FinanceClassRow[];

  return { classes, isLoading, refetch };
};

export const useGetFinanceStudentDetail = (
  studentId: string | null,
  enabled: boolean = true
) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["financeStudentDetail", studentId],
    queryFn: () =>
      customAPI.get(
        `/finance/my-school/students/${encodeURIComponent(studentId as string)}`
      ),
    enabled: Boolean(studentId) && enabled,
    refetchOnWindowFocus: false,
  });

  const detail = data?.data as FinanceStudentDetailResponse | undefined;

  return { detail, isLoading, isFetching, error, refetch };
};