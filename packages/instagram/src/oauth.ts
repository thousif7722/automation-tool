import { getEnv } from '@insta-automation/config';
import { parseMetaError } from './errors';

export interface OAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
}

export interface LongLivedTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export class InstagramOAuthService {
  private appId: string;
  private appSecret: string;
  private apiVersion: string;

  constructor() {
    const env = getEnv();
    this.appId = env.META_APP_ID || '';
    this.appSecret = env.META_APP_SECRET || '';
    this.apiVersion = 'v19.0';
  }

  public getAuthorizationUrl(redirectUri: string, state?: string): string {
    const scopes = [
      'instagram_basic',
      'instagram_manage_comments',
      'instagram_manage_messages',
      'pages_show_list',
      'pages_read_engagement',
    ];

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: state || '',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  public async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    const url = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?` +
      new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: redirectUri,
        code,
      }).toString();

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw parseMetaError(data);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      expiresIn: data.expires_in,
    };
  }

  public async exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse> {
    const url = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      }).toString();

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw parseMetaError(data);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      expiresIn: data.expires_in || 5184000, // 60 days
    };
  }
}
