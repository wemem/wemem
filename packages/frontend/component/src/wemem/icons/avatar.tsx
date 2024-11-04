import { Avatar, RssIcon } from '@affine/component';
import { memo } from 'react';

export const FeedAvatar = memo(
  ({
    image,
    name,
    size = 20,
  }: {
    image?: string | null;
    name?: string;
    size?: number;
  }) => {
    return image || name ? (
      <Avatar url={image} name={name} size={size} />
    ) : (
      <RssIcon size={size} />
    );
  }
);
