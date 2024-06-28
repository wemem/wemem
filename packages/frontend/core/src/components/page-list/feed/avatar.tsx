import { Avatar } from '@affine/component';
import { memo } from 'react';
import { PiRss } from 'react-icons/pi';

export const FeedAvatar = memo((
  { image, size = 20 }: { image?: string | null, size?: number }) => {
  return image ? <Avatar url={image} /> : <PiRss size={size} />;
});
