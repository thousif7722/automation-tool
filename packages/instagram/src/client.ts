import { parseMetaError } from './errors';

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
}

export interface InstagramCommentItem {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

export class InstagramApiClient {
  private apiVersion: string;
  private baseUrl: string;

  constructor(apiVersion = 'v19.0') {
    this.apiVersion = apiVersion;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  public async getAccountInfo(
    accessToken: string,
    instagramAccountId: string
  ): Promise<{ id: string; username: string; name?: string; profile_picture_url?: string; followers_count?: number; media_count?: number }> {
    const fields = 'id,username,name,profile_picture_url,followers_count,media_count';
    const url = `${this.baseUrl}/${instagramAccountId}?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;
    return this.request(url);
  }

  public async replyToComment(
    accessToken: string,
    commentId: string,
    message: string
  ): Promise<{ id: string }> {
    const url = `${this.baseUrl}/${commentId}/replies`;
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: accessToken }),
    });
  }

  public async sendDirectMessage(
    accessToken: string,
    recipientUserId: string,
    message: string
  ): Promise<{ recipient_id: string; message_id: string }> {
    const url = `${this.baseUrl}/me/messages`;
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientUserId },
        message: { text: message },
        access_token: accessToken,
      }),
    });
  }

  public async getMedia(accessToken: string, mediaId: string): Promise<InstagramMediaItem> {
    const fields = 'id,caption,media_type,media_url,permalink,timestamp';
    const url = `${this.baseUrl}/${mediaId}?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;
    return this.request(url);
  }

  public async getComments(accessToken: string, mediaId: string): Promise<{ data: InstagramCommentItem[] }> {
    const url = `${this.baseUrl}/${mediaId}/comments?access_token=${encodeURIComponent(accessToken)}`;
    return this.request(url);
  }

  public async debugToken(inputToken: string, appAccessToken: string): Promise<any> {
    const url = `${this.baseUrl}/debug_token?input_token=${encodeURIComponent(inputToken)}&access_token=${encodeURIComponent(appAccessToken)}`;
    return this.request(url);
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw parseMetaError(data);
      }

      return data as T;
    } catch (err: any) {
      if (err.name?.startsWith('Meta')) {
        throw err;
      }
      throw parseMetaError({ error: { message: err.message || 'Meta API Request Failed', code: -1 } });
    }
  }
}
