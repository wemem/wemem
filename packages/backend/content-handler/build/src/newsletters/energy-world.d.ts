import { ContentHandler } from '../content-handler';
export declare class EnergyWorldHandler extends ContentHandler {
  constructor();
  isNewsletter(input: {
    from: string;
    html: string;
    headers: Record<string, string | string[]>;
    dom: Document;
  }): Promise<boolean>;
  shouldPreParse(_url: string, dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
}
