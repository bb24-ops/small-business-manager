import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Unesite ispravnu email adresu.' })
  email!: string;
  @IsString()
  @MinLength(8, { message: 'Lozinka mora imati najmanje 8 znakova.' })
  password!: string;
  @IsEnum(UserRole)
  role!: UserRole;
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
