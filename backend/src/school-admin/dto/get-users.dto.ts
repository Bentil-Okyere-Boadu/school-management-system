import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';
// User with type discrimination
export type UserWithType = (Student | Teacher) & {
  userType: 'student' | 'teacher';
};

export class GetUsersResponseDto {
  data: UserWithType[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    studentsCount: number;
    teachersCount: number;
  };
}
