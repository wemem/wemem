import { PagePropertyType } from '@affine/core/modules/properties/services/schema';
import { useI18n } from '@affine/i18n';
import { useCallback } from 'react';

export const InternalPropertiesPrefix = 'ai.wemem.internal-properties.';

export const AuthorProperty = {
  id: 'author',
  type: PagePropertyType.Text,
  icon: 'account',
  name: `${InternalPropertiesPrefix}author`,
};

export const OriginalProperty = {
  id: 'original',
  type: PagePropertyType.Text,
  icon: 'link',
  name: `${InternalPropertiesPrefix}original`,
};

export const isInternalProperty = (property: any) =>
  (property as string).startsWith(InternalPropertiesPrefix);

export const usePropertyI18n = () => {
  const t = useI18n();
  return useCallback(
    (property: any) => {
      if (!property) {
        return t['Untitled']();
      }

      if (isInternalProperty(property)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        return t[property as string]();
      }

      return property;
    },
    [t]
  );
};
