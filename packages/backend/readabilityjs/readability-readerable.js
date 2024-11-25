/* eslint-env es6:false */
/*
 * Copyright (c) 2010 Arc90 Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * This code is heavily based on Arc90's readability.js (1.7.1) script
 * available at: http://code.google.com/p/arc90labs-readability
 */

const REGEXPS = {
  // NOTE: These two regular expressions are duplicated in
  // Readability.js. Please keep both copies in sync.
  articleNegativeLookBehindCandidates:
    /breadcrumbs|breadcrumb|utils|trilist|_header/i,
  articleNegativeLookAheadCandidates:
    /outstream(.?)_|sub(.?)_|m_|omeda-promo-|in-article-advert|block-ad-.*|tl_/i,
  unlikelyCandidates:
    /\bad\b|ai2html|banner|breadcrumbs|breadcrumb|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager(?!ow)|popup|yom-remote|copyright|keywords|outline|infinite-list|beta|recirculation|site-index|hide-for-print|post-end-share-cta|post-end-cta-full|post-footer|post-head|post-tag|li-date|main-navigation|programtic-ads|outstream_article|hfeed|comment-holder|back-to-top|show-up-next|onward-journey|topic-tracker|list-nav|block-ad-entity|adSpecs|gift-article-button|modal-title|in-story-masthead|share-tools|standard-dock|expanded-dock|margins-h|subscribe-dialog|icon|bumped|dvz-social-media-buttons|post-toc|mobile-menu|mobile-navbar|tl_article_header|mvp(-post)*-(add-story|soc(-mob)*-wrap)|w-condition-invisible|rich-text-block main w-richtext|rich-text-block_ataglance at-a-glance test w-richtext|PostsPage-commentsSection/i,
  // okMaybeItsACandidate: /and|article(?!-breadcrumb)|body|column|content|main|shadow|post-header/i,
  get okMaybeItsACandidate() {
    return new RegExp(
      `and|(?<!${this.articleNegativeLookAheadCandidates.source})article(?!-(${this.articleNegativeLookBehindCandidates.source}))|body|column|content|^(?!main-navigation|main-header)main|shadow|post-header|hfeed site|blog-posts hfeed|container-banners|menu-opacity|header-with-anchor-widget|commentOnSelection`,
      'i'
    );
  },
};

function isNodeVisible(node) {
  // Have to null-check node.style and node.className.indexOf to deal with SVG and MathML nodes.
  return (
    (!node.style || node.style.display !== 'none') &&
    !node.hasAttribute('hidden') &&
    //check for "fallback-image" so that wikimedia math images are displayed
    (!node.hasAttribute('aria-hidden') ||
      node.getAttribute('aria-hidden') !== 'true' ||
      (node.className &&
        node.className.indexOf &&
        node.className.indexOf('fallback-image') !== -1))
  );
}

/**
 * Decides whether or not the document is reader-able without parsing the whole thing.
 * @param {Object} options Configuration object.
 * @param {number} [options.minContentLength=140] The minimum node content length used to decide if the document is readerable.
 * @param {number} [options.minScore=20] The minumum cumulated 'score' used to determine if the document is readerable.
 * @param {Function} [options.visibilityChecker=isNodeVisible] The function used to determine if a node is visible.
 * @return {boolean} Whether or not we suspect Readability.parse() will suceeed at returning an article object.
 */
function isProbablyReaderable(doc, options = {}) {
  // For backward compatibility reasons 'options' can either be a configuration object or the function used
  // to determine if a node is visible.
  if (typeof options === 'function') {
    options = { visibilityChecker: options };
  }

  var defaultOptions = {
    minScore: 20,
    minContentLength: 140,
    visibilityChecker: isNodeVisible,
  };
  options = Object.assign(defaultOptions, options);

  var nodes = doc.querySelectorAll('p, pre, article');

  // Get <div> nodes which have <br> node(s) and append them into the `nodes` variable.
  // Some articles' DOM structures might look like
  // <div>
  //   Sentences<br>
  //   <br>
  //   Sentences<br>
  // </div>
  var brNodes = doc.querySelectorAll('div > br');
  if (brNodes.length) {
    var set = new Set(nodes);
    [].forEach.call(brNodes, function (node) {
      set.add(node.parentNode);
    });
    nodes = Array.from(set);
  }

  var score = 0;
  // This is a little cheeky, we use the accumulator 'score' to decide what to return from
  // this callback:
  return [].some.call(nodes, function (node) {
    if (!options.visibilityChecker(node)) {
      return false;
    }

    var matchString = node.className + ' ' + node.id;
    if (
      REGEXPS.unlikelyCandidates.test(matchString) &&
      !REGEXPS.okMaybeItsACandidate.test(matchString)
    ) {
      return false;
    }

    if (node.matches('li p')) {
      return false;
    }

    var textContentLength = node.textContent.trim().length;
    if (textContentLength < options.minContentLength) {
      return false;
    }

    score += Math.sqrt(textContentLength - options.minContentLength);

    if (score > options.minScore) {
      return true;
    }
    return false;
  });
}

export { isProbablyReaderable };
