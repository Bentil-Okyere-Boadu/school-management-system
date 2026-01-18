import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { CleanupService } from '../services/cleanup.service';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

/**
 * Controller for manual cleanup operations
 * Only accessible by super admins
 */
@Controller('cleanup')
@UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(Role.SuperAdmin)
export class CleanupController {
  constructor(private cleanupService: CleanupService) {}

  /**
   * Manually trigger cleanup of orphaned users
   */
  @Post('orphaned-users')
  async cleanupOrphanedUsers() {
    return this.cleanupService.cleanupOrphanedUsers();
  }

  /**
   * Manually trigger cleanup of expired tokens
   */
  @Post('expired-tokens')
  async cleanupExpiredTokens() {
    return this.cleanupService.cleanupExpiredTokens();
  }

  /**
   * Get statistics about pending users
   */
  @Get('stats')
  async getPendingUsersStats() {
    return this.cleanupService.getPendingUsersStats();
  }
}

