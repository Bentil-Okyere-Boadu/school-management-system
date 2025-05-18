import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailException } from '../exceptions/email.exception';
import { BaseException } from '../exceptions/base.exception';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';

/**
 * Email templates
 */
export enum EmailTemplate {
  INVITATION = 'invitation',
  REGISTRATION_CONFIRMATION = 'registration_confirmation',
  PASSWORD_RESET = 'password_reset',
  GENERAL_NOTIFICATION = 'general_notification',
  STUDENT_INVITATION = 'student_invitation',
  TEACHER_INVITATION = 'teacher_invitation',
  STUDENT_PIN_RESET = 'student_pin_reset',
  TEACHER_PIN_RESET = 'teacher_pin_reset',
}

/**
 * Email service for sending various types of emails
 */
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    this.fromEmail = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@schoolmanagementsystem.com',
    );
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.example.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: this.configService.get<boolean>('MAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('MAIL_USER', ''),
        pass: this.configService.get<string>('MAIL_PASSWORD', ''),
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Email service configuration error:', error);
      } else {
        this.logger.log('Email service is ready to send messages');
      }
    });
  }

  /**
   * Send an invitation email to a new user
   * @param user The user to send the invitation to
   * @returns Promise resolving to the mail send info
   */
  async sendInvitationEmail(user: SchoolAdmin): Promise<void> {
    const invitationLink = `${this.frontendUrl}/auth/complete-registration?token=${user.invitationToken}`;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: 'Invitation to School Management System',
        html: this.getEmailTemplate(EmailTemplate.INVITATION, {
          name: user.firstName + '' + user.lastName,
          invitationLink,
        }),
      });
      this.logger.log(`Invitation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${user.email}`,
        error,
      );
      throw new EmailException(
        `Failed to send invitation email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendStudentInvitation(
    student: Student,
    studentId: string,
    pin: string,
  ): Promise<void> {
    const loginLink = `${this.frontendUrl}/auth/student/login`;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: student.email,
        subject: 'Your Student Account for School Management System',
        html: this.getEmailTemplate(EmailTemplate.STUDENT_INVITATION, {
          name: student.firstName + ' ' + student.lastName,
          studentId,
          pin,
          loginLink,
          school: student.school?.name || 'your school',
        }),
      });
      this.logger.log(`Student invitation email sent to ${student.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send student invitation email to ${student.email}`,
        error,
      );
      throw new EmailException(
        `Failed to send student invitation email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send an invitation email to a teacher with their credentials
   * @param user The teacher user
   * @param teacherId The generated teacher ID
   * @param pin The generated PIN
   */
  async sendTeacherInvitation(
    user: Teacher,
    teacherId: string,
    pin: string,
  ): Promise<void> {
    const loginLink = `${this.frontendUrl}/auth/teacher/login`;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: 'Your Teacher Account for School Management System',
        html: this.getEmailTemplate(EmailTemplate.TEACHER_INVITATION, {
          name: user.firstName + ' ' + user.lastName,
          teacherId,
          pin,
          loginLink,
          school: user.school?.name || 'your school',
        }),
      });
      this.logger.log(`Teacher invitation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send teacher invitation email to ${user.email}`,
        error,
      );
      throw new EmailException(
        `Failed to send teacher invitation email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send a registration confirmation email
   * @param user The user to send the confirmation to
   * @returns Promise resolving to the mail send info
   */
  async sendRegistrationConfirmationEmail(user: SchoolAdmin): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: 'Registration Confirmed - School Management System',
        html: this.getEmailTemplate(EmailTemplate.REGISTRATION_CONFIRMATION, {
          name: user.firstName + '' + user.lastName,
          loginLink: `${this.frontendUrl}/auth/school-admin/login`,
        }),
      });
      this.logger.log(`Registration confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send registration confirmation email to ${user.email}`,
        error,
      );
      throw new EmailException(
        `Failed to send registration confirmation email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send a password reset email
   * @param user The user
   * @param resetToken The password reset token
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/forgotPassword/resetPassword?token=${resetToken}`;
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Password Reset - School Management System',
        html: this.getEmailTemplate(EmailTemplate.PASSWORD_RESET, {
          resetLink,
        }),
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw new EmailException(
        `Failed to send password reset email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send a general notification email
   * @param to Email address to send to
   * @param subject Email subject
   * @param content Email content
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    content: {
      name: string;
      message: string;
      actionLink?: string;
      actionText?: string;
    },
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html: this.getEmailTemplate(
          EmailTemplate.GENERAL_NOTIFICATION,
          content,
        ),
      });
      this.logger.log(`Notification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${to}`, error);
      throw new EmailException(
        `Failed to send notification email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send PIN reset email to a student
   * @param student The student user
   * @param pin The new PIN
   */
  async sendStudentPinReset(student: Student, pin: string): Promise<void> {
    const loginLink = `${this.frontendUrl}/auth/student/login`;
    const studentId = student.studentId;
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: student.email,
        subject: 'Your PIN Has Been Reset',
        html: this.getEmailTemplate(EmailTemplate.STUDENT_PIN_RESET, {
          name: student.firstName + ' ' + student.lastName,
          studentId,
          pin,
          loginLink,
          school: student.school?.name || 'your school',
        }),
      });
      this.logger.log(`Student PIN reset email sent to ${student.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send student PIN reset email to ${student.email}`,
        error,
      );
      throw new EmailException(
        `Failed to send student PIN reset email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send PIN reset email to a teacher
   * @param user The teacher user
   * @param pin The new PIN
   */
  async sendTeacherPinReset(user: Teacher, pin: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: 'Your PIN Has Been Reset - School Management System',
        html: this.getEmailTemplate(EmailTemplate.TEACHER_PIN_RESET, {
          name: user.firstName + ' ' + user.lastName,
          pin,
          teacherId: user.teacherId,
        }),
      });
      this.logger.log(`Teacher PIN reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send teacher PIN reset email to ${user.email}`,
        error,
      );
      throw new EmailException(
        `Failed to send teacher PIN reset email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get the HTML template for a specific email type
   * @param template The email template to use
   * @param data Data to populate the template with
   * @returns The HTML email content
   */
  private getEmailTemplate(
    template: EmailTemplate,
    data: {
      [key: string]: any;
    },
  ): string {
    switch (template) {
      case EmailTemplate.INVITATION:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to the School Management System</h2>
            <p>Dear ${data.name},</p>
            <p>You have been invited to join the School Management System as an administrator. 
              Please click the link below to complete your registration:</p>
            <p style="margin: 25px 0;">
              <a href="${data.invitationLink}" style="background-color: #AB58E7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Registration</a>
            </p>
            <p>This invitation link will expire in 24 hours.</p>
            <p>If you did not request this invitation, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">School Management System</p>
          </div>
        `;

      case EmailTemplate.STUDENT_INVITATION:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to the School Management System</h2>
            <p>Dear ${data.name},</p>
            <p>You have been registered as a student at ${data.school}. Below are your login credentials:</p>
            
            <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Student ID:</strong> ${data.studentId}</p>
              <p><strong>PIN:</strong> ${data.pin}</p>
            </div>
            
            <p>To log in to the system, please visit the link below and use your Student ID and PIN:</p>
            <p style="margin: 25px 0;">
              <a href="${data.loginLink}" style="background-color: #AB58E7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Login to System</a>
            </p>
            <p><strong>Important:</strong> Please keep your credentials secure and do not share them with others.</p>
            <p>If you have any questions, please contact your school administrator.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">School Management System</p>
          </div>
        `;

      case EmailTemplate.TEACHER_INVITATION:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to the School Management System</h2>
            <p>Dear ${data.name},</p>
            <p>You have been registered as a teacher at ${data.school}. Below are your login credentials:</p>
            
            <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Teacher ID:</strong> ${data.teacherId}</p>
              <p><strong>PIN:</strong> ${data.pin}</p>
            </div>
            
            <p>To log in to the system, please visit the link below and use your Teacher ID and PIN:</p>
            <p style="margin: 25px 0;">
              <a href="${data.loginLink}" style="background-color: #AB58E7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Login to System</a>
            </p>
            <p><strong>Important:</strong> Please keep your credentials secure and do not share them with others.</p>
            <p>If you have any questions, please contact your school administrator.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">School Management System</p>
          </div>
        `;

      case EmailTemplate.REGISTRATION_CONFIRMATION:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Registration Successful!</h2>
            <p>Dear ${data.name},</p>
            <p>Congratulations! Your account has been successfully registered with the School Management System.</p>
            <p>You can now log in to access your account and its features.</p>
            <p style="margin: 25px 0;">
              <a href="${data.loginLink}" style="background-color: #AB58E7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Login Now</a>
            </p>
            <p>If you have any questions or need assistance, please contact the system administrator.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">School Management System</p>
          </div>
        `;

      case EmailTemplate.PASSWORD_RESET:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Dear Sms User,</p>
            <p>We received a request to reset your password. Click the link below to create a new password:</p>
            <p style="margin: 25px 0;">
              <a href="${data.resetLink}" style="background-color: #AB58E7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
            </p>
            <p>This link will expire in 30 minutes.</p>
            <p>If you did not request a password reset, please ignore this email or contact the administrator if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">School Management System</p>
          </div>
        `;

      case EmailTemplate.GENERAL_NOTIFICATION:
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
              <h2 style="color: #333;">Notification</h2>
              <p>Dear ${data.name},</p>
              <p>${data.message}</p>
              ${
                data.actionLink
                  ? `<p style="margin: 25px 0;">
                      <a href="${data.actionLink}" style="background-color: #AB58E7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        ${data.actionText || 'Take Action'}
                      </a>
                     </p>`
                  : ''
              }
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #777; font-size: 12px;">School Management System</p>
            </div>
          `;

      case EmailTemplate.STUDENT_PIN_RESET:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #AB58E7;">Your PIN Has Been Reset</h2>
            <p>Hello ${data.name},</p>
            <p>Your PIN for the School Management System has been reset as requested.</p>
            <p>Here are your login details:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <p><strong>Student ID:</strong> ${data.studentId}</p>
              <p><strong>New PIN:</strong> ${data.pin}</p>
            </div>
            <p>Please use these credentials to log in to your account.</p>
            <p>For security reasons, we recommend changing your PIN after logging in.</p>
            <p>If you did not request this PIN reset, please contact your school administrator immediately.</p>
            <p>Thank you,<br>School Management System</p>
          </div>
        `;

      case EmailTemplate.TEACHER_PIN_RESET:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #AB58E7;">Your PIN Has Been Reset</h2>
            <p>Hello ${data.name},</p>
            <p>Your PIN for the School Management System has been reset as requested.</p>
            <p>Here are your login details:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <p><strong>Teacher ID:</strong> ${data.teacherId}</p>
              <p><strong>New PIN:</strong> ${data.pin}</p>
            </div>
            <p>Please use these credentials to log in to your account.</p>
            <p>For security reasons, we recommend changing your PIN after logging in.</p>
            <p>If you did not request this PIN reset, please contact your school administrator immediately.</p>
            <p>Thank you,<br>School Management System</p>
          </div>
        `;

      default:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">School Management System</h2>
            <p>Dear ${data.name},</p>
            <p>${data.message || 'You have a new notification from the School Management System.'}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">School Management System</p>
          </div>
        `;
    }
  }
}
