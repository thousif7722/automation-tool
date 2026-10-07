import type { NormalizedEvent, EventType } from '@insta-automation/types';

export class InstagramEventNormalizer {
  public normalizeChange(
    workspaceId: string,
    accountId: string,
    change: any
  ): NormalizedEvent | null {
    if (!change || !change.field || !change.value) {
      return null;
    }

    const field = change.field;
    const value = change.value;
    const timestamp = value.timestamp ? new Date(value.timestamp * 1000) : new Date();

    if (field === 'comments') {
      const eventId = value.comment_id ? `cmt_${value.comment_id}` : `evt_cmt_${Date.now()}`;
      return {
        eventId,
        workspaceId,
        accountId,
        timestamp,
        eventType: 'COMMENT_CREATED',
        payload: {
          commentId: value.comment_id || '',
          mediaId: value.media?.id || value.media_id || '',
          text: value.text || '',
          fromUserId: value.from?.id || '',
          fromUsername: value.from?.username || '',
          parentId: value.parent_id,
        },
      };
    }

    if (field === 'messages') {
      const eventId = value.mid ? `msg_${value.mid}` : `evt_msg_${Date.now()}`;
      const isStoryReply = !!value.message?.reply_to?.story;

      return {
        eventId,
        workspaceId,
        accountId,
        timestamp,
        eventType: (isStoryReply ? 'STORY_REPLY' : 'MESSAGE_RECEIVED') as EventType,
        payload: {
          messageId: value.mid || '',
          senderId: value.sender?.id || '',
          recipientId: value.recipient?.id || '',
          text: value.message?.text || '',
          attachments: value.message?.attachments || [],
          storyUrl: value.message?.reply_to?.story?.url,
        },
      };
    }

    if (field === 'mentions') {
      const eventId = value.comment_id ? `mnt_${value.comment_id}` : value.media_id ? `mnt_${value.media_id}` : `evt_mnt_${Date.now()}`;
      return {
        eventId,
        workspaceId,
        accountId,
        timestamp,
        eventType: 'MENTION_CREATED',
        payload: {
          commentId: value.comment_id,
          mediaId: value.media_id,
          fromUserId: value.from?.id,
          fromUsername: value.from?.username,
          text: value.text,
        },
      };
    }

    if (field === 'media') {
      const eventId = value.media_id ? `med_${value.media_id}` : `evt_med_${Date.now()}`;
      return {
        eventId,
        workspaceId,
        accountId,
        timestamp,
        eventType: 'MEDIA_EVENT',
        payload: {
          mediaId: value.media_id,
          caption: value.caption,
          mediaType: value.media_type,
        },
      };
    }

    return null;
  }
}

export const eventNormalizer = new InstagramEventNormalizer();
