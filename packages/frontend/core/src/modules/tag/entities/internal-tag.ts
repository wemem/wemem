import { tagColors } from '@affine/core/components/affine/page-properties/common';
import type { Tag } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { useCallback } from 'react';

export const InternalTagPrefix = 'ai.wemem.internal-tags.';

export const InternalGhostTagPrefix = `${InternalTagPrefix}ghost.`;

export const FeedTag: Tag = {
  id: 'Feed',
  value: `${InternalTagPrefix}feed`,
  color: tagColors[5][0],
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const WeChatTag: Tag = {
  id: 'WeChat',
  value: `${InternalTagPrefix}wechat`,
  color: tagColors[4][0],
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

export const isInternalTag = (tagName: any) =>
  (tagName as string).startsWith(InternalTagPrefix);

export const useTagI18n = () => {
  const t = useI18n();
  return useCallback(
    (tagName: any): string => {
      if (!tagName) {
        return t['Untitled']();
      }
      if (isInternalTag(tagName)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        return t[tagName as string] ? t[tagName as string]() : tagName;
      }

      return tagName;
    },
    [t]
  );
};

export const InternalTags = [FeedTag, RSSTag];

export const isGhostTag = (tagId: string) => {
  return tagId.includes(InternalGhostTagPrefix);
};
