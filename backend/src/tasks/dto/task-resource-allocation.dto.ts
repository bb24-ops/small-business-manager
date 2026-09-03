import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class TaskResourceAllocationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
