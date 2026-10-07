import { Router, Request, Response, NextFunction } from 'express';
import { InstagramAccountModel } from '@insta-automation/database';
import { InstagramAccountService, InstagramOAuthService, InstagramApiClient } from '@insta-automation/instagram';
import { audit, AuditAction } from '@insta-automation/audit';
import { generateOAuthState, verifyAndConsumeOAuthState } from '@insta-automation/utils';
import { getEnv } from '@insta-automation/config';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const instagramRouter = Router();
const accountService = new InstagramAccountService();
const oauthService = new InstagramOAuthService();

// Public OAuth Callback Handler (called by Meta browser redirect)
instagramRouter.get('/oauth/callback', async (req: Request, res: Response) => {
  const env = getEnv();
  const webUrl = env.WEB_URL || 'http://localhost:3000';
  const defaultRedirectUri = env.META_REDIRECT_URI || `${env.API_URL}/api/instagram/oauth/callback`;

  const { code, state, error, error_description } = req.query;

  if (error || !code || !state) {
    const errorMsg = (error_description as string) || (error as string) || 'OAuth authorization was cancelled or failed.';
    logger.warn('[Instagram OAuth Callback] Meta returned error or missing params', { error, error_description });
    return res.redirect(`${webUrl}?tab=instagram&status=error&message=${encodeURIComponent(errorMsg)}`);
  }

  try {
    const decodedState = verifyAndConsumeOAuthState(state as string, env.JWT_SECRET);
    if (!decodedState) {
      logger.warn('[Instagram OAuth Callback] Invalid, tampered, expired, or previously consumed OAuth state token');
      return res.redirect(`${webUrl}?tab=instagram&status=error&message=${encodeURIComponent('Invalid or expired OAuth state parameter')}`);
    }

    const { workspaceId, userId } = decodedState;

    const tokenRes = await oauthService.exchangeCodeForToken(code as string, defaultRedirectUri);
    let finalToken = tokenRes.accessToken;
    let expiresIn = tokenRes.expiresIn;

    try {
      const longLived = await oauthService.exchangeForLongLivedToken(finalToken);
      if (longLived.accessToken) {
        finalToken = longLived.accessToken;
        expiresIn = longLived.expiresIn;
      }
    } catch (llErr: any) {
      logger.warn('[Instagram OAuth Callback] Long-lived token exchange notice:', { message: llErr.message });
    }

    let accountInfo = { id: '', username: 'instagram_user', profile_picture_url: '' };
    try {
      const apiClient = new InstagramApiClient();
      const fetched = await apiClient.getAccountInfo(finalToken, 'me');
      accountInfo = {
        id: fetched.id || `ig_${Date.now()}`,
        username: fetched.username || 'instagram_user',
        profile_picture_url: fetched.profile_picture_url || '',
      };
    } catch {
      accountInfo = {
        id: `ig_${Date.now()}`,
        username: 'connected_account',
        profile_picture_url: '',
      };
    }

    const account = await accountService.connectAccount({
      workspaceId,
      instagramUserId: accountInfo.id,
      username: accountInfo.username,
      accessToken: finalToken,
      profilePicUrl: accountInfo.profile_picture_url,
      expiresInSeconds: expiresIn,
    });

    await audit({
      userId,
      workspaceId,
      action: AuditAction.INSTAGRAM_CONNECT,
      resource: `InstagramAccount:${account.id}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { username: accountInfo.username },
    });

    return res.redirect(`${webUrl}?tab=instagram&status=success&username=${encodeURIComponent(accountInfo.username)}`);
  } catch (err: any) {
    logger.error('[Instagram OAuth Callback] Token exchange or connection failure', { error: err.message });
    return res.redirect(`${webUrl}?tab=instagram&status=error&message=${encodeURIComponent('Failed to complete Instagram account connection.')}`);
  }
});

// Authenticated Routes
instagramRouter.use(authMiddleware);
instagramRouter.use(tenantMiddleware);

instagramRouter.get('/accounts', requirePermission('instagram:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const accounts = await InstagramAccountModel.find({ workspaceId }).lean();
    const sanitized = accounts.map((acc: any) => ({
      id: acc._id.toString(),
      workspaceId: acc.workspaceId.toString(),
      instagramUserId: acc.instagramUserId,
      username: acc.username,
      profilePicUrl: acc.profilePicUrl,
      accountMetadata: acc.accountMetadata || {},
      status: acc.status,
      permissions: acc.permissions || [],
      connectedAt: acc.connectedAt,
      tokenExpiresAt: acc.tokenExpiresAt,
      lastSuccessfulApiRequest: acc.lastSuccessfulApiRequest,
      lastWebhookEvent: acc.lastWebhookEvent,
      lastHealthCheckAt: acc.lastHealthCheckAt,
      healthError: acc.healthError,
    }));
    return res.json({ success: true, data: sanitized });
  } catch (err) {
    return next(err);
  }
});

instagramRouter.get('/oauth/url', requirePermission('instagram:connect'), (req: Request, res: Response) => {
  const env = getEnv();
  const redirectUri = (req.query.redirectUri as string) || env.META_REDIRECT_URI || `${env.API_URL}/api/instagram/oauth/callback`;
  const signedState = generateOAuthState(req.tenant!.workspaceId, req.user!.id, env.JWT_SECRET);
  const url = oauthService.getAuthorizationUrl(redirectUri, signedState);
  return res.json({ success: true, url, state: signedState });
});

instagramRouter.post('/connect', requirePermission('instagram:connect'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { instagramUserId, username, profilePicUrl, accessToken, metadata, permissions, expiresInSeconds } = req.body;

    if (!instagramUserId || !username || !accessToken) {
      return next(Errors.BadRequest('instagramUserId, username, and accessToken are required'));
    }

    const account = await accountService.connectAccount({
      workspaceId,
      instagramUserId,
      username,
      accessToken,
      profilePicUrl,
      metadata,
      permissions,
      expiresInSeconds,
    });

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.INSTAGRAM_CONNECT,
      resource: `InstagramAccount:${account.id}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { username },
    });

    return res.json({
      success: true,
      message: `Instagram account @${username} connected successfully`,
      account,
    });
  } catch (err) {
    return next(err);
  }
});

instagramRouter.post('/disconnect/:accountId', requirePermission('instagram:disconnect'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const success = await accountService.disconnectAccount(workspaceId, req.params.accountId);

    if (!success) return next(Errors.NotFound('Instagram account not found'));

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.INSTAGRAM_DISCONNECT,
      resource: `InstagramAccount:${req.params.accountId}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.json({ success: true, message: 'Instagram account disconnected successfully' });
  } catch (err) {
    return next(err);
  }
});

instagramRouter.post('/health/:instagramUserId', requirePermission('instagram:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const health = await accountService.checkAccountHealth(workspaceId, req.params.instagramUserId);
    return res.json({ success: true, health });
  } catch (err) {
    return next(err);
  }
});
