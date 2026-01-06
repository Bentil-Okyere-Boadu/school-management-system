import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseException } from '../exceptions/base.exception';

/**
 * SMS templates
 */
export enum SmsTemplate {
  INVITATION = 'invitation',
  REGISTRATION_CONFIRMATION = 'registration_confirmation',
  PASSWORD_RESET = 'password_reset',
  GENERAL_NOTIFICATION = 'general_notification',
  STUDENT_INVITATION = 'student_invitation',
  TEACHER_INVITATION = 'teacher_invitation',
  STUDENT_PIN_RESET = 'student_pin_reset',
  TEACHER_PIN_RESET = 'teacher_pin_reset',
  ADMISSION_APPLICATION_CONFIRMATION = 'admission_application_confirmation',
  INTERVIEW_INVITATION = 'interview_invitation',
  ADMISSION_ACCEPTED = 'admission_accepted',
  ADMISSION_REJECTED = 'admission_rejected',
  ADMISSION_WAITLISTED = 'admission_waitlisted',
  INTERVIEW_COMPLETED = 'interview_completed',
}

/**
 * SMS service for sending various types of SMS messages using Arkesel
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ARKESEL_API_KEY', '');
    this.senderId = this.configService.get<string>('ARKESEL_SENDER_ID', '');
    this.apiUrl = this.configService.get<string>(
      'ARKESEL_API_URL',
      'https://sms.arkesel.com/api/v2/sms/send',
    );

    if (!this.apiKey || !this.senderId) {
      this.logger.warn('Arkesel credentials not fully configured');
    } else {
      this.logger.log('SMS service (Arkesel) is ready to send messages');
    }
  }

  /**
   * Format phone number for Arkesel (remove + and ensure proper format)
   * @param phoneNumber The phone number to format
   * @returns Formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    let formatted = phoneNumber.trim();
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    return formatted;
  }

  /**
   * Send an SMS message using Arkesel API
   * @param to The recipient phone number
   * @param message The message content
   * @returns Promise resolving to the SMS send info
   */
  async sendSms(to: string, message: string): Promise<void> {
    if (!this.apiKey || !this.senderId) {
      this.logger.error('SMS service not properly configured');
      throw new Error('SMS service not properly configured');
    }

    const formattedPhone = this.formatPhoneNumber(to);

    const data = {
      sender: this.senderId,
      message,
      recipients: [formattedPhone],
    };
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        status: string;
        sms_balance?: number;
        main_balance?: number;
        message_id?: string;
        message?: string;
      };

      if (result.status !== 'success') {
        this.logger.error(`Failed to send SMS to ${to}`, result);
        throw new Error(result.message || 'Arkesel SMS failed');
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
      throw new Error(
        `Failed to send SMS: ${BaseException.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Send an invitation SMS to a new user
   * @param phoneNumber The phone number to send the invitation to
   * @param name The user's name
   * @returns Promise resolving to the SMS send info
   */
  async sendInvitationSms(phoneNumber: string, name: string): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.INVITATION, {
      name,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send a student invitation SMS with credentials
   * @param phoneNumber The student's phone number
   * @param name The student's name
   * @param studentId The generated student ID
   * @param pin The generated PIN
   * @param schoolName The school name
   */
  async sendStudentInvitationSms(
    phoneNumber: string,
    name: string,
    studentId: string,
    pin: string,
    schoolName: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.STUDENT_INVITATION, {
      name,
      studentId,
      pin,
      school: schoolName,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send a teacher invitation SMS with credentials
   * @param phoneNumber The teacher's phone number
   * @param name The teacher's name
   * @param teacherId The generated teacher ID
   * @param pin The generated PIN
   * @param schoolName The school name
   */
  async sendTeacherInvitationSms(
    phoneNumber: string,
    name: string,
    teacherId: string,
    pin: string,
    schoolName: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.TEACHER_INVITATION, {
      name,
      teacherId,
      pin,
      school: schoolName,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send a registration confirmation SMS
   * @param phoneNumber The user's phone number
   * @param name The user's name
   */
  async sendRegistrationConfirmationSms(
    phoneNumber: string,
    name: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.REGISTRATION_CONFIRMATION, {
      name,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send a password reset SMS
   * @param phoneNumber The user's phone number
   * @param resetToken The reset token
   */
  async sendPasswordResetSms(
    phoneNumber: string,
    resetToken: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.PASSWORD_RESET, {
      resetToken,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send a student PIN reset SMS
   * @param phoneNumber The student's phone number
   * @param name The student's name
   * @param pin The new PIN
   */
  async sendStudentPinResetSms(
    phoneNumber: string,
    name: string,
    pin: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.STUDENT_PIN_RESET, {
      name,
      pin,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send a teacher PIN reset SMS
   * @param phoneNumber The teacher's phone number
   * @param name The teacher's name
   * @param pin The new PIN
   */
  async sendTeacherPinResetSms(
    phoneNumber: string,
    name: string,
    pin: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.TEACHER_PIN_RESET, {
      name,
      pin,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send admission application confirmation SMS
   * @param phoneNumber The applicant's phone number
   * @param name The applicant's name
   * @param schoolName The school name
   * @param applicationId The application ID
   */
  async sendAdmissionApplicationConfirmationSms(
    phoneNumber: string,
    name: string,
    schoolName: string,
    applicationId: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(
      SmsTemplate.ADMISSION_APPLICATION_CONFIRMATION,
      {
        name,
        school: schoolName,
        applicationId,
      },
    );

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send interview invitation SMS
   * @param phoneNumber The applicant's phone number
   * @param name The applicant's name
   * @param schoolName The school name
   * @param applicationId The application ID
   * @param interviewDate The interview date
   * @param interviewTime The interview time
   */
  async sendInterviewInvitationSms(
    phoneNumber: string,
    name: string,
    schoolName: string,
    applicationId: string,
    interviewDate: string,
    interviewTime: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.INTERVIEW_INVITATION, {
      name,
      school: schoolName,
      applicationId,
      interviewDate,
      interviewTime,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send admission accepted SMS
   * @param phoneNumber The applicant's phone number
   * @param name The applicant's name
   * @param schoolName The school name
   * @param applicationId The application ID
   */
  async sendAdmissionAcceptedSms(
    phoneNumber: string,
    name: string,
    schoolName: string,
    applicationId: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.ADMISSION_ACCEPTED, {
      name,
      school: schoolName,
      applicationId,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send admission rejected SMS
   * @param phoneNumber The applicant's phone number
   * @param name The applicant's name
   * @param schoolName The school name
   * @param applicationId The application ID
   */
  async sendAdmissionRejectedSms(
    phoneNumber: string,
    name: string,
    schoolName: string,
    applicationId: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.ADMISSION_REJECTED, {
      name,
      school: schoolName,
      applicationId,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send admission waitlisted SMS
   * @param phoneNumber The applicant's phone number
   * @param name The applicant's name
   * @param schoolName The school name
   * @param applicationId The application ID
   */
  async sendAdmissionWaitlistedSms(
    phoneNumber: string,
    name: string,
    schoolName: string,
    applicationId: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.ADMISSION_WAITLISTED, {
      name,
      school: schoolName,
      applicationId,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send interview completed SMS
   * @param phoneNumber The applicant's phone number
   * @param name The applicant's name
   * @param schoolName The school name
   * @param applicationId The application ID
   */
  async sendInterviewCompletedSms(
    phoneNumber: string,
    name: string,
    schoolName: string,
    applicationId: string,
  ): Promise<void> {
    const message = this.getSmsTemplate(SmsTemplate.INTERVIEW_COMPLETED, {
      name,
      school: schoolName,
      applicationId,
    });

    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send a general notification SMS
   * @param phoneNumber The recipient's phone number
   * @param name The recipient's name
   * @param message The notification message
   */
  async sendNotificationSms(
    phoneNumber: string,
    name: string,
    message: string,
  ): Promise<void> {
    const smsMessage = this.getSmsTemplate(SmsTemplate.GENERAL_NOTIFICATION, {
      name,
      message,
    });

    await this.sendSms(phoneNumber, smsMessage);
  }

  /**
   * Get SMS template based on template type and data
   * @param template The template type
   * @param data The data to inject into the template
   * @returns The formatted SMS message
   */
  private getSmsTemplate(
    template: SmsTemplate,
    data: {
      [key: string]: any;
    },
  ): string {
    switch (template) {
      case SmsTemplate.INVITATION:
        return `Hi ${data.name}, you have been invited to join our School Management System. Please check your email for registration details.`;

      case SmsTemplate.REGISTRATION_CONFIRMATION:
        return `Hi ${data.name}, your registration has been confirmed! You can now log in to your account.`;

      case SmsTemplate.PASSWORD_RESET:
        return `Your password reset code is: ${data.resetToken}. This code will expire in 10 minutes.`;

      case SmsTemplate.STUDENT_INVITATION:
        return `Hi ${data.name}, welcome to ${data.school}! Your student account is ready. Student ID: ${data.studentId}, PIN: ${data.pin}. Login at our website.`;

      case SmsTemplate.TEACHER_INVITATION:
        return `Hi ${data.name}, welcome to ${data.school}! Your teacher account is ready. Teacher ID: ${data.teacherId}, PIN: ${data.pin}. Login at our website.`;

      case SmsTemplate.STUDENT_PIN_RESET:
        return `Hi ${data.name}, your new student PIN is: ${data.pin}. Please keep this secure.`;

      case SmsTemplate.TEACHER_PIN_RESET:
        return `Hi ${data.name}, your new teacher PIN is: ${data.pin}. Please keep this secure.`;

      case SmsTemplate.ADMISSION_APPLICATION_CONFIRMATION:
        return `Hi ${data.name}, your admission application to ${data.school} has been received (ID: ${data.applicationId}). We'll review and contact you soon.`;

      case SmsTemplate.INTERVIEW_INVITATION:
        return `Hi ${data.name}, you're invited for an interview at ${data.school} on ${data.interviewDate} at ${data.interviewTime}. Application ID: ${data.applicationId}.`;

      case SmsTemplate.ADMISSION_ACCEPTED:
        return `Congratulations ${data.name}! Your admission to ${data.school} has been accepted (ID: ${data.applicationId}). Welcome to our school family!`;

      case SmsTemplate.ADMISSION_REJECTED:
        return `Hi ${data.name}, we regret to inform you that your admission application to ${data.school} (ID: ${data.applicationId}) was not successful. Thank you for your interest.`;

      case SmsTemplate.ADMISSION_WAITLISTED:
        return `Hi ${data.name}, your admission application to ${data.school} (ID: ${data.applicationId}) has been waitlisted. We'll contact you if a spot becomes available.`;

      case SmsTemplate.INTERVIEW_COMPLETED:
        return `Hi ${data.name}, your interview for ${data.school} (ID: ${data.applicationId}) has been completed. We'll review and contact you with our decision soon.`;

      case SmsTemplate.GENERAL_NOTIFICATION:
        return `Hi ${data.name}, ${data.message}`;

      default:
        return 'You have a new notification from School Management System.';
    }
  }
}
