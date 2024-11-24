'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.TwitterHandler = void 0;
const axios_1 = __importDefault(require('axios'));
const linkedom_1 = require('linkedom');
const luxon_1 = require('luxon');
const content_handler_1 = require('../content-handler');
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_URL_MATCH =
  /(twitter|x)\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)(?:\/.*)?/;
const MAX_THREAD_DEPTH = 100;
const getTweetFields = () => {
  const TWEET_FIELDS =
    '&tweet.fields=attachments,author_id,conversation_id,created_at,' +
    'entities,geo,in_reply_to_user_id,lang,possibly_sensitive,public_metrics,referenced_tweets,' +
    'source,withheld';
  const EXPANSIONS = '&expansions=author_id,attachments.media_keys';
  const USER_FIELDS =
    '&user.fields=created_at,description,entities,location,pinned_tweet_id,profile_image_url,protected,public_metrics,url,verified,withheld';
  const MEDIA_FIELDS =
    '&media.fields=duration_ms,height,preview_image_url,url,media_key,public_metrics,width';
  return `${TWEET_FIELDS}${EXPANSIONS}${USER_FIELDS}${MEDIA_FIELDS}`;
};
// unroll recent tweet thread
const getTweetThread = async conversationId => {
  const BASE_ENDPOINT = 'https://api.twitter.com/2/tweets/search/recent';
  const apiUrl = new URL(
    BASE_ENDPOINT +
      '?query=' +
      encodeURIComponent(`conversation_id:${conversationId}`) +
      getTweetFields() +
      `&max_results=${MAX_THREAD_DEPTH}`
  );
  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('No Twitter bearer token found');
  }
  const response = await axios_1.default.get(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      redirect: 'follow',
    },
  });
  return response.data;
};
const getEmbedTweet = async url => {
  const BASE_ENDPOINT = 'https://publish.twitter.com/oembed';
  const embedUrl = new URL(BASE_ENDPOINT + '?url=' + encodeURIComponent(url));
  const response = await axios_1.default.get(embedUrl.toString());
  return response.data;
};
const getTweetById = async id => {
  const BASE_ENDPOINT = 'https://api.twitter.com/2/tweets/';
  const apiUrl = new URL(BASE_ENDPOINT + id + '?' + getTweetFields());
  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('No Twitter bearer token found');
  }
  const response = await axios_1.default.get(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      redirect: 'follow',
    },
  });
  return response.data;
};
const getTweetsByIds = async ids => {
  const BASE_ENDPOINT = 'https://api.twitter.com/2/tweets?ids=';
  const apiUrl = new URL(BASE_ENDPOINT + ids.join() + getTweetFields());
  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('No Twitter bearer token found');
  }
  const response = await axios_1.default.get(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      redirect: 'follow',
    },
  });
  return response.data;
};
const titleForTweet = (author, text) => {
  return `${author} on X: ${text.replace(/http\S+/, '')}`;
};
const tweetIdFromStatusUrl = url => {
  const match = url.toString().match(TWITTER_URL_MATCH);
  return match?.[2];
};
const formatTimestamp = timestamp => {
  return luxon_1.DateTime.fromJSDate(new Date(timestamp)).toLocaleString(
    luxon_1.DateTime.DATETIME_FULL
  );
};
const getTweetsFromResponse = response => {
  const tweets = [];
  for (const t of response.data) {
    const media = response.includes.media?.filter(m =>
      t.attachments?.media_keys?.includes(m.media_key)
    );
    const tweet = {
      data: t,
      includes: {
        users: response.includes.users,
        media,
      },
    };
    tweets.push(tweet);
  }
  return tweets;
};
class TwitterHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Twitter';
  }
  shouldPreHandle(url) {
    return TWITTER_URL_MATCH.test(url.toString());
  }
  async preHandle(url) {
    const embedTweet = await getEmbedTweet(url);
    console.log('embedTweet', embedTweet);
    const html = embedTweet.html;
    const dom = (0, linkedom_1.parseHTML)(html).document;
    const tweetText = dom.querySelector('p')?.textContent ?? '';
    const title = titleForTweet(embedTweet.author_name, tweetText);
    const publisedDate =
      dom.querySelector('a[href*="/status/"]')?.textContent ?? '';
    const content = `
      <html>
          <head>
            <meta property="og:site_name" content="X (formerly Twitter)" />
            <meta property="og:type" content="tweet" />
            <meta property="dc:creator" content="${embedTweet.author_name}" />
            <meta property="twitter:description" content="${tweetText}" />
            <meta property="article:published_time" content="${publisedDate}" />
          </head>
          <body>
            <div>
              ${embedTweet.html}
            </div>
          </body>
      </html>`;
    return {
      content,
      url,
      title,
    };
  }
}
exports.TwitterHandler = TwitterHandler;
