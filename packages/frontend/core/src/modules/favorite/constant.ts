import { FeedNodeType } from '../feeds';

export const FavoriteSupportType = [
  'collection',
  'doc',
  'tag',
  'folder',
  FeedNodeType.RSS,
  FeedNodeType.Folder,
] as const;
export type FavoriteSupportType = (typeof FavoriteSupportType)[number];
export const isFavoriteSupportType = (
  type: string
): type is FavoriteSupportType =>
  FavoriteSupportType.includes(type as FavoriteSupportType);
