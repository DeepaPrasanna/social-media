import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsStrongPassword,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  readonly password: string;
}
