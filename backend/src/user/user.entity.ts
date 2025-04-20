import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @ManyToOne(() => School, (school) => school.users, { nullable: true })
  school: School;

  @Column({ default: 'active' })
  status: string;
}
