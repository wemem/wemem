import type { GraphQLService } from '@affine/core/modules/cloud';
import type { FeedSourceRecord } from '@affine/core/modules/feeds/views/data-hooks';
import { searchFeedsQuery } from '@affine/graphql';
import { Entity, LiveData } from '@toeverything/infra';
// import type Parser from 'rss-parser';
// 根据这个issue，在浏览器中，无法直接new Parser,需要带入预编译的文件 https://github.com/rbren/rss-parser/issues/53#issuecomment-406971660
// import RSSParser from 'rss-parser/dist/rss-parser.min.js';
//
// const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
// const parser: Parser = new RSSParser();
// parser.parseURL(CORS_PROXY + 'https://www.reddit.com/.rss').then(r => {
//   console.log('rss', r);
// }).catch(reason => console.log('reason', reason));

export type CurrentFolder = {
  folderId: string;
  folderName: string;
};

export class FeedSearchModal extends Entity {
  constructor(private readonly graphQLService: GraphQLService) {
    super();
  }

  private readonly state$ = new LiveData<{
    query: string;
    currentFolder?: CurrentFolder | null;
    callback?: (result: FeedSourceRecord | null) => void;
  } | null>(null);

  readonly show$ = this.state$.map(s => !!s);

  show = (
    currentFolder?: CurrentFolder | null,
    opts: {
      callback?: (res: FeedSourceRecord | null) => void;
      query?: string;
    } = {}
  ) => {
    if (this.state$.value?.callback) {
      this.state$.value.callback(null);
    }
    this.state$.next({
      query: opts.query ?? '',
      currentFolder: currentFolder,
      callback: opts.callback,
    });
  };

  query$ = this.state$.map(s => s?.query || '');
  currentFolder$ = this.state$.map(s => s?.currentFolder);

  setQuery = (query: string) => {
    if (!this.state$.value) return;
    this.state$.next({
      ...this.state$.value,
      query,
    });
  };

  hide() {
    return this.state$.next(null);
  }

  toggle() {
    return this.show$.value ? this.hide() : this.show();
  }

  search(query?: string) {
    const { promise, resolve } =
      Promise.withResolvers<FeedSourceRecord | null>();

    this.show(this.currentFolder$.value, {
      callback: resolve,
      query,
    });

    return promise;
  }

  setSearchCallbackResult(result: FeedSourceRecord) {
    if (this.state$.value?.callback) {
      this.state$.value.callback(result);
    }
  }

  async searchFeeds(query: string) {
    if (!query) {
      return [];
    }
    const res = await this.graphQLService.gql({
      query: searchFeedsQuery,
      variables: {
        keyword: query,
      },
    });
    return res.searchFeeds || [];
  }
}
