import { Student } from 'src/student/student.entity';
import { User } from 'src/user/user.entity';

// User with type discrimination
export type UserWithType = (Student | User) & {
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