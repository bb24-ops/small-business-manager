import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Unesite ispravnu email adresu.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Lozinka mora imati najmanje 8 znakova.' })
  password!: string;
}
