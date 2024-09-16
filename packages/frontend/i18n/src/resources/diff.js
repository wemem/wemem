// node --experimental-modules diff.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 读取JSON文件内容
const fileA = fs.readFileSync(path.resolve(__dirname, 'en.json'), 'utf-8');
const fileB = fs.readFileSync(
  path.resolve(__dirname, 'en-wemem.json'),
  'utf-8'
);

// 解析JSON文件内容为对象
const dataA = JSON.parse(fileA);
const dataB = JSON.parse(fileB);

// 比较两个JSON对象的差异
const diff = {};

for (const key in dataA) {
  if (!dataB.hasOwnProperty(key)) {
    diff[key] = dataA[key];
  }
}

let keys = Object.keys(diff).sort();

// 构建新的排序后的对象
let sortedObj = {};
keys.forEach(function (key) {
  sortedObj[key] = diff[key];
});

console.log(JSON.stringify(sortedObj, null, 4));
