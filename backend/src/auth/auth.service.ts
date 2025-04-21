import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from 'src/role/role.entity';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Store reset tokens temporarily (in a real app, use a database table)
  private resetTokens: Map<string, { email: string; expiry: Date }> = new Map();
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Initialize nodemailer transporter
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
        port: parseInt(this.configService.get<string>('MAIL_PORT', '587')),
        secure:
          this.configService.get<string>('MAIL_SECURE', 'false') === 'true',
        auth: {
          user: this.configService.get<string>('MAIL_USER', ''),
          pass: this.configService.get<string>('MAIL_PASSWORD', ''),
        },
      });
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'school'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _password, ...result } = user;
    return result;
  }

  login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signupSuperAdmin(createUserDto: CreateUserDto) {
    createUserDto.role = 'super_admin';

    if (!createUserDto.name || createUserDto.name.trim() === '') {
      createUserDto.name = 'Super Admin';
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.roleRepository.findOne({
      where: { name: 'super_admin' },
    });

    if (!role) {
      throw new NotFoundException('Super admin role not found');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role,
    });

    await this.userRepository.save(user);

    // Return login token
    return this.login(user);
  }

  async forgotPassword(email: string) {
    // Always return a generic success message for security
    // to avoid revealing whether an email exists in our system
    const successResponse = {
      success: true,
      message:
        'If your email exists in our system, you will receive a password reset link',
    };

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return successResponse;
    }

    // Generate reset token
    const token = uuidv4();

    // Store token with 1-hour expiry
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    this.resetTokens.set(token, { email, expiry });

    // Get front-end URL from config or use default
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetLink = `${frontendUrl}/auth/forgotPassword/resetPassword?token=${token}`;

    // Send email with reset link
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }
      //TODO: rebuild template to match ui mockup
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'MAIL_FROM',
          'noreply@schoolmanagementsystem.com',
        ),
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h3>Password Reset Request</h3>
          <p>You have requested to reset your password. Please click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending email:', error);
      // Still return success message for security
    }

    return successResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    const resetInfo = this.resetTokens.get(token);

    if (!resetInfo) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (new Date() > resetInfo.expiry) {
      this.resetTokens.delete(token);
      throw new UnauthorizedException('Token has expired');
    }

    const user = await this.userRepository.findOne({
      where: { email: resetInfo.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Delete used token
    this.resetTokens.delete(token);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }
}
