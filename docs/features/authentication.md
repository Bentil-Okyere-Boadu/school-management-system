# Authentication

**Who can use this:** Super Admin, School Admin, Teacher, Student, Parent, Public  
**Where:** Role-specific Log in pages under Auth; Super Admin uses the general Log in page; sign-up, invitation registration, and parent confirm-child links

## Overview

Authentication covers signing in, creating a Super Admin account from the sign-up page, completing School Admin registration from an invitation, recovering a forgotten password or PIN, and linking a parent to a child. Super Admin, School Admin, and Parent sign in with email and password. Teacher and Student sign in with ID and PIN. After a successful login, each role is redirected to their default home page.

## Super Admin, School Admin, and Parent — Sign in

| Action | Result |
|--------|--------|
| Enter your **Email** and **Password** on the Log in page and click **Sign In**. | A success message appears and you are redirected to your home page (Super Admin dashboard, School Admin dashboard, or Parent **Family Dashboard**). |
| Enter incorrect credentials and click **Sign In**. | An error message indicates the login failed. |
| Click **Forgot Password?** | You are taken to the password reset page for your role. |

## Teacher and Student — Sign in

| Action | Result |
|--------|--------|
| Enter your **ID** and **PIN** on the Log in page and click **Sign In**. | A success message appears and you are redirected to the Teacher students list or the Student profile. |
| Enter incorrect credentials and click **Sign In**. | An error message indicates the login failed. |
| Click **Forgot PIN?** | You are taken to the PIN reset page for your role. |
| (Teacher only) Click **Forgot Credentials? Reset**. | You are taken to the same PIN reset page as **Forgot PIN?**. |

## Super Admin — Sign up

| Action | Result |
|--------|--------|
| On the Super Admin Log in page, click **Sign up**. Enter an email and password that meets the validation rules and submit. | A Super Admin account is created (not a generic user). You are logged in and redirected to the Super Admin dashboard. |

## School Admin — Complete registration

Invited teachers and students do **not** use this page. They receive a generated PIN in their invitation email or when an admin chooses **Send credentials**, then sign in with **ID** and **PIN**.

| Action | Result |
|--------|--------|
| Open the registration link from your School Admin invitation email, set your password, and submit. | Your School Admin account is activated. You are logged in and redirected to the School Admin dashboard. |

## Super Admin, School Admin, and Parent — Forgot password

| Action | Result |
|--------|--------|
| On the **Forgot Password?** page, enter the email you used to sign up and click **Request Password Reset**. | A success message appears. A password reset link is sent to that email. |
| Open the reset link from your email, enter a new password and confirmation, and click **Save new password**. | Your password is saved. You see a confirmation that the reset succeeded, with a **log in** link to sign in with the new password. |

## Teacher and Student — Forgot PIN

| Action | Result |
|--------|--------|
| On the **Forgot PIN?** page, enter your email or ID and click **Request PIN Reset**. | A success message appears. Your PIN is reset immediately. You are taken to a confirmation page stating the reset succeeded and that the new PIN was sent to your registered email. You do not open a link or choose a PIN. |
| Click **Log in** on the confirmation page. | You return to your role’s Log in page, where you sign in with your ID and the new PIN from the email. |

## Parent — Confirm child

| Action | Result |
|--------|--------|
| Open the confirm-child link from your email and click **Confirm child**. | A success message appears. The child is linked to your parent account. A link to the parent login page is shown. |

## Empty, error, and blocked states

- Login shows an error toast when credentials are invalid.
- **Forgot Password?** requires a valid email. **Forgot PIN?** requires an email or ID.
- Password reset, sign-up, and registration forms show validation errors when required fields are missing or password rules are not met.
- PIN or password recovery shows an error if no matching account is found, or if the reset email cannot be sent.
