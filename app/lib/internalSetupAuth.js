import { NextResponse } from 'next/server';

/**
 * Legacy setup / smoke-test routes must not be world-readable in production.
 * Allow with Authorization: Bearer <AMPLY_INTERNAL_TOOLS_SECRET> or, if unset, CRON_SECRET.
 */
export function guardInternalToolsRoute(request) {
  if (process.env.NODE_ENV !== 'production') return null;

  const secret =
    process.env.AMPLY_INTERNAL_TOOLS_SECRET?.trim() || process.env.CRON_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      {
        error: 'internal_tools_disabled',
        detail:
          'In production, set AMPLY_INTERNAL_TOOLS_SECRET (or CRON_SECRET) and send Authorization: Bearer <secret>.',
      },
      { status: 503 },
    );
  }

  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
