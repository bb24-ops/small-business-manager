import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Petar' })
  @IsString()
  @Length(2, 100)
  firstName!: string;

  @ApiProperty({ example: 'Petrović' })
  @IsString()
  @Length(2, 100)
  lastName!: string;

  @ApiProperty({ example: 'petar.petrovic@example.com' })
  @IsEmail()
  @MaxLength(191)
  email!: string;

  @ApiPropertyOptional({ example: '+381 64 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: 'Servisni tehničar' })
  @IsString()
  @Length(2, 120)
  position!: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
