import { makeRouteHandler } from '@keystatic/next/route-handler';
import { NextResponse } from 'next/server';
import config from '../../../../keystatic.config';

const missingGitHubVars =
  process.env.NODE_ENV === 'production' &&
  (!process.env.KEYSTATIC_GITHUB_CLIENT_ID ||
    !process.env.KEYSTATIC_GITHUB_CLIENT_SECRET ||
    !process.env.KEYSTATIC_SECRET);

const stub = () =>
  NextResponse.json(
    { error: 'Keystatic GitHub mode is not configured' },
    { status: 503 },
  );

const handler = missingGitHubVars ? null : makeRouteHandler({ config });

export const GET = handler?.GET ?? stub;
export const POST = handler?.POST ?? stub;
