import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './auth-user.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TurnstileService } from './turnstile.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private turnstile: TurnstileService,
  ) {}

  private sign(user: AuthUser): string {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  async register(dto: RegisterDto) {
    await this.turnstile.verify(dto.turnstileToken);
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email.toLowerCase(), password },
      select: { id: true, name: true, email: true },
    });
    return { user, accessToken: this.sign(user) };
  }

  async login(dto: LoginDto) {
    await this.turnstile.verify(dto.turnstileToken);
    const found = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!found) throw new UnauthorizedException('Invalid email or password');
    const ok = await bcrypt.compare(dto.password, found.password);
    if (!ok) throw new UnauthorizedException('Invalid email or password');
    const user: AuthUser = { id: found.id, name: found.name, email: found.email };
    return { user, accessToken: this.sign(user) };
  }
}
