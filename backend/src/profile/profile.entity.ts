import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { School } from 'src/school/school.entity';
import { Student } from 'src/student/student.entity';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  VirtualColumn,
} from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @VirtualColumn({
    query: (alias) => `(NULL)`, // Placeholder: handled dynamically in code
  })
  avatarUrl?: string;

  @Column({ nullable: true })
  avatarPath?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  streetAddress?: string;

  @Column({ nullable: true })
  phoneContact?: string;

  @Column({ nullable: true })
  optionalPhoneContact?: string;

  @OneToOne(() => SchoolAdmin, (admin) => admin.profile)
  @JoinColumn()
  schoolAdmin: SchoolAdmin;

  @OneToOne(() => Student, (student) => student.profile)
  @JoinColumn()
  student: Student;

  @OneToOne(() => Teacher, (teacher) => teacher.profile)
  @JoinColumn()
  teacher: Teacher;

  @OneToOne(() => SuperAdmin, (admin) => admin.profile)
  @JoinColumn()
  superAdmin: SuperAdmin;

  @OneToOne(() => School, {
    eager: true,
  })
  @JoinColumn()
  school: School;
}
