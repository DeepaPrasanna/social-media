import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMobilePhone,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsOptional()
  readonly lastName: string;

  @IsOptional()
  @IsMobilePhone('en-IN')
  readonly contact: string;
}
