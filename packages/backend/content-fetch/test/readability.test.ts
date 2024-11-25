import { parsePreparedContent } from '../src/readability';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testHtmlPath = path.join(__dirname, 'ssp.html');
const testHtml = readFileSync(testHtmlPath, 'utf-8');

const url = 'https://test.com/article';
const preparedDocument = {
    content: testHtml,
    pageInfo: {
        title: '测试文章',
        canonicalUrl: url,
    },
};

const result = await parsePreparedContent(url, preparedDocument);

console.log("resultresultresultresult",result);