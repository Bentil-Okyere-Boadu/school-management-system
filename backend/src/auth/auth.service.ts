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
import { FindOptionsWhere, Repository } from 'typeorm';
import { Role } from 'src/role/role.entity';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from 'src/common/services/email.service';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

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
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  generateToken(payload: { [key: string]: string }): string {
    return this.jwtService.sign(payload);
  }

  createAuthResponse(entity: SuperAdmin | SchoolAdmin | User) {
    const payload = {
      email: entity.email,
      sub: entity.id,
      role: entity.role?.name,
    };

    return {
      access_token: this.generateToken(payload),
      ...entity,
    };
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

    return this.login(user);
  }

  async handleForgotPassword<
    T extends {
      email: string;
      resetPasswordToken: string;
      resetPasswordExpires: Date;
    },
  >(email: string, repository: Repository<T>) {
    const successResponse = {
      success: true,
      message:
        'If your email exists in our system, you will receive a password reset link',
    };

    const user = await repository.findOne({
      where: { email } as FindOptionsWhere<T>,
    });

    if (!user) {
      return successResponse;
    }

    const resetToken = uuidv4();
    const resetTokenExpires = new Date();
    resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 30);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await repository.save(user);

    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending email:', error);
    }

    return successResponse;
  }

  async handleResetPassword<
    T extends {
      resetPasswordToken: string | null;
      resetPasswordExpires: Date | null;
      password: string;
    },
  >(
    token: string,
    newPassword: string,
    repository: Repository<T>,
  ): Promise<{ success: boolean; message: string }> {
    const userWithToken = await repository.findOne({
      where: { resetPasswordToken: token } as FindOptionsWhere<T>,
    });

    if (!userWithToken) {
      this.logger.error(
        `Password reset failed: Token not found in database: ${token}`,
      );
      throw new UnauthorizedException('Invalid token - token not found');
    }

    const expiryTimestamp = userWithToken.resetPasswordExpires?.getTime();
    const currentTimestamp = Date.now();

    if (!expiryTimestamp || expiryTimestamp <= currentTimestamp) {
      this.logger.error('Password reset failed: Token expired');
      throw new UnauthorizedException(
        'Expired token - please request a new password reset',
      );
    }

    userWithToken.password = await this.hashPassword(newPassword);
    userWithToken.resetPasswordToken = null;
    userWithToken.resetPasswordExpires = null;

    await repository.save(userWithToken);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }
}
