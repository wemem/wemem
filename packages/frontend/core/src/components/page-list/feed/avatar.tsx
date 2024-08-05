import { Avatar } from '@affine/component';
import { memo } from 'react';
import { PiRss } from 'react-icons/pi';

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
      <PiRss size={size} />
    );
  }
);
