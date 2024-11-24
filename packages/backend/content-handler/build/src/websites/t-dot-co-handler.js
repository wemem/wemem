'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.TDotCoHandler = void 0;
const content_handler_1 = require('../content-handler');
const axios_1 = __importDefault(require('axios'));
class TDotCoHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 't.co';
  }
  shouldResolve(url) {
    const T_DOT_CO_URL_MATCH = /^https:\/\/(?:www\.)?t\.co\/.*$/;
    return T_DOT_CO_URL_MATCH.test(url);
  }
  async resolve(url) {
    return axios_1.default
      .get(url, { maxRedirects: 0, validateStatus: null })
      .then(res => {
        return new URL(res.headers.location).href;
      })
      .catch(err => {
        console.log('err with t.co url', err);
        return undefined;
      });
  }
}
exports.TDotCoHandler = TDotCoHandler;
