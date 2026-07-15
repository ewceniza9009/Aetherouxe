import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ description: 'ID of the tenant to register under' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Domain of the tenant to register under' })
  @IsString()
  @IsOptional()
  tenantDomain?: string;

  @ApiPropertyOptional({ example: '+639171234567' })
  @IsString()
  @IsOptional()
  phone?: string;
}
