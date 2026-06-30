'use client';

import { Turnstile } from '@marsidev/react-turnstile';

// Default = Cloudflare's official test site key (always passes). Replace via env.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export function TurnstileBox({ onToken }: { onToken: (token: string | null) => void }) {
  return (
    <div className="flex justify-center">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={(t) => onToken(t)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
        options={{ size: 'flexible' }}
      />
    </div>
  );
}
