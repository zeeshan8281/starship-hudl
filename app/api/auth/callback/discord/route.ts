import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/login?error=' + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  try {
    // Exchange the code for an access token
    const params = new URLSearchParams();
    // Hardcoded client_id and client_secret for debugging
    params.append('client_id', '1387346802939793508');
    params.append('client_secret', 'SHxfCLW-IIVp6L-z2VlId-93RsNH9lt_');
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.DISCORD_REDIRECT_URI || '');
    params.append('scope', 'identify email guilds');

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=token_error', request.url));
    }

    const tokenData = await tokenResponse.json();

    // Fetch user info using the access token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=user_info_error', request.url));
    }

    const userData = await userResponse.json();

    // TODO: Store userData in session or cookie for frontend to detect authentication

    // For now, redirect to homepage after successful auth
    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}
