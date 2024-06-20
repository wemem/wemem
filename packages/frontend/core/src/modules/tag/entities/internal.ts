import { tagColors } from '@affine/core/components/affine/page-properties/common';
import type { Tag } from '@affine/env/filter';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useCallback } from 'react';

export const InternalTagPrefix = 'ai.readflow.internal-tags.';

export const FeedTag: Tag = {
  id: 'Feed',
  value: `${InternalTagPrefix}feed`,
  color: tagColors[0][0],
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const WeChatTag: Tag = {
  id: 'WeChat',
  value: `${InternalTagPrefix}wechat`,
  color: tagColors[1][0],
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const RSSTag: Tag = {
  id: 'RSS',
  value: `${InternalTagPrefix}rss`,
  color: tagColors[2][0],
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const SeenTag: Tag = {
  id: 'Seen',
  value: `${InternalTagPrefix}seen`,
  color: tagColors[4][0],
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const UnseenTag: Tag = {
  id: 'Unseen',
  value: `${InternalTagPrefix}unseen`,
  color: tagColors[0][0],
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const isInternalTag = (tagName: any) => (tagName as string).startsWith(InternalTagPrefix);

export const useTagI18N = () => {
  const t = useAFFiNEI18N();
  return useCallback((tagName: any) => {
    if (isInternalTag(tagName)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return t[tagName as string]();
    }

    return tagName || t['Untitled']();
  }, [t]);
};

export const InternalTags = [FeedTag, WeChatTag, RSSTag, SeenTag, UnseenTag];
