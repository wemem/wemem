import type { GraphQLService } from '@affine/core/modules/cloud';
import { searchFeedsQuery } from '@affine/graphql';
import { Entity, LiveData } from '@toeverything/infra';

import type { FeedRecord } from '../views/data-hooks';
// import type Parser from 'rss-parser';
// 根据这个issue，在浏览器中，无法直接new Parser,需要带入预编译的文件 https://github.com/rbren/rss-parser/issues/53#issuecomment-406971660
// import RSSParser from 'rss-parser/dist/rss-parser.min.js';
//
// const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
// const parser: Parser = new RSSParser();
// parser.parseURL(CORS_PROXY + 'https://www.reddit.com/.rss').then(r => {
//   console.log('rss', r);
// }).catch(reason => console.log('reason', reason));

type QuickSearchMode = 'commands' | 'docs';

export type SearchCallbackResult =
  | {
      docId: string;
      blockId?: string;
    }
  | {
      query: string;
      action: 'insert';
    };

// todo: move command registry to entity as well
export class NewFeed extends Entity {
  constructor(private readonly graphQLService: GraphQLService) {
    super();
  }

  private readonly state$ = new LiveData<{
    mode: QuickSearchMode;
    query: string;
    callback?: (result: FeedRecord | null) => void;
  } | null>(null);

  readonly show$ = this.state$.map(s => !!s);

  show = (
    mode: QuickSearchMode | null = 'commands',
    opts: {
      callback?: (res: FeedRecord | null) => void;
      query?: string;
    } = {}
  ) => {
    if (this.state$.value?.callback) {
      this.state$.value.callback(null);
    }
    if (mode === null) {
      this.state$.next(null);
    } else {
      this.state$.next({
        mode,
        query: opts.query ?? '',
        callback: opts.callback,
      });
    }
  };

  mode$ = this.state$.map(s => s?.mode);
  query$ = this.state$.map(s => s?.query || '');

  setQuery = (query: string) => {
    if (!this.state$.value) return;
    this.state$.next({
      ...this.state$.value,
      query,
    });
  };

  hide() {
    return this.show(null);
  }

  toggle() {
    return this.show$.value ? this.hide() : this.show();
  }

  search(query?: string) {
    const { promise, resolve } = Promise.withResolvers<FeedRecord | null>();

    this.show('docs', {
      callback: resolve,
      query,
    });

    return promise;
  }

  setSearchCallbackResult(result: FeedRecord) {
    if (this.state$.value?.callback) {
      this.state$.value.callback(result);
    }
  }

  async getSearchedFeeds(query: string) {
    const res = await this.graphQLService.exec({
      query: searchFeedsQuery,
      variables: {
        keyword: query,
      },
    });
    return res.searchFeeds || [];
  }
}
