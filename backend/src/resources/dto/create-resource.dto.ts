import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ example: 'Službeni automobil 1' })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ example: 'VOZ-001' })
  @IsString()
  @Length(2, 50)
  code!: string;

  @ApiPropertyOptional({ example: 'Putničko vozilo za terenske zadatke' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'Garaža 1' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional({
    enum: ResourceStatus,
    default: ResourceStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;
}
