import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser?: User) {
    const { password, role: roleName } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the role
    const role = await this.roleRepo.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    // Create new user
    const user = this.userRepo.create({
      ...createUserDto,
      password: hashedPassword,
      role,
    });

    // If creating user as school admin, assign to admin's school
    if (
      currentUser &&
      currentUser.role.name === 'admin' &&
      currentUser.school
    ) {
      user.school = currentUser.school;
    }
    // If creating admin as super_admin, check for schoolId in DTO
    else if (roleName === 'admin' && createUserDto['schoolId']) {
      const school = await this.schoolRepo.findOne({
        where: { id: createUserDto['schoolId'] },
      });

      if (!school) {
        throw new Error('School not found');
      }

      user.school = school;
    }

    return this.userRepo.save(user);
  }

  async findAll(currentUser: User) {
    // Super admin can see all users
    if (currentUser.role.name === 'super_admin') {
      return this.userRepo.find({
        relations: ['role', 'school'],
        select: ['id', 'email', 'name', 'role', 'school', 'status'],
      });
    }
    // School admin can only see users from their school
    else if (currentUser.role.name === 'admin' && currentUser.school) {
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
      currentUser.role.name === 'admin' &&
      currentUser.school &&
      user.school &&
      user.school.id === currentUser.school.id
    ) {
      return user;
    }
    // User can see their own details
    else if (user.id === currentUser.id) {
      return user;
    } else {
      throw new UnauthorizedException(
        'You do not have permission to access this user',
      );
    }
  }
}
