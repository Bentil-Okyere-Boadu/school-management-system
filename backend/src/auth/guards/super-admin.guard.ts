import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SuperAdminService } from '../../super-admin/super-admin.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private superAdminService: SuperAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.email) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if the user is a super admin
    try {
      const superAdmin = await this.superAdminService.findByEmail(user.email);

      if (!superAdmin || superAdmin.status !== 'active') {
        throw new ForbiddenException(
          'Only Super Admins can access this resource',
        );
      }

      // Add the super admin to the request for convenience
      request.superAdmin = superAdmin;
      return true;
    } catch (error) {
      throw new ForbiddenException(
        'Only Super Admins can access this resource',
      );
    }
  }
}
