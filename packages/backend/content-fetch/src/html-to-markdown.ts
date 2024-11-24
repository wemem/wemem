import TurndownService from 'turndown';
// @ts-ignore
import { gfm as turndownPluginGfm } from 'joplin-turndown-plugin-gfm';

export async function parseMarkdown(
  html: string | null | undefined
): Promise<string> {
  if (!html) {
    return '';
  }

  const turndownService = new TurndownService();
  turndownService.addRule('inlineLink', {
    filter: function (node, options) {
      return !!(
        options.linkStyle === 'inlined' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
      );
    },
    replacement: function (content, node) {
      var href = (node as HTMLElement).getAttribute('href')?.trim();
      var title = (node as HTMLElement).title
        ? ' "' + (node as HTMLElement).title + '"'
        : '';
      return '[' + content.trim() + '](' + href + title + ')\n';
    },
  });
  var gfm = turndownPluginGfm.gfm;
  turndownService.use(gfm);

  try {
    let markdownContent = await turndownService.turndown(html);
    markdownContent = processMultiLineLinks(markdownContent);
    markdownContent = removeSkipToContentLinks(markdownContent);

    return markdownContent;
  } catch (error) {
    console.error('Error converting HTML to Markdown', { error });
    return ''; // Optionally return an empty string or handle the error as needed
  }
}

function processMultiLineLinks(markdownContent: string): string {
  let insideLinkContent = false;
  let newMarkdownContent = '';
  let linkOpenCount = 0;
  for (let i = 0; i < markdownContent.length; i++) {
    const char = markdownContent[i];

    if (char == '[') {
      linkOpenCount++;
    } else if (char == ']') {
      linkOpenCount = Math.max(0, linkOpenCount - 1);
    }
    insideLinkContent = linkOpenCount > 0;

    if (insideLinkContent && char == '\n') {
      newMarkdownContent += '\\' + '\n';
    } else {
      newMarkdownContent += char;
    }
  }
  return newMarkdownContent;
}

function removeSkipToContentLinks(markdownContent: string): string {
  // Remove [Skip to Content](#page) and [Skip to content](#skip)
  const newMarkdownContent = markdownContent.replace(
    // eslint-disable-next-line no-useless-escape
    /\[Skip to Content\]\(#[^\)]*\)/gi,
    ''
  );
  return newMarkdownContent;
}
