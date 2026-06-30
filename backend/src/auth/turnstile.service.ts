import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Cloudflare's official "always passes" test secret — used until a real key is set.
const TEST_SECRET = '1x0000000000000000000000000000000AA';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

@Injectable()
export class TurnstileService {
  constructor(private config: ConfigService) {}

  async verify(token?: string, ip?: string): Promise<void> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY') ?? TEST_SECRET;
    if (!token) throw new BadRequestException('Please complete the captcha');

    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);

    let result: { success: boolean };
    try {
      const res = await fetch(VERIFY_URL, { method: 'POST', body });
      result = (await res.json()) as { success: boolean };
    } catch {
      throw new BadRequestException('Captcha verification unavailable, please retry');
    }
    if (!result.success) throw new BadRequestException('Captcha failed, please try again');
  }
}
