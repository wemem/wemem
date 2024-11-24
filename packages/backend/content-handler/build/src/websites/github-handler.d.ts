import { ContentHandler } from '../content-handler';
export declare class GitHubHandler extends ContentHandler {
  constructor();
  shouldPreParse(url: string, _dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
}
