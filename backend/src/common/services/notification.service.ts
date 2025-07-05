import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

/**
 * Unified notification service that handles both email and SMS notifications
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  /**
   * Send admission application confirmation via both email and SMS
   */
  async sendAdmissionApplicationConfirmation(
    email: string,
    phone: string,
    name: string,
    schoolName: string,
    applicationId: string,
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send email notification
    if (email) {
      promises.push(
        this.emailService
          .sendAdmissionApplicationConfirmation(
            email,
            name,
            schoolName,
            applicationId,
          )
          .catch((error) => {
            this.logger.error(
              `Failed to send admission confirmation email to ${email}`,
              error,
            );
          }),
      );
    }

    // Send SMS notification
    if (phone) {
      promises.push(
        this.smsService
          .sendAdmissionApplicationConfirmationSms(
            phone,
            name,
            schoolName,
            applicationId,
          )
          .catch((error) => {
            this.logger.error(
              `Failed to send admission confirmation SMS to ${phone}`,
              error,
            );
          }),
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send interview invitation via both email and SMS
   */
  async sendInterviewInvitation(
    email: string,
    phone: string,
    name: string,
    schoolName: string,
    applicationId: string,
    interviewDate: string,
    interviewTime: string,
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send email notification
    if (email) {
      promises.push(
        this.emailService
          .sendInterviewInvitation(
            email,
            name,
            schoolName,
            applicationId,
            interviewDate,
            interviewTime,
          )
          .catch((error) => {
            this.logger.error(
              `Failed to send interview invitation email to ${email}`,
              error,
            );
          }),
      );
    }

    // Send SMS notification
    if (phone) {
      promises.push(
        this.smsService
          .sendInterviewInvitationSms(
            phone,
            name,
            schoolName,
            applicationId,
            interviewDate,
            interviewTime,
          )
          .catch((error) => {
            this.logger.error(
              `Failed to send interview invitation SMS to ${phone}`,
              error,
            );
          }),
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send admission status update via both email and SMS
   */
  async sendAdmissionStatusUpdate(
    status: string,
    email: string,
    phone: string,
    name: string,
    schoolName: string,
    applicationId: string,
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send email notification
    if (email) {
      const emailPromise = (async () => {
        switch (status) {
          case 'Accepted':
            await this.emailService.sendAdmissionAcceptedEmail(
              email,
              name,
              schoolName,
              applicationId,
            );
            break;
          case 'Rejected':
            await this.emailService.sendAdmissionRejectedEmail(
              email,
              name,
              schoolName,
              applicationId,
            );
            break;
          case 'Waitlisted':
            await this.emailService.sendAdmissionWaitlistedEmail(
              email,
              name,
              schoolName,
              applicationId,
            );
            break;
          case 'Interview Completed':
            await this.emailService.sendInterviewCompletedEmail(
              email,
              name,
              schoolName,
              applicationId,
            );
            break;
        }
      })().catch((error) => {
        this.logger.error(
          `Failed to send admission status email to ${email}`,
          error,
        );
      });

      promises.push(emailPromise);
    }

    // Send SMS notification
    if (phone) {
      const smsPromise = (async () => {
        switch (status) {
          case 'Accepted':
            await this.smsService.sendAdmissionAcceptedSms(
              phone,
              name,
              schoolName,
              applicationId,
            );
            break;
          case 'Rejected':
            await this.smsService.sendAdmissionRejectedSms(
              phone,
              name,
              schoolName,
              applicationId,
            );
            break;
          case 'Waitlisted':
            await this.smsService.sendAdmissionWaitlistedSms(
              phone,
              name,
              schoolName,
              applicationId,
            );
            break;
          case 'Interview Completed':
            await this.smsService.sendInterviewCompletedSms(
              phone,
              name,
              schoolName,
              applicationId,
            );
            break;
        }
      })().catch((error) => {
        this.logger.error(
          `Failed to send admission status SMS to ${phone}`,
          error,
        );
      });

      promises.push(smsPromise);
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send student invitation via both email and SMS
   */
  async sendStudentInvitation(
    email: string,
    phone: string,
    name: string,
    studentId: string,
    pin: string,
    schoolName: string,
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send email notification
    if (email) {
      promises.push(
        this.emailService
          .sendStudentInvitation(
            {
              email,
              firstName: name.split(' ')[0],
              lastName: name.split(' ')[1] || '',
            } as any,
            studentId,
            pin,
          )
          .catch((error) => {
            this.logger.error(
              `Failed to send student invitation email to ${email}`,
              error,
            );
          }),
      );
    }

    // Send SMS notification
    if (phone) {
      promises.push(
        this.smsService
          .sendStudentInvitationSms(phone, name, studentId, pin, schoolName)
          .catch((error) => {
            this.logger.error(
              `Failed to send student invitation SMS to ${phone}`,
              error,
            );
          }),
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send custom notification via both email and SMS
   */
  async sendCustomNotification(
    email: string,
    phone: string,
    name: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send email notification
    if (email) {
      promises.push(
        this.emailService
          .sendNotificationEmail(email, subject, {
            name,
            message,
          })
          .catch((error) => {
            this.logger.error(
              `Failed to send custom notification email to ${email}`,
              error,
            );
          }),
      );
    }

    // Send SMS notification
    if (phone) {
      promises.push(
        this.smsService
          .sendNotificationSms(phone, name, message)
          .catch((error) => {
            this.logger.error(
              `Failed to send custom notification SMS to ${phone}`,
              error,
            );
          }),
      );
    }

    await Promise.allSettled(promises);
  }
} 