import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Dela Cruz' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'property_manager', enum: UserType })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ example: '+639171234567' })
  @IsString()
  @IsOptional()
  phone?: string;
}
