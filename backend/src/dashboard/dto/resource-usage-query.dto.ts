import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';

export class ResourceUsageQueryDto {
  @Transform(({ value }) => Number(value ?? 30))
  @IsIn([7, 30, 90], { message: 'Period mora biti 7, 30 ili 90 dana.' })
  days = 30;
}
