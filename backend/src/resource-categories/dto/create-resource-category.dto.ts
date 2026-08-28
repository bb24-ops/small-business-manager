import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateResourceCategoryDto {
  @ApiProperty({ example: 'Vozila' })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional({ example: 'Službena vozila preduzeća' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
