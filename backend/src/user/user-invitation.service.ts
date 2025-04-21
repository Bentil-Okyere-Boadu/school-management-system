import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import { InviteUserDto } from './dto/invite-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserInvitationService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private configService: ConfigService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Initialize nodemailer transporter for sending invitation emails
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.example.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: this.configService.get<boolean>('MAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('MAIL_USER', ''),
        pass: this.configService.get<string>('MAIL_PASSWORD', ''),
      },
    });
  }

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
    console.log('Invite User DTO:', currentUser);
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

    if (role.name !== 'school admin') {
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

    await this.sendInvitationEmail(savedUser);

    return savedUser;
  }

  private async sendInvitationEmail(user: User): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const invitationLink = `${frontendUrl}/auth/complete-registration?token=${user.invitationToken}`;

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'MAIL_FROM',
        'noreply@schoolmanagementsystem.com',
      ),
      to: user.email,
      subject: 'Invitation to School Management System',
      html: `
        <h3>Welcome to the School Management System</h3>
        <p>Dear ${user.name},</p>
        <p>You have been invited to join the School Management System as an administrator. 
           Please click the link below to complete your registration:</p>
        <p><a href="${invitationLink}">Complete Registration</a></p>
        <p>This invitation link will expire in 24 hours.</p>
        <p>If you did not request this invitation, please ignore this email.</p>
      `,
    });
  }

  async verifyInvitationToken(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { invitationToken: token, status: 'pending' },
      relations: ['role', 'school'],
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    if (user.invitationExpires < new Date()) {
      throw new BadRequestException('Invitation token has expired');
    }

    return user;
  }

  async completeRegistration(token: string, password: string): Promise<User> {
    const user = await this.verifyInvitationToken(token);
    const hashPassword = await bcrypt.hash(password, 10);

    user.password = hashPassword;
    user.status = 'active';
    user.isInvitationAccepted = true;
    user.invitationToken = '';
    user.invitationExpires = new Date(0);

    return this.userRepository.save(user);
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

    await this.sendInvitationEmail(updatedUser);

    return updatedUser;
  }
}
