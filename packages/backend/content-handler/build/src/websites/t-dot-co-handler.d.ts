import { ContentHandler } from '../content-handler';
export declare class TDotCoHandler extends ContentHandler {
  constructor();
  shouldResolve(url: string): boolean;
  resolve(url: string): Promise<string | undefined>;
}
