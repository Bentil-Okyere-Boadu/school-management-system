import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from 'src/role/role.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, roleId } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = await this.roleRepo.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      role,
    });

    return this.userRepo.save(user);
  }
  async findAll() {
    //TODO: return users depending on role e.g admin sees users from their school
    return this.userRepo.find({
      relations: ['role'],
      select: ['id', 'email', 'name', 'role'],
    });
  }
}
