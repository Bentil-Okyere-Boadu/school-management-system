import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
//Todo: proper mapping to missing requirememts in mockup
@Entity()
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  /**
   * School code used for generating IDs
   * Format: 5-digit unique identifier
   */
  @Column({ nullable: true, unique: true })
  schoolCode: string;

  @OneToMany(() => User, (user) => user.school)
  users: User[];

  /**
   * Generate a 5-digit school code before inserting
   * This will be used for generating user IDs
   */
  @BeforeInsert()
  generateSchoolCode() {
    // Simple way: random 5-digit number
    // In a production system, this should be more sophisticated
    const min = 10000; // 5 digits min
    const max = 99999; // 5 digits max
    this.schoolCode = Math.floor(
      Math.random() * (max - min + 1) + min,
    ).toString();
  }
}
