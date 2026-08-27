# Authentication

**Who can use this:** Super Admin, School Admin, Teacher, Student, Parent, Public  
**Where:** Login and sign-up pages under Auth; role-specific login and password reset flows

## Overview

Authentication covers signing in, creating an account, completing registration from an invitation, resetting a forgotten password, and linking a parent to a child. After a successful login, each role is redirected to their default home page.

## All roles — Sign in

| Action | Result |
|--------|--------|
| Enter your email and password on the login page and click **Sign In**. | A success message appears and you are redirected to your role’s home page (Super Admin dashboard, School Admin dashboard, Teacher students list, Student profile, or Parent family overview). |
| Enter incorrect credentials and click **Sign In**. | An error message indicates the login failed. |
| Click **Forgot PIN/Password** on the login page. | You are taken to the password reset flow for your role. |

## Public — Sign up

| Action | Result |
|--------|--------|
| Enter an email and password that meets the validation rules on the sign-up page and submit. | Your account is created, you are logged in, and redirected to the appropriate home page. |

## Invited users — Complete registration

| Action | Result |
|--------|--------|
| Open the registration link from your invitation email, set your password, and submit. | Your registration completes, you are logged in, and redirected to your role’s home page. |

## All roles — Forgot password

| Action | Result |
|--------|--------|
| Submit your email on the forgot-password page (teachers and students may also enter an ID). | A success message appears and you are redirected to a confirmation page indicating that reset instructions were sent. |
| Open the reset link from your email, enter a new password, and submit. | Your password is saved and you see a success confirmation page. |

## Parent — Confirm child

| Action | Result |
|--------|--------|
| Open the confirm-child link from your email and click **Confirm child**. | A success message appears. The child is linked to your parent account. A link to the parent login page is shown. |

## Empty, error, and blocked states

- Login shows an error toast when credentials are invalid.
- Password reset and registration forms show validation errors when required fields are missing or rules are not met.
