import { tagColors } from '@affine/core/components/affine/page-properties/common';
import type { Tag } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { useCallback } from 'react';

export const InternalTagPrefix = 'ai.wemem.internal-tags.';

export const RefPageTagPrefix = `${InternalTagPrefix}ref-page.`;

export const SubscriptionTag: Tag = {
  id: 'Subscription',
  value: `${InternalTagPrefix}subscription`,
  color: tagColors[5][0],
  ghost: true,
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
  color: tagColors[4][0],
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const SeenTag: Tag = {
  id: 'Seen',
  value: `${InternalTagPrefix}seen`,
  color: tagColors[4][0],
  ghost: true,
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const UnseenTag: Tag = {
  id: 'Unseen',
  value: `${InternalTagPrefix}unseen`,
  color: tagColors[5][0],
  ghost: true,
  createDate: Date.now(),
  updateDate: Date.now(),
};

export const isInternalTag = (tagName: any) =>
  (tagName as string).startsWith(InternalTagPrefix);

export const useTagI18N = () => {
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

export const InternalTags = [SubscriptionTag, SeenTag, UnseenTag];

export const isGhostTag = (tagId: string) => {
  return (
    InternalTags.some(tag => tag.id === tagId && tag.ghost) || // 明确表明是幽灵标签
    tagId.includes(RefPageTagPrefix) || // 精读文章时的引用标签
    tagId.includes('http')
  ); //RSS 地址
};

export const getRefPageId = (tags?: string[]) => {
  const refPageTag = tags?.findLast(tag => tag.startsWith(RefPageTagPrefix));
  if (refPageTag) {
    return refPageTag.slice(RefPageTagPrefix.length);
  }
  return;
};
