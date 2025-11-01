# Orphaned Users Solution

## Problem Description

Previously, when email sending failed during user invitation (super admin inviting school admin, school admin inviting teachers/students), the system would create orphaned users in a pending state. These users would remain in the database even though the invitation email was never sent, leading to:

1. **Data inconsistency** - Users exist in the database but never received invitations
2. **Database bloat** - Accumulation of unused pending users
3. **User confusion** - Potential duplicate invitations if retried
4. **System performance** - Unnecessary database queries and storage

## Solution Overview

The solution implements a comprehensive approach to handle email failures during user invitations:

### 1. Database Transactions

- **Transaction Wrapper**: `TransactionUtil` class provides a clean way to execute operations within database transactions
- **Automatic Rollback**: If email sending fails, the entire transaction (including user creation) is rolled back
- **Data Consistency**: Ensures that users are only created when emails are successfully sent

### 2. Email Retry Mechanism

- **Retry Service**: `EmailRetryService` implements exponential backoff for failed email attempts
- **Configurable Retries**: Maximum of 3 retry attempts with increasing delays
- **Comprehensive Logging**: Detailed logging of retry attempts and failures

### 3. Cleanup Services

- **Automatic Cleanup**: `ScheduledCleanupService` runs daily to clean up orphaned users
- **Manual Cleanup**: `CleanupController` provides endpoints for manual cleanup operations
- **Statistics**: Monitoring and reporting of pending user statistics

### 4. Enhanced Error Handling

- **Proper Exception Handling**: All invitation methods now properly handle email failures
- **Transaction Rollback**: Automatic rollback when email sending fails
- **Detailed Logging**: Comprehensive logging for debugging and monitoring

## Implementation Details

### Files Created/Modified

#### New Files:

1. `src/common/utils/transaction.util.ts` - Database transaction wrapper
2. `src/common/services/cleanup.service.ts` - Cleanup service for orphaned users
3. `src/common/services/scheduled-cleanup.service.ts` - Scheduled cleanup tasks
4. `src/common/controllers/cleanup.controller.ts` - Manual cleanup endpoints
5. `src/common/services/email-retry.service.ts` - Email retry mechanism

#### Modified Files:

1. `src/invitation/invitation.service.ts` - Updated all invitation methods to use transactions
2. `src/common/common.module.ts` - Added new services and controllers

### Key Features

#### 1. Transaction-Based Invitations

```typescript
async inviteAdmin(inviteUserDto: InviteUserDto, currentUser: SuperAdmin): Promise<SchoolAdmin> {
  return this.transactionUtil.executeInTransaction(async (manager: EntityManager) => {
    // Create user
    const savedAdmin = await manager.save(SchoolAdmin, newAdmin);

    try {
      await this.emailService.sendInvitationEmail(savedAdmin);
    } catch (error) {
      // Transaction automatically rolls back
      throw new InvitationException('Failed to send email');
    }

    return savedAdmin;
  });
}
```

#### 2. Automatic Cleanup

- **Daily at 2 AM**: Cleanup of orphaned users (pending for more than 7 days)
- **Hourly**: Cleanup of expired invitation tokens
- **Daily at 6 AM**: Logging of pending user statistics

#### 3. Manual Cleanup Endpoints

- `POST /cleanup/orphaned-users` - Manually trigger orphaned user cleanup
- `POST /cleanup/expired-tokens` - Manually trigger expired token cleanup
- `GET /cleanup/stats` - Get pending user statistics

#### 4. Email Retry Mechanism

```typescript
async retrySendInvitationEmail(admin: SchoolAdmin, retryCount: number = 0): Promise<void> {
  try {
    await this.emailService.sendInvitationEmail(admin);
  } catch (error) {
    if (retryCount < this.maxRetries) {
      await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      return this.retrySendInvitationEmail(admin, retryCount + 1);
    } else {
      throw error;
    }
  }
}
```

## Benefits

### 1. Data Integrity

- **No Orphaned Users**: Users are only created when emails are successfully sent
- **Consistent State**: Database remains in a consistent state even during failures
- **Atomic Operations**: All-or-nothing approach to user creation and email sending

### 2. System Reliability

- **Automatic Recovery**: Failed operations are automatically rolled back
- **Retry Mechanism**: Temporary email failures are handled with retries
- **Monitoring**: Comprehensive logging and statistics for system health

### 3. Maintenance

- **Automatic Cleanup**: Scheduled cleanup prevents database bloat
- **Manual Control**: Administrators can trigger cleanup operations manually
- **Statistics**: Monitoring of pending users and system health

### 4. User Experience

- **No Duplicate Users**: Prevents creation of multiple pending users for the same email
- **Reliable Invitations**: Users only receive invitations when the system is confident they can be delivered
- **Clear Error Messages**: Proper error handling and user feedback

## Usage

### Automatic Operations

The system automatically handles:

- Transaction rollback on email failures
- Daily cleanup of orphaned users
- Hourly cleanup of expired tokens
- Statistics logging

### Manual Operations

Super admins can manually trigger:

```bash
# Clean up orphaned users
POST /cleanup/orphaned-users

# Clean up expired tokens
POST /cleanup/expired-tokens

# Get statistics
GET /cleanup/stats
```

### Monitoring

Check logs for:

- Transaction rollbacks
- Email retry attempts
- Cleanup operations
- System statistics

## Configuration

### Environment Variables

No additional environment variables are required. The solution uses existing database and email configurations.

### Scheduling

The cleanup schedule can be modified in `ScheduledCleanupService`:

- Orphaned users: Daily at 2 AM
- Expired tokens: Hourly
- Statistics: Daily at 6 AM

### Retry Configuration

Email retry settings can be modified in `EmailRetryService`:

- `maxRetries`: Maximum number of retry attempts (default: 3)
- `retryDelay`: Base delay between retries in milliseconds (default: 5000)

## Testing

### Test Scenarios

1. **Email Service Down**: Verify transaction rollback
2. **Temporary Email Failure**: Verify retry mechanism
3. **Permanent Email Failure**: Verify proper error handling
4. **Cleanup Operations**: Verify scheduled and manual cleanup
5. **Statistics**: Verify monitoring and reporting

### Manual Testing

1. Disable email service temporarily
2. Attempt to invite a user
3. Verify no user is created in database
4. Re-enable email service
5. Verify successful invitation

## Conclusion

This solution comprehensively addresses the orphaned user problem by:

- Implementing database transactions for atomic operations
- Adding retry mechanisms for temporary failures
- Providing automatic cleanup of orphaned users
- Offering manual control and monitoring capabilities

The system now ensures data integrity while maintaining reliability and providing administrators with the tools needed to monitor and maintain the system effectively.

