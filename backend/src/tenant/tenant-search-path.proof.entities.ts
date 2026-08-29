import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Catalog-shaped School for the TypeORM search_path proof.
 * No inverse OneToMany collections — that is the intended production shape.
 */
@Entity({ name: 'school' })
export class CatalogSchoolProof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}

/**
 * Tenant-shaped student: ManyToOne School, no @Entity schema, no inverse.
 */
@Entity({ name: 'student' })
export class TenantStudentProof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @ManyToOne(() => CatalogSchoolProof, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: CatalogSchoolProof;
}
