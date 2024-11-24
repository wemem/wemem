import { ContentHandler, type PreHandleResult } from '../content-handler';
export declare const getYoutubeVideoId: (url: string) => string | undefined;
export declare const getYoutubePlaylistId: (url: string) => string | null;
export declare const escapeTitle: (title: string) => string;
export declare class YoutubeHandler extends ContentHandler {
  constructor();
  shouldPreHandle(url: string): boolean;
  preHandle(url: string): Promise<PreHandleResult>;
}
