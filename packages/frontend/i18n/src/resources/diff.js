import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const useFileBKeys = [
  'Favorites',
  'Workspace description',
  'com.affine.nameWorkspace.description',
  'com.affine.onboarding.workspace-guide.content',
  'com.affine.rootAppSidebar.favorites',
];

function compareLangFiles(langA, langB) {
  // 读取JSON文件内容
  const fileA = fs.readFileSync(
    path.resolve(__dirname, `${langA}.json`),
    'utf-8'
  );
  const fileB = fs.readFileSync(
    path.resolve(__dirname, `${langB}.json`),
    'utf-8'
  );

  // 解析JSON文件内容为对象
  const dataA = JSON.parse(fileA);
  const dataB = JSON.parse(fileB);

  // 比较两个JSON对象的差异
  const onlyInB = {};
  const differentValues = {};

  for (const key in dataB) {
    if (!Object.prototype.hasOwnProperty.call(dataA, key)) {
      onlyInB[key] = dataB[key];
    } else if (dataA[key] !== dataB[key]) {
      if (useFileBKeys.includes(key)) {
        onlyInB[key] = dataB[key];
      } else {
        onlyInB[key] = dataA[key];
        differentValues[key] = {
          fileA: dataA[key],
          fileB: dataB[key],
        };
      }
    }
  }

  // 对 onlyInB 进行排序
  const sortedOnlyInB = Object.keys(onlyInB)
    .sort()
    .reduce((acc, key) => {
      acc[key] = onlyInB[key];
      return acc;
    }, {});

  console.log(`仅在 ${langB} 中存在的键：`);
  console.log(JSON.stringify(sortedOnlyInB, null, 2));

  console.log(`\n两个文件中都存在但值不同的键：`);
  console.log(JSON.stringify(differentValues, null, 2));
}

// 比较中文文件
compareLangFiles('zh-Hans', 'zh-Hans-wemem');

// 比较英文文件
compareLangFiles('en', 'en-wemem');
