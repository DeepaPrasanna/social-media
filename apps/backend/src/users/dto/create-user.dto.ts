import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsMobilePhone,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  readonly password: string;

  @IsMobilePhone('en-IN')
  readonly contact: string;
}
