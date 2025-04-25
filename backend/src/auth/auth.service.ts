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
import { MoreThan, Repository } from 'typeorm';
import { Role } from 'src/role/role.entity';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from 'src/common/services/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

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

  async validateUserByCredentials(pin: string, identifier?: string) {
    const user = await this.userRepository.findOne({
      where: [
        { studentId: identifier },
        { teacherId: identifier },
        { email: identifier },
      ],
      relations: ['role', 'school'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPin = await bcrypt.compare(pin, user.password);

    if (!isValidPin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'pending') {
      user.status = 'active';
      user.isInvitationAccepted = true;
      await this.userRepository.save(user);
      this.logger.log(
        `User ${user.name} activated their account on first login`,
      );
    }
    return user;
  }

  login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role.name };

    return {
      access_token: this.jwtService.sign(payload),
      ...user,
    };
  }

  async loginWithCredentials(pin: string, identifier?: string) {
    const user = await this.validateUserByCredentials(pin, identifier);

    return this.login(user);
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

    let role: Role | null;
    if (createUserDto.roleId) {
      role = await this.roleRepository.findOne({
        where: { id: createUserDto.roleId },
      });
      if (!role) {
        throw new NotFoundException(
          `Role with ID ${createUserDto.roleId} not found`,
        );
      }
    } else {
      // Fallback to role name for backward compatibility
      const roleName = createUserDto.role || 'super_admin';
      role = await this.roleRepository.findOne({
        where: { name: roleName },
      });
      if (!role) {
        throw new NotFoundException(`Role '${roleName}' not found`);
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      status: 'active',
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

    const resetToken = uuidv4();
    const resetTokenExpires = new Date();
    resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 30);
    // Store token with 30min expiry
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await this.userRepository.save(user);

    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      // Still return success message for security
    }

    return successResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Hash and update the new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear the reset token fields
    user.resetPasswordToken = null as unknown as string;
    user.resetPasswordExpires = null as unknown as Date;

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }
}
