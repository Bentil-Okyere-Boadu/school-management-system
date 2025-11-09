import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubjectCatalog } from '../../subject/subject-catalog.entity';
import { School } from '../../school/school.entity';
import { AcademicTerm } from '../../academic-calendar/entitites/academic-term.entity';

@Entity()
export class Curriculum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(
    () => SubjectCatalog,
    (subjectCatalog) => subjectCatalog.curricula,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinTable({
    name: 'curriculum_subject_catalogs',
    joinColumn: { name: 'curriculum_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'subject_catalog_id',
      referencedColumnName: 'id',
    },
  })
  subjectCatalogs: SubjectCatalog[];

  @ManyToOne(() => School, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  school: School;

  @ManyToOne(() => AcademicTerm, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  academicTerm: AcademicTerm;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
