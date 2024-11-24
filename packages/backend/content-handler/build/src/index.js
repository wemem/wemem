'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.handleNewsletter =
  exports.getNewsletterHandler =
  exports.preParseContent =
  exports.preHandleContent =
    void 0;
const linkedom_1 = require('linkedom');
const axios_handler_1 = require('./newsletters/axios-handler');
const beehiiv_handler_1 = require('./newsletters/beehiiv-handler');
const bloomberg_newsletter_handler_1 = require('./newsletters/bloomberg-newsletter-handler');
const convertkit_handler_1 = require('./newsletters/convertkit-handler');
const cooper_press_handler_1 = require('./newsletters/cooper-press-handler');
const energy_world_1 = require('./newsletters/energy-world');
const every_io_handler_1 = require('./newsletters/every-io-handler');
const generic_handler_1 = require('./newsletters/generic-handler');
const ghost_handler_1 = require('./newsletters/ghost-handler');
const golang_handler_1 = require('./newsletters/golang-handler');
const hey_world_handler_1 = require('./newsletters/hey-world-handler');
const india_times_handler_1 = require('./newsletters/india-times-handler');
const morning_brew_handler_1 = require('./newsletters/morning-brew-handler');
const revue_handler_1 = require('./newsletters/revue-handler');
const substack_handler_1 = require('./newsletters/substack-handler');
const apple_news_handler_1 = require('./websites/apple-news-handler');
const ars_technica_handler_1 = require('./websites/ars-technica-handler');
const bloomberg_handler_1 = require('./websites/bloomberg-handler');
const derstandard_handler_1 = require('./websites/derstandard-handler');
const github_handler_1 = require('./websites/github-handler');
const image_handler_1 = require('./websites/image-handler');
const medium_handler_1 = require('./websites/medium-handler');
const pdf_handler_1 = require('./websites/pdf-handler');
const piped_video_handler_1 = require('./websites/piped-video-handler');
const scrapingBee_handler_1 = require('./websites/scrapingBee-handler');
const stack_overflow_handler_1 = require('./websites/stack-overflow-handler');
const t_dot_co_handler_1 = require('./websites/t-dot-co-handler');
const the_atlantic_handler_1 = require('./websites/the-atlantic-handler');
const twitter_handler_1 = require('./websites/twitter-handler');
const weixin_qq_handler_1 = require('./websites/weixin-qq-handler');
const wikipedia_handler_1 = require('./websites/wikipedia-handler');
const youtube_handler_1 = require('./websites/youtube-handler');
const zhihu_handler_1 = require('./websites/zhihu-handler');
const tiktok_handler_1 = require('./websites/tiktok-handler');
const validateUrlString = url => {
  const u = new URL(url);
  // Make sure the URL is http or https
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Invalid URL protocol check failed');
  }
  // Make sure the domain is not localhost
  if (u.hostname === 'localhost' || u.hostname === '0.0.0.0') {
    throw new Error('Invalid URL is localhost');
  }
  // Make sure the domain is not a private IP
  if (/^(10|172\.16|192\.168)\..*/.test(u.hostname)) {
    throw new Error('Invalid URL is private ip');
  }
  return true;
};
const contentHandlers = [
  new ars_technica_handler_1.ArsTechnicaHandler(),
  new the_atlantic_handler_1.TheAtlanticHandler(),
  new apple_news_handler_1.AppleNewsHandler(),
  new bloomberg_handler_1.BloombergHandler(),
  new derstandard_handler_1.DerstandardHandler(),
  new image_handler_1.ImageHandler(),
  new medium_handler_1.MediumHandler(),
  new pdf_handler_1.PdfHandler(),
  new scrapingBee_handler_1.ScrapingBeeHandler(),
  new t_dot_co_handler_1.TDotCoHandler(),
  new youtube_handler_1.YoutubeHandler(),
  new wikipedia_handler_1.WikipediaHandler(),
  new github_handler_1.GitHubHandler(),
  new axios_handler_1.AxiosHandler(),
  new golang_handler_1.GolangHandler(),
  new morning_brew_handler_1.MorningBrewHandler(),
  new bloomberg_newsletter_handler_1.BloombergNewsletterHandler(),
  new substack_handler_1.SubstackHandler(),
  new stack_overflow_handler_1.StackOverflowHandler(),
  new energy_world_1.EnergyWorldHandler(),
  new piped_video_handler_1.PipedVideoHandler(),
  new weixin_qq_handler_1.WeixinQqHandler(),
  new zhihu_handler_1.ZhihuHandler(),
  new twitter_handler_1.TwitterHandler(),
  new tiktok_handler_1.TikTokHandler(),
];
const newsletterHandlers = [
  new axios_handler_1.AxiosHandler(),
  new bloomberg_newsletter_handler_1.BloombergNewsletterHandler(),
  new golang_handler_1.GolangHandler(),
  new substack_handler_1.SubstackHandler(),
  new morning_brew_handler_1.MorningBrewHandler(),
  new beehiiv_handler_1.BeehiivHandler(),
  new convertkit_handler_1.ConvertkitHandler(),
  new revue_handler_1.RevueHandler(),
  new ghost_handler_1.GhostHandler(),
  new cooper_press_handler_1.CooperPressHandler(),
  new hey_world_handler_1.HeyWorldHandler(),
  new generic_handler_1.GenericHandler(),
  new every_io_handler_1.EveryIoHandler(),
  new energy_world_1.EnergyWorldHandler(),
  new india_times_handler_1.IndiaTimesHandler(),
];
const preHandleContent = async url => {
  // Before we run the regular handlers we check to see if we need tp
  // pre-resolve the URL. TODO: This should probably happen recursively,
  // so URLs can be pre-resolved, handled, pre-resolved, handled, etc.
  for (const handler of contentHandlers) {
    if (handler.shouldResolve(url)) {
      try {
        const resolvedUrl = await handler.resolve(url);
        if (resolvedUrl && validateUrlString(resolvedUrl)) {
          url = resolvedUrl;
        }
      } catch (err) {
        console.log('error resolving url with handler', handler.name, err);
      }
      break;
    }
  }
  // Before we fetch the page we check the handlers, to see if they want
  // to perform a prefetch action that can modify our requests.
  // enumerate the handlers and see if any of them want to handle the request
  for (const handler of contentHandlers) {
    if (handler.shouldPreHandle(url)) {
      console.log('preHandleContent', handler.name, url);
      return handler.preHandle(url);
    }
  }
  return undefined;
};
exports.preHandleContent = preHandleContent;
const preParseContent = async (url, dom) => {
  // Before we parse the page we check the handlers, to see if they want
  // to perform a preParse action that can modify our dom.
  // enumerate the handlers and see if any of them want to handle the dom
  for (const handler of contentHandlers) {
    if (handler.shouldPreParse(url, dom)) {
      console.log('preParseContent', handler.name, url);
      return handler.preParse(url, dom);
    }
  }
  return undefined;
};
exports.preParseContent = preParseContent;
const getNewsletterHandler = async input => {
  const dom = (0, linkedom_1.parseHTML)(input.html).document;
  for (const handler of newsletterHandlers) {
    if (await handler.isNewsletter({ ...input, dom })) {
      return handler;
    }
  }
  return undefined;
};
exports.getNewsletterHandler = getNewsletterHandler;
const handleNewsletter = async input => {
  const handler = await (0, exports.getNewsletterHandler)(input);
  if (handler) {
    console.log('handleNewsletter', handler.name, input.subject);
    return handler.handleNewsletter(input);
  }
  return undefined;
};
exports.handleNewsletter = handleNewsletter;
module.exports = {
  preHandleContent: exports.preHandleContent,
  handleNewsletter: exports.handleNewsletter,
  preParseContent: exports.preParseContent,
  getNewsletterHandler: exports.getNewsletterHandler,
};
