import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Parent } from './parent.entity';
import { ParentStudent } from './parent-student.entity';
import {
  ParentAccountStatus,
  ParentStudentSource,
  ParentStudentStatus,
} from './parent.enums';
import { normalizeEmail, parentHasUsableAccount } from './parent.helpers';
import { LinkGuardianInput } from './dto/link-guardian.dto';
import { Student } from 'src/student/student.entity';
import { Role } from 'src/role/role.entity';
import { EmailService } from 'src/common/services/email.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/notification.entity';

@Injectable()
export class ParentLinkService {
  private readonly logger = new Logger(ParentLinkService.name);

  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepository: Repository<ParentStudent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  tokenExpiry(): Date {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    return expires;
  }

  async linkGuardianToStudent(
    studentId: string,
    input: LinkGuardianInput,
  ): Promise<{ parent: Parent; relationship: ParentStudent }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
    if (!student?.school) {
      throw new NotFoundException('Student not found');
    }

    const email = normalizeEmail(input.email);
    const source = input.source ?? ParentStudentSource.StudentProfile;

    let parent = email
      ? await this.findParentForLinking(student.school.id, email)
      : null;

    if (parent && !parent.school && student.school) {
      parent.school = student.school;
      parent = await this.parentRepository.save(parent);
    }

    if (!parent) {
      parent = await this.createPendingParent(student, input, email);
    }

    let relationship = await this.parentStudentRepository.findOne({
      where: { parent: { id: parent.id }, student: { id: student.id } },
      relations: ['parent', 'student', 'school'],
    });

    let shouldNotify = false;

    if (relationship?.status === ParentStudentStatus.Revoked) {
      relationship.status = ParentStudentStatus.PendingConfirmation;
      relationship.relationship = input.relationship ?? relationship.relationship;
      relationship.source = source;
      relationship.revokedAt = null;
      relationship = await this.parentStudentRepository.save(relationship);
      shouldNotify = true;
    } else if (!relationship) {
      const isOriginating =
        !parentHasUsableAccount(parent) &&
        (await this.countNonRevokedLinks(parent.id)) === 0;

      relationship = this.parentStudentRepository.create({
        parent,
        student,
        school: student.school,
        relationship: input.relationship ?? null,
        source,
        status: isOriginating
          ? ParentStudentStatus.Pending
          : ParentStudentStatus.PendingConfirmation,
      });
      relationship = await this.parentStudentRepository.save(relationship);
      shouldNotify = true;
    } else if (
      email &&
      parent.status !== ParentAccountStatus.Active &&
      relationship.status === ParentStudentStatus.Pending &&
      (!parent.invitationToken ||
        !parent.invitationExpires ||
        parent.invitationExpires.getTime() <= Date.now())
    ) {
      shouldNotify = true;
    }

    if (shouldNotify) {
      await this.afterRelationshipCreated(parent, student, relationship, email);
    }

    return { parent, relationship };
  }

  async updateGuardianForStudent(
    parentId: string,
    studentId: string,
    input: LinkGuardianInput,
  ): Promise<{ parent: Parent; relationship: ParentStudent }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
    if (!student?.school) {
      throw new NotFoundException('Student not found');
    }

    const currentLink = await this.parentStudentRepository.findOne({
      where: { parent: { id: parentId }, student: { id: studentId } },
      relations: ['parent', 'parent.school', 'student', 'school'],
    });
    if (!currentLink?.parent) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    const current = currentLink.parent;
    const email = normalizeEmail(input.email);
    const merged: LinkGuardianInput = {
      ...input,
      firstName: input.firstName || current.firstName,
      lastName: input.lastName || current.lastName,
      source: input.source ?? ParentStudentSource.StudentProfile,
    };

    if (email) {
      const existing = await this.findParentForLinking(student.school.id, email);
      if (existing && existing.id !== current.id) {
        currentLink.status = ParentStudentStatus.Revoked;
        currentLink.revokedAt = new Date();
        await this.parentStudentRepository.save(currentLink);
        return this.linkGuardianToStudent(studentId, merged);
      }
    }

    const previousEmail = normalizeEmail(current.email);
    if (input.firstName !== undefined) {
      current.firstName = input.firstName || current.firstName;
    }
    if (input.lastName !== undefined) {
      current.lastName = input.lastName || current.lastName;
    }
    if (input.phone !== undefined) {
      current.phone = input.phone ?? null;
    }
    if (input.occupation !== undefined) {
      current.occupation = input.occupation ?? null;
    }
    if (input.address !== undefined) {
      current.address = input.address ?? null;
    }
    if (email && previousEmail !== email) {
      current.email = email;
    }
    await this.parentRepository.save(current);

    if (input.relationship !== undefined) {
      currentLink.relationship = input.relationship ?? null;
      await this.parentStudentRepository.save(currentLink);
    }

    const emailAdded = !!email && !previousEmail;
    const invitationExpired =
      !current.invitationExpires ||
      current.invitationExpires.getTime() <= Date.now();
    const neverInvited = !current.invitationToken || invitationExpired;
    const shouldInvite =
      !!email &&
      current.status !== ParentAccountStatus.Active &&
      !current.password &&
      currentLink.status === ParentStudentStatus.Pending &&
      (emailAdded || neverInvited);

    if (shouldInvite) {
      await this.afterRelationshipCreated(current, student, currentLink, email);
    }

    return { parent: current, relationship: currentLink };
  }

  async completeParentInvitation(token: string, password: string) {
    const parent = await this.parentRepository.findOne({
      where: {
        invitationToken: token,
        status: ParentAccountStatus.Pending,
      },
      relations: ['role', 'school'],
    });

    if (!parent) {
      return null;
    }

    if (!parent.invitationExpires || parent.invitationExpires.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Invitation token has expired - please request a new invitation',
      );
    }

    parent.password = await bcrypt.hash(password, 10);
    parent.status = ParentAccountStatus.Active;
    parent.isInvitationAccepted = true;
    parent.invitationToken = '';
    parent.invitationExpires = new Date(0);
    await this.parentRepository.save(parent);

    const originating = await this.parentStudentRepository.find({
      where: {
        parent: { id: parent.id },
        status: ParentStudentStatus.Pending,
      },
      relations: ['student', 'school'],
      order: { createdAt: 'ASC' },
    });

    const first = originating[0];
    if (first) {
      first.status = ParentStudentStatus.Active;
      first.acceptedAt = new Date();
      first.confirmationToken = null;
      first.confirmationExpires = null;
      await this.parentStudentRepository.save(first);
    }

    const extras = originating.slice(1);
    for (const extra of extras) {
      extra.status = ParentStudentStatus.PendingConfirmation;
      await this.parentStudentRepository.save(extra);
    }

    await this.sendQueuedConfirmations(parent);
    await this.notifyAdmin(
      parent.school.id,
      NotificationType.ParentAccepted,
      'Parent invitation accepted',
      `${parent.firstName} ${parent.lastName} accepted the parent portal invitation.`,
    );

    return parent;
  }

  async confirmChildByToken(token: string) {
    const link = await this.parentStudentRepository.findOne({
      where: { confirmationToken: token },
      relations: ['parent', 'parent.school', 'student', 'school'],
    });

    if (!link) {
      throw new BadRequestException('Invalid confirmation token');
    }

    if (
      !link.confirmationExpires ||
      link.confirmationExpires.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'Confirmation token has expired - please request a new confirmation',
      );
    }

    if (link.parent?.status !== ParentAccountStatus.Active) {
      throw new BadRequestException(
        'Parent account must be activated before confirming a child',
      );
    }

    if (link.status === ParentStudentStatus.PendingReview) {
      throw new BadRequestException(
        'This relationship is waiting for school admin review',
      );
    }

    return this.activateRelationship(link);
  }

  async confirmChildAsParent(parentId: string, linkId: string) {
    const link = await this.parentStudentRepository.findOne({
      where: { id: linkId, parent: { id: parentId } },
      relations: ['parent', 'parent.school', 'student', 'school'],
    });
    if (!link) {
      throw new NotFoundException('Relationship not found');
    }
    if (link.status === ParentStudentStatus.PendingReview) {
      throw new BadRequestException(
        'This relationship is waiting for school admin review',
      );
    }
    return this.activateRelationship(link);
  }

  async adminActivate(link: ParentStudent) {
    return this.activateRelationship(link);
  }

  async adminRevoke(link: ParentStudent) {
    link.status = ParentStudentStatus.Revoked;
    link.revokedAt = new Date();
    link.confirmationToken = null;
    link.confirmationExpires = null;
    const saved = await this.parentStudentRepository.save(link);
    await this.notifyAdmin(
      link.school?.id ?? link.parent?.school?.id,
      NotificationType.ParentAccessRevoked,
      'Parent access revoked',
      `Access for ${link.parent?.firstName} ${link.parent?.lastName} to ${link.student?.firstName} ${link.student?.lastName} was revoked.`,
    );
    return saved;
  }

  async adminSendToConfirmation(link: ParentStudent) {
    if (link.status === ParentStudentStatus.Revoked) {
      throw new BadRequestException('Cannot confirm a revoked relationship');
    }
    link.status = ParentStudentStatus.PendingConfirmation;
    await this.parentStudentRepository.save(link);
    if (link.parent && parentHasUsableAccount(link.parent)) {
      await this.sendChildConfirmation(link.parent, link);
    }
    return link;
  }

  async resendInvitation(parent: Parent) {
    if (parent.status === ParentAccountStatus.Active) {
      throw new BadRequestException('Parent account is already active');
    }
    if (!parent.email) {
      throw new BadRequestException('Parent has no email to invite');
    }
    parent.invitationToken = this.generateToken();
    parent.invitationExpires = this.tokenExpiry();
    await this.parentRepository.save(parent);
    const originating = await this.parentStudentRepository.findOne({
      where: { parent: { id: parent.id }, status: ParentStudentStatus.Pending },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
    await this.emailService.sendParentInvitationEmail(
      parent,
      originating?.student ?? null,
    );
    return parent;
  }

  async resendChildConfirmation(link: ParentStudent) {
    if (!link.parent || link.parent.status !== ParentAccountStatus.Active) {
      throw new BadRequestException(
        'Parent must have an active account before confirming a child',
      );
    }
    if (link.status === ParentStudentStatus.Active) {
      throw new BadRequestException('Relationship is already active');
    }
    if (link.status === ParentStudentStatus.PendingReview) {
      throw new BadRequestException('Resolve the review before confirming');
    }
    link.status = ParentStudentStatus.PendingConfirmation;
    await this.parentStudentRepository.save(link);
    await this.sendChildConfirmation(link.parent, link);
    return link;
  }

  async listSchoolRelationships(schoolId: string) {
    return this.parentStudentRepository.find({
      where: { school: { id: schoolId } },
      relations: ['parent', 'student', 'school'],
      order: { createdAt: 'DESC' },
    });
  }

  private async findParentForLinking(schoolId: string, email: string) {
    const matches = await this.parentRepository
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.school', 'school')
      .leftJoinAndSelect('parent.role', 'role')
      .where('LOWER(parent.email) = :email', { email })
      .getMany();

    return (
      matches.find((parent) => parent.school?.id === schoolId) ??
      matches.find((parent) => !parent.school?.id) ??
      null
    );
  }

  private async createPendingParent(
    student: Student,
    input: LinkGuardianInput,
    email: string | null,
  ): Promise<Parent> {
    const parentRole = await this.roleRepository.findOne({
      where: { name: 'parent' },
    });
    const parent = this.parentRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      phone: input.phone ?? null,
      occupation: input.occupation ?? null,
      address: input.address ?? null,
      school: student.school,
      role: parentRole ?? undefined,
      status: ParentAccountStatus.Pending,
      isInvitationAccepted: false,
    });
    return this.parentRepository.save(parent);
  }

  private async countNonRevokedLinks(parentId: string) {
    return this.parentStudentRepository.count({
      where: [
        { parent: { id: parentId }, status: ParentStudentStatus.Pending },
        {
          parent: { id: parentId },
          status: ParentStudentStatus.PendingConfirmation,
        },
        { parent: { id: parentId }, status: ParentStudentStatus.PendingReview },
        { parent: { id: parentId }, status: ParentStudentStatus.Active },
      ],
    });
  }

  private async afterRelationshipCreated(
    parent: Parent,
    student: Student,
    relationship: ParentStudent,
    email: string | null,
  ) {
    if (!email) {
      return;
    }

    if (relationship.status === ParentStudentStatus.PendingReview) {
      await this.notifyAdmin(
        student.school.id,
        NotificationType.ParentReviewRequired,
        'Guardian details need review',
        `${inputName(parent)} was listed for ${student.firstName} ${student.lastName} but details conflict with the existing parent record.`,
      );
      return;
    }

    if (
      relationship.status === ParentStudentStatus.Pending &&
      parentHasUsableAccount(parent)
    ) {
      relationship.status = ParentStudentStatus.PendingConfirmation;
      await this.parentStudentRepository.save(relationship);
    }

    if (
      relationship.status === ParentStudentStatus.Pending &&
      !parentHasUsableAccount(parent)
    ) {
      parent.invitationToken = this.generateToken();
      parent.invitationExpires = this.tokenExpiry();
      relationship.invitedAt = new Date();
      await this.parentRepository.save(parent);
      await this.parentStudentRepository.save(relationship);
      await this.emailService.sendParentInvitationEmail(parent, student);
      await this.notifyAdmin(
        student.school.id,
        NotificationType.ParentInvitation,
        'Parent invitation sent',
        `Parent invitation sent — ${parent.firstName} ${parent.lastName} has been invited to access the parent portal for ${student.firstName} ${student.lastName}.`,
      );
      return;
    }

    if (relationship.status === ParentStudentStatus.PendingConfirmation) {
      if (parentHasUsableAccount(parent)) {
        await this.sendChildConfirmation(parent, relationship);
      }
      await this.notifyAdmin(
        student.school.id,
        NotificationType.ParentChildConfirmation,
        'Child confirmation requested',
        `${parent.firstName} ${parent.lastName} was listed as guardian for ${student.firstName} ${student.lastName}. Confirmation is required before portal access.`,
      );
    }
  }

  private async sendQueuedConfirmations(parent: Parent) {
    const queued = await this.parentStudentRepository.find({
      where: {
        parent: { id: parent.id },
        status: ParentStudentStatus.PendingConfirmation,
      },
      relations: ['student', 'school', 'parent'],
    });
    for (const link of queued) {
      await this.sendChildConfirmation(parent, link);
    }
  }

  private async sendChildConfirmation(parent: Parent, link: ParentStudent) {
    if (!parent.email) {
      return;
    }
    link.confirmationToken = this.generateToken();
    link.confirmationExpires = this.tokenExpiry();
    await this.parentStudentRepository.save(link);
    await this.emailService.sendParentChildConfirmationEmail(
      parent,
      link.student,
      link.confirmationToken,
    );
  }

  private async activateRelationship(link: ParentStudent) {
    link.status = ParentStudentStatus.Active;
    link.acceptedAt = new Date();
    link.confirmationToken = null;
    link.confirmationExpires = null;
    const saved = await this.parentStudentRepository.save(link);
    await this.notifyAdmin(
      link.school?.id ?? link.parent?.school?.id,
      NotificationType.ParentChildConfirmed,
      'Parent-child relationship confirmed',
      `${link.parent?.firstName} ${link.parent?.lastName} can now view ${link.student?.firstName} ${link.student?.lastName}.`,
    );
    return saved;
  }

  private async notifyAdmin(
    schoolId: string | undefined,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    if (!schoolId) {
      return;
    }
    try {
      await this.notificationService.create({
        schoolId,
        type,
        title,
        message,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create admin notification: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

function inputName(parent: Parent) {
  return `${parent.firstName} ${parent.lastName}`.trim();
}
