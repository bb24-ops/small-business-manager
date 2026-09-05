import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';
import type { AuthUser } from './auth-user.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) { return this.service.login(dto); }
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) { return this.service.me(user.id); }
}
