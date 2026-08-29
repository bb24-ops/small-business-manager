import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Terenska intervencija kod klijenta' })
  @IsString()
  @Length(2, 150)
  title!: string;

  @ApiPropertyOptional({ example: 'Provera i zamena mrežne opreme' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2026-09-02T08:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-09-02T12:00:00.000Z' })
  @IsDateString()
  dueAt!: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  resourceIds!: string[];
}
