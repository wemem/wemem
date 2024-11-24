import { ContentHandler } from '../content-handler';
export declare class AxiosHandler extends ContentHandler {
  constructor();
  shouldPreParse(url: string, _dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
}
