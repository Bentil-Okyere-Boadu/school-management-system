import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import { sanitize } from '../common/utils/sanitizer.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
  ) {}

  async findAll(currentUser: User) {
    // Super admin can see all users
    if (currentUser.role.name === 'super_admin') {
      return this.userRepo.find({
        relations: ['role', 'school'],
        select: ['id', 'email', 'name', 'role', 'school', 'status'],
      });
    }
    // School admin can only see users from their school
    else if (currentUser.role.name === 'school_admin' && currentUser.school) {
      return this.userRepo.find({
        where: { school: { id: currentUser.school.id } },
        relations: ['role', 'school'],
        select: ['id', 'email', 'name', 'role', 'school', 'status'],
      });
    } else {
      throw new UnauthorizedException(
        'You do not have permission to access user list',
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role', 'school'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Super admin can see any user
    if (currentUser.role.name === 'super_admin') {
      return user;
    }
    // School admin can only see users from their school
    else if (
      currentUser.role.name === 'school_admin' &&
      currentUser.school &&
      user.school &&
      user.school.id === currentUser.school.id
    ) {
      const { password: _password, ...safeUser } = user;
      return safeUser;
    }
    // User can see their own details
    else if (user.id === currentUser.id) {
      const { password: _password, ...safeUser } = user;
      return safeUser;
    } else {
      throw new UnauthorizedException(
        'You do not have permission to access this user',
      );
    }
  }

  /**
   * Get a user by ID with sensitive information removed
   * @param id The user ID to find
   * @returns Sanitized user object
   */
  async getUserSanitized(id: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role', 'school'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return sanitize(user);
  }
}
