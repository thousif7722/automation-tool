import { InstagramAccountModel } from '@insta-automation/database';
import { encrypt, decrypt } from '@insta-automation/utils';
import { getEnv } from '@insta-automation/config';
import type { AccountStatus, InstagramAccountMetadata } from '@insta-automation/types';
import { InstagramApiClient } from './client';

export interface ConnectAccountInput {
  workspaceId: string;
  instagramUserId: string;
  username: string;
  accessToken: string;
  profilePicUrl?: string;
  metadata?: InstagramAccountMetadata;
  permissions?: string[];
  expiresInSeconds?: number;
}

export class InstagramAccountService {
  private apiClient: InstagramApiClient;

  constructor(apiClient?: InstagramApiClient) {
    this.apiClient = apiClient || new InstagramApiClient();
  }

  public async connectAccount(input: ConnectAccountInput): Promise<any> {
    const env = getEnv();
    const encryptionKey = env.ENCRYPTION_KEY || env.JWT_SECRET;
    const encrypted = encrypt(input.accessToken, encryptionKey);

    const tokenExpiresAt = input.expiresInSeconds
      ? new Date(Date.now() + input.expiresInSeconds * 1000)
      : new Date(Date.now() + 60 * 86_400_000); // 60 days default for long-lived Meta token

    const account = await InstagramAccountModel.findOneAndUpdate(
      { workspaceId: input.workspaceId, instagramUserId: input.instagramUserId },
      {
        $set: {
          username: input.username,
          profilePicUrl: input.profilePicUrl,
          accountMetadata: input.metadata || {},
          accessTokenEncrypted: encrypted.encrypted,
          accessTokenIV: encrypted.iv,
          accessTokenTag: encrypted.tag,
          status: 'CONNECTED' as AccountStatus,
          connectedAt: new Date(),
          tokenExpiresAt,
          permissions: input.permissions || ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'],
          lastSuccessfulApiRequest: new Date(),
          healthError: undefined,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return this.sanitizeAccount(account);
  }

  public async disconnectAccount(workspaceId: string, accountId: string): Promise<boolean> {
    const res = await InstagramAccountModel.findOneAndUpdate(
      { _id: accountId, workspaceId },
      {
        $set: {
          status: 'DISCONNECTED' as AccountStatus,
          accessTokenEncrypted: undefined,
          accessTokenIV: undefined,
          accessTokenTag: undefined,
        },
      },
      { new: true }
    );
    return !!res;
  }

  public async getDecryptedToken(workspaceId: string, instagramUserId: string): Promise<string> {
    const account = await InstagramAccountModel.findOne({ workspaceId, instagramUserId })
      .select('+accessTokenEncrypted +accessTokenIV +accessTokenTag')
      .lean();

    if (!account || !account.accessTokenEncrypted || !account.accessTokenIV || !account.accessTokenTag) {
      throw new Error(`No encrypted access token found for account '${instagramUserId}' in workspace '${workspaceId}'`);
    }

    if (account.status === 'EXPIRED' || account.status === 'REVOKED') {
      throw new Error(`Instagram account token status is '${account.status}'`);
    }

    const env = getEnv();
    const encryptionKey = env.ENCRYPTION_KEY || env.JWT_SECRET;

    return decrypt(
      {
        encrypted: account.accessTokenEncrypted,
        iv: account.accessTokenIV,
        tag: account.accessTokenTag,
      },
      encryptionKey
    );
  }

  public async checkAccountHealth(workspaceId: string, instagramUserId: string): Promise<{ status: AccountStatus; isHealthy: boolean; error?: string }> {
    const account = await InstagramAccountModel.findOne({ workspaceId, instagramUserId })
      .select('+accessTokenEncrypted +accessTokenIV +accessTokenTag')
      .lean();

    if (!account) {
      return { status: 'DISCONNECTED', isHealthy: false, error: 'Account not found' };
    }

    if (!account.accessTokenEncrypted) {
      return { status: 'DISCONNECTED', isHealthy: false, error: 'Account has no access token' };
    }

    try {
      const token = await this.getDecryptedToken(workspaceId, instagramUserId);
      await this.apiClient.getAccountInfo(token, instagramUserId);

      await InstagramAccountModel.updateOne(
        { _id: account._id },
        {
          $set: {
            status: 'CONNECTED' as AccountStatus,
            lastSuccessfulApiRequest: new Date(),
            lastHealthCheckAt: new Date(),
            healthError: undefined,
          },
        }
      );

      return { status: 'CONNECTED', isHealthy: true };
    } catch (err: any) {
      let status: AccountStatus = 'ERROR';
      if (err.name === 'MetaAuthenticationError') {
        status = 'EXPIRED';
      } else if (err.name === 'MetaPermissionError') {
        status = 'REVOKED';
      }

      await InstagramAccountModel.updateOne(
        { _id: account._id },
        {
          $set: {
            status,
            lastHealthCheckAt: new Date(),
            healthError: err.message,
          },
        }
      );

      return { status, isHealthy: false, error: err.message };
    }
  }

  public async recordSuccessfulApiRequest(workspaceId: string, instagramUserId: string): Promise<void> {
    await InstagramAccountModel.updateOne(
      { workspaceId, instagramUserId },
      { $set: { lastSuccessfulApiRequest: new Date() } }
    );
  }

  public async recordWebhookEvent(workspaceId: string, instagramUserId: string): Promise<void> {
    await InstagramAccountModel.updateOne(
      { workspaceId, instagramUserId },
      { $set: { lastWebhookEvent: new Date() } }
    );
  }

  public async getAccount(workspaceId: string, accountId: string): Promise<any> {
    const account = await InstagramAccountModel.findOne({ _id: accountId, workspaceId }).lean();
    if (!account) return null;
    return this.sanitizeAccount(account);
  }

  private sanitizeAccount(account: any): any {
    return {
      id: account._id.toString(),
      workspaceId: account.workspaceId.toString(),
      instagramUserId: account.instagramUserId,
      username: account.username,
      profilePicUrl: account.profilePicUrl,
      accountMetadata: account.accountMetadata || {},
      status: account.status,
      permissions: account.permissions || [],
      connectedAt: account.connectedAt,
      tokenExpiresAt: account.tokenExpiresAt,
      lastSuccessfulApiRequest: account.lastSuccessfulApiRequest,
      lastWebhookEvent: account.lastWebhookEvent,
      lastHealthCheckAt: account.lastHealthCheckAt,
      healthError: account.healthError,
    };
  }
}
