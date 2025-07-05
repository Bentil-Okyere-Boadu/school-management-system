# SMS Service Setup Guide

This guide explains how to set up and use the SMS notification service in the School Management System.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. Twilio Account SID and Auth Token
3. A Twilio phone number

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

## Features

The SMS service provides the following notification types:

### Admission Notifications

- **Application Confirmation**: Sent when a student submits an admission application
- **Interview Invitation**: Sent when an interview is scheduled
- **Admission Accepted**: Sent when an application is accepted
- **Admission Rejected**: Sent when an application is rejected
- **Admission Waitlisted**: Sent when an application is waitlisted
- **Interview Completed**: Sent when an interview is completed

### User Management Notifications

- **Student Invitation**: Sent when a student account is created
- **Teacher Invitation**: Sent when a teacher account is created
- **Password Reset**: Sent when a password reset is requested
- **PIN Reset**: Sent when a student/teacher PIN is reset

## Usage Examples

### Sending SMS Notifications

The SMS service is automatically integrated into the admission workflow. When you:

1. **Create an admission application**: SMS confirmation is sent if a phone number is provided
2. **Send interview invitations**: SMS invitation is sent alongside email
3. **Update admission status**: SMS notification is sent for status changes (accepted, rejected, waitlisted, interview completed)
4. **Create student accounts**: SMS invitation with credentials is sent

### Manual SMS Sending

You can also send SMS notifications manually in your services:

```typescript
import { SmsService } from 'src/common/services/sms.service';

@Injectable()
export class YourService {
  constructor(private smsService: SmsService) {}

  async sendCustomNotification() {
    try {
      await this.smsService.sendNotificationSms(
        '+1234567890',
        'John Doe',
        'Your custom notification message here.',
      );
    } catch (error) {
      // Handle error
    }
  }
}
```

## SMS Templates

The service includes predefined templates for common notifications. You can customize these in `src/common/services/sms.service.ts`:

```typescript
private getSmsTemplate(template: SmsTemplate, data: any): string {
  switch (template) {
    case SmsTemplate.ADMISSION_ACCEPTED:
      return `Congratulations ${data.name}! Your admission to ${data.school} has been accepted (ID: ${data.applicationId}). Welcome to our school family!`;
    // ... other templates
  }
}
```

## Error Handling

The SMS service includes comprehensive error handling:

- SMS failures are logged but don't interrupt the main application flow
- Each SMS attempt is wrapped in try-catch blocks
- Failed SMS attempts are logged with detailed error information

## Testing

To test the SMS service:

1. Ensure your Twilio credentials are properly configured
2. Use a valid phone number for testing
3. Check the application logs for SMS delivery status

## Cost Considerations

- Twilio charges per SMS sent
- Consider implementing rate limiting for high-volume scenarios
- Monitor your Twilio usage to manage costs

## Security Notes

- Never commit Twilio credentials to version control
- Use environment variables for all sensitive configuration
- Consider implementing phone number validation before sending SMS

## Troubleshooting

### Common Issues

1. **"SMS service not properly configured"**

   - Check that all Twilio environment variables are set
   - Verify your Twilio credentials are correct

2. **"Failed to send SMS"**

   - Check your Twilio account balance
   - Verify the phone number format (should include country code)
   - Check Twilio console for delivery status

3. **SMS not received**
   - Verify the recipient phone number is correct
   - Check if the recipient's carrier supports SMS
   - Review Twilio logs for delivery status

### Debug Mode

Enable debug logging by setting the log level in your application configuration.
