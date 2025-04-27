import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import { InviteUserDto } from './dto/invite-user.dto';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../common/services/email.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserInvitationService {
  private readonly logger = new Logger(UserInvitationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a random invitation token
   */
  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate token expiration date (24 hours from now)
   */
  private calculateTokenExpiration(): Date {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate;
  }

  async inviteUser(
    inviteUserDto: InviteUserDto,
    currentUser: User,
  ): Promise<User> {
    if (currentUser.role.name !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can invite users');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: inviteUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const role = await this.roleRepository.findOneBy({
      id: inviteUserDto.roleId,
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.name !== 'school_admin') {
      throw new BadRequestException('Super admins can only invite admin users');
    }

    const school = await this.schoolRepository.findOneBy({
      id: inviteUserDto.schoolId,
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Create the invitation token and set expiration
    const invitationToken = this.generateInvitationToken();
    const invitationExpires = this.calculateTokenExpiration();

    // Create the user in pending state
    const newUser = this.userRepository.create({
      name: inviteUserDto.name,
      email: inviteUserDto.email,
      role,
      school,
      status: 'pending',
      invitationToken,
      invitationExpires,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Send invitation email using the EmailService
    await this.emailService.sendInvitationEmail(savedUser);

    return savedUser;
  }

  async verifyInvitationToken(token: string): Promise<User> {
    this.logger.log(`Verifying invitation token: ${token}`);

    const user = await this.userRepository.findOne({
      where: { invitationToken: token, status: 'pending' },
      relations: ['role', 'school'],
    });

    if (!user) {
      this.logger.error(`Invalid invitation token - no user found with token: ${token}`);
      throw new BadRequestException('Invalid invitation token - token not found');
    }

    this.logger.log(`Found user with token: ${user.email}`);
    this.logger.log(`Token expiration: ${user.invitationExpires.toISOString()}`);
    this.logger.log(`Current time: ${new Date().toISOString()}`);

    const expiryTimestamp = user.invitationExpires.getTime();
    const currentTimestamp = Date.now();

    this.logger.log(`Expiry timestamp: ${expiryTimestamp}`);
    this.logger.log(`Current timestamp: ${currentTimestamp}`);
    this.logger.log(`Is token expired? ${expiryTimestamp <= currentTimestamp}`);

    if (expiryTimestamp <= currentTimestamp) {
      this.logger.error(`Invitation token expired for user: ${user.email}`);
      throw new BadRequestException('Invitation token has expired - please request a new invitation');
    }

    return user;
  }

  async completeRegistration(token: string, password: string): Promise<User> {
    this.logger.log(`Processing registration completion for token: ${token}`);
    
    const user = await this.verifyInvitationToken(token);
    this.logger.log(`Invitation token verified for user: ${user.email}`);
    
    const hashPassword = await bcrypt.hash(password, 10);

    user.password = hashPassword;
    user.status = 'active';
    user.isInvitationAccepted = true;
    user.invitationToken = '';
    user.invitationExpires = new Date(0);

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`Registration completed successfully for user: ${savedUser.email}`);

    // Send registration confirmation email
    await this.emailService.sendRegistrationConfirmationEmail(savedUser);
    this.logger.log(`Registration confirmation email sent to: ${savedUser.email}`);

    return savedUser;
  }

  async resendInvitation(userId: string, currentUser: User): Promise<User> {
    if (currentUser.role.name !== 'super_admin') {
      throw new UnauthorizedException(
        'Only super admins can resend invitations',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, status: 'pending' },
      relations: ['role', 'school'],
    });

    if (!user) {
      throw new NotFoundException('Pending user not found');
    }

    user.invitationToken = this.generateInvitationToken();
    user.invitationExpires = this.calculateTokenExpiration();

    const updatedUser = await this.userRepository.save(user);

    // Send invitation email using the EmailService
    await this.emailService.sendInvitationEmail(updatedUser);

    return updatedUser;
  }
}
