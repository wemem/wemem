import { ContentHandler, type PreHandleResult } from '../content-handler';
export declare class PipedVideoHandler extends ContentHandler {
  PIPED_URL_MATCH: RegExp;
  constructor();
  getYoutubeVideoId: (url: string) => string | null;
  escapeTitle: (title: string) => string;
  shouldPreHandle(url: string): boolean;
  preHandle(url: string): Promise<PreHandleResult>;
}
