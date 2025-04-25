import { IsNotEmpty, ValidateIf, IsEmail } from 'class-validator';

export class CredentialLoginDto {
  @ValidateIf((o: CredentialLoginDto) => !o.email)
  @IsNotEmpty({ message: 'ID is required when email is not provided' })
  id?: string;

  @ValidateIf((o: CredentialLoginDto) => !o.id)
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required when ID is not provided' })
  email?: string;

  @IsNotEmpty({ message: 'PIN is required' })
  pin: string;
}
