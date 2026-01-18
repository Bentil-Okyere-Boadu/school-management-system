# SMS Service Setup Guide

This guide explains how to set up and use the SMS notification service in the School Management System using Arkesel.

## Prerequisites

1. An Arkesel account (sign up at https://arkesel.com)
2. Arkesel API Key
3. A registered Sender ID

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Arkesel Configuration
ARKESEL_API_KEY=your_api_key_here
ARKESEL_SENDER_ID=your_sender_id_here
ARKESEL_API_URL=https://sms.arkesel.com/api/sms/send
```

Note: `ARKESEL_API_URL` is optional and defaults to `https://sms.arkesel.com/api/sms/send` if not provided.

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

1. Ensure your Arkesel credentials are properly configured
2. Use a valid phone number for testing (format: country code + number, e.g., 233XXXXXXXXX for Ghana)
3. Check the application logs for SMS delivery status

## Cost Considerations

- Arkesel charges per SMS sent
- Consider implementing rate limiting for high-volume scenarios
- Monitor your Arkesel usage to manage costs
- Check Arkesel dashboard for pricing and balance

## Security Notes

- Never commit Arkesel credentials to version control
- Use environment variables for all sensitive configuration
- Consider implementing phone number validation before sending SMS
- Keep your API key secure and rotate it periodically

## Troubleshooting

### Common Issues

1. **"SMS service not properly configured"**

   - Check that all Arkesel environment variables are set (`ARKESEL_API_KEY` and `ARKESEL_SENDER_ID`)
   - Verify your Arkesel credentials are correct
   - Ensure your Sender ID is registered and approved in your Arkesel dashboard

2. **"Failed to send SMS"**

   - Check your Arkesel account balance
   - Verify the phone number format (should include country code without +, e.g., 233XXXXXXXXX)
   - Check Arkesel dashboard for delivery status
   - Verify your API key has the necessary permissions

3. **SMS not received**
   - Verify the recipient phone number is correct and in the right format
   - Check if the recipient's carrier supports SMS
   - Review Arkesel dashboard logs for delivery status
   - Ensure your Sender ID is approved and active

### Debug Mode

Enable debug logging by setting the log level in your application configuration.
