import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { EntityManager, LessThan, Repository } from 'typeorm';
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
import { EmailRetryService } from 'src/common/services/email-retry.service';
import { EmailService } from 'src/common/services/email.service';
import { NotificationService } from 'src/notification/notification.service';
import { TenantDirectoryService } from 'src/tenant/tenant-directory.service';
import { NotificationType } from 'src/notification/notification.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { TenantIterationService } from 'src/tenant/tenant-iteration.service';
import {
  PlatformPreloginTokenService,
  ResolvedPreloginToken,
} from 'src/tenant/platform-prelogin-token.service';

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
    private readonly emailRetry: EmailRetryService,
    private readonly notificationService: NotificationService,
    private readonly tenantDirectory: TenantDirectoryService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly tenantIteration: TenantIterationService,
    private readonly preloginTokens: PlatformPreloginTokenService,
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

    if (parent.email && student.school?.id) {
      await this.tenantDirectory.upsert({
        loginKey: parent.email,
        userType: 'parent',
        schoolId: student.school.id,
        tenantUserId: parent.id,
      });
    }

    let relationship = await this.parentStudentRepository.findOne({
      where: { parent: { id: parent.id }, student: { id: student.id } },
      relations: ['parent', 'student', 'school'],
    });

    let shouldNotify = false;

    if (relationship?.status === ParentStudentStatus.Revoked) {
      relationship.status = ParentStudentStatus.PendingConfirmation;
      relationship.relationship =
        input.relationship ?? relationship.relationship;
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
      const existing = await this.findParentForLinking(
        student.school.id,
        email,
      );
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
    const resolved = await this.preloginTokens.claimForUse(
      token,
      'parent_invitation',
    );
    if (resolved.userType !== 'parent') {
      await this.preloginTokens
        .releaseClaim(token, 'parent_invitation')
        .catch(() => undefined);
      throw new BadRequestException('Invalid or expired invitation');
    }

    let parent: Parent | null;
    try {
      parent = await this.tenantConnection.runForSchoolId(
        resolved.schoolId,
        (manager) =>
          this.completeParentInvitationInTenant(
            manager,
            resolved,
            token,
            password,
          ),
      );
    } catch (error) {
      await this.preloginTokens
        .releaseClaim(token, 'parent_invitation')
        .catch(() => undefined);
      throw error;
    }

    if (!parent) {
      await this.preloginTokens
        .releaseClaim(token, 'parent_invitation')
        .catch(() => undefined);
      throw new BadRequestException('Invalid or expired invitation');
    }

    try {
      await this.tenantConnection.runForSchoolId(
        resolved.schoolId,
        async (manager) => {
          await this.sendQueuedConfirmations(parent!, manager);
          await this.notifyAdmin(
            resolved.schoolId,
            NotificationType.ParentAccepted,
            'Parent invitation accepted',
            `${parent!.firstName} ${parent!.lastName} accepted the parent portal invitation.`,
          );
        },
      );
    } catch (error) {
      this.logger.error(
        `Parent invitation post-activation side effects failed for parent ${parent.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return parent;
  }

  private async completeParentInvitationInTenant(
    manager: EntityManager,
    resolved: ResolvedPreloginToken,
    token: string,
    password: string,
  ): Promise<Parent | null> {
    const parentRepo = manager.getRepository(Parent);
    const parentStudentRepo = manager.getRepository(ParentStudent);
    const parent = await parentRepo.findOne({
      where: { id: resolved.subjectId },
    });

    if (!parent) {
      return null;
    }

    if (parent.status === ParentAccountStatus.Active) {
      if (parent.password && (await bcrypt.compare(password, parent.password))) {
        return parent;
      }
      throw new BadRequestException(
        'Parent account is already active. Please log in or use forgot password.',
      );
    }

    if (parent.status !== ParentAccountStatus.Pending) {
      return null;
    }

    if (parent.invitationToken && parent.invitationToken !== token) {
      this.logger.warn(
        `Parent invitation token mismatch for parent ${parent.id} in school ${resolved.schoolId}; using platform token`,
      );
    }

    parent.password = await bcrypt.hash(password, 10);
    parent.status = ParentAccountStatus.Active;
    parent.isInvitationAccepted = true;
    parent.invitationToken = '';
    parent.invitationExpires = new Date(0);
    await parentRepo.save(parent);

    const originating = await parentStudentRepo.find({
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
      await parentStudentRepo.save(first);
    }

    const extras = originating.slice(1);
    for (const extra of extras) {
      extra.status = ParentStudentStatus.PendingConfirmation;
      await parentStudentRepo.save(extra);
    }

    return parent;
  }

  async confirmChildByToken(token: string) {
    const resolved = await this.preloginTokens.claimForUse(
      token,
      'child_confirmation',
    );

    try {
      const link = await this.tenantConnection.runForSchoolId(
        resolved.schoolId,
        () =>
          this.parentStudentRepository.findOne({
            where: { id: resolved.subjectId, confirmationToken: token },
            relations: ['parent', 'parent.school', 'student', 'school'],
          }),
      );

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

      return this.tenantConnection.runForSchoolId(resolved.schoolId, () =>
        this.activateRelationship(link),
      );
    } catch (error) {
      await this.preloginTokens
        .releaseClaim(token, 'child_confirmation')
        .catch(() => undefined);
      throw error;
    }
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
    const savedParent = await this.parentRepository.save(parent);
    await this.registerParentInvitationToken(savedParent);
    const originating = await this.parentStudentRepository.findOne({
      where: { parent: { id: parent.id }, status: ParentStudentStatus.Pending },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
    const delivered = await this.deliverParentInvitationEmail(
      savedParent,
      originating?.student ?? null,
      savedParent.school?.id,
    );
    if (!delivered) {
      throw new BadRequestException(
        'Could not send invitation email. Check mail settings and try again.',
      );
    }
    return savedParent;
  }

  async notifyExpiredParentInvitations(): Promise<number> {
    let notified = 0;
    await this.tenantIteration.forEachActiveSchool(async (schoolId) => {
      notified += await this.tenantConnection.runForSchoolId(
        schoolId,
        (manager) => this.notifyExpiredParentInvitationsInTenant(manager, schoolId),
      );
    });
    return notified;
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
      const savedParent = await this.parentRepository.save(parent);
      await this.registerParentInvitationToken(savedParent);
      await this.parentStudentRepository.save(relationship);
      const delivered = await this.deliverParentInvitationEmail(
        savedParent,
        student,
        student.school.id,
      );
      if (delivered) {
        await this.notifyAdmin(
          student.school.id,
          NotificationType.ParentInvitation,
          'Parent invitation sent',
          `Parent invitation sent — ${parent.firstName} ${parent.lastName} has been invited to access the parent portal for ${student.firstName} ${student.lastName}.`,
        );
      }
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

  private async sendQueuedConfirmations(
    parent: Parent,
    manager?: EntityManager,
  ) {
    const parentStudentRepo = manager
      ? manager.getRepository(ParentStudent)
      : this.parentStudentRepository;
    const queued = await parentStudentRepo.find({
      where: {
        parent: { id: parent.id },
        status: ParentStudentStatus.PendingConfirmation,
      },
      relations: ['student', 'school', 'parent'],
    });
    for (const link of queued) {
      await this.sendChildConfirmation(parent, link, manager);
    }
  }

  private async sendChildConfirmation(
    parent: Parent,
    link: ParentStudent,
    manager?: EntityManager,
  ) {
    if (!parent.email) {
      return;
    }
    const parentStudentRepo = manager
      ? manager.getRepository(ParentStudent)
      : this.parentStudentRepository;
    link.confirmationToken = this.generateToken();
    link.confirmationExpires = this.tokenExpiry();
    await parentStudentRepo.save(link);
    const schoolId = link.school?.id ?? link.parent?.school?.id;
    if (schoolId) {
      await this.preloginTokens.register({
        token: link.confirmationToken,
        schoolId,
        userType: 'parent',
        purpose: 'child_confirmation',
        subjectId: link.id,
        expiresAt: link.confirmationExpires,
      });
    }
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

  private async registerParentInvitationToken(parent: Parent): Promise<void> {
    if (!parent.invitationToken || !parent.invitationExpires) {
      return;
    }

    let schoolId: string | undefined = parent.school?.id;
    if (!schoolId) {
      const reloaded = await this.parentRepository.findOne({
        where: { id: parent.id },
        relations: ['school'],
      });
      schoolId = reloaded?.school?.id;
    }
    if (!schoolId) {
      this.logger.warn(
        `Cannot register parent prelogin token: missing school for parent ${parent.id}`,
      );
      return;
    }

    await this.preloginTokens.register({
      token: parent.invitationToken,
      schoolId,
      userType: 'parent',
      purpose: 'parent_invitation',
      subjectId: parent.id,
      expiresAt: parent.invitationExpires,
    });
  }

  private async notifyExpiredParentInvitationsInTenant(
    manager: EntityManager,
    schoolId: string,
  ): Promise<number> {
    const parentRepo = manager.getRepository(Parent);
    const linkRepo = manager.getRepository(ParentStudent);
    const now = new Date();
    const expiredParents = await parentRepo.find({
      where: {
        status: ParentAccountStatus.Pending,
        invitationExpires: LessThan(now),
      },
    });

    let notified = 0;
    for (const parent of expiredParents) {
      if (!parent.email || !parent.invitationExpires) {
        continue;
      }

      const link = await linkRepo.findOne({
        where: {
          parent: { id: parent.id },
          status: ParentStudentStatus.Pending,
        },
        relations: ['student'],
        order: { createdAt: 'ASC' },
      });
      const studentName = link?.student
        ? `${link.student.firstName} ${link.student.lastName}`
        : 'a student';

      await this.notifyAdmin(
        schoolId,
        NotificationType.ParentInvitationExpired,
        'Parent invitation expired',
        `The portal invitation for ${parent.firstName} ${parent.lastName} (${parent.email}) linked to ${studentName} has expired. Resend the invitation from the student profile.`,
      );

      parent.invitationExpires = null;
      await parentRepo.save(parent);
      notified += 1;
    }

    return notified;
  }

  private async deliverParentInvitationEmail(
    parent: Parent,
    student: Student | null,
    schoolId: string | undefined,
  ): Promise<boolean> {
    try {
      await this.emailRetry.retrySendParentInvitation(parent, student);
      return true;
    } catch (error) {
      this.logger.error(
        `Parent invitation email failed for ${parent.email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const studentName = student
        ? `${student.firstName} ${student.lastName}`
        : 'a student';
      await this.notifyAdmin(
        schoolId,
        NotificationType.ParentInvitationFailed,
        'Parent invitation email failed',
        `Could not deliver the portal invitation to ${parent.firstName} ${parent.lastName} (${parent.email}) for ${studentName}. Resend the invitation from the student profile after checking the email address.`,
      );
      return false;
    }
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
