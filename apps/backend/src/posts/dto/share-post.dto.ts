import { IsNotEmpty, IsString } from 'class-validator';

export class SharePostDto {
  @IsString()
  @IsNotEmpty()
  readonly userId: string;
}
