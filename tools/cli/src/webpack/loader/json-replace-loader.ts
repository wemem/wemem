import type { LoaderDefinitionFunction } from 'webpack';

// 替换函数
function replaceAffine(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // 递归调用替换子对象
      replaceAffine(obj[key]);
    } else if (typeof obj[key] === 'string') {
      // 替换字符串中的 "affine" 为 "readease"
      obj[key] = obj[key].replace(/AFFiNE/g, 'Wemem');
    }
  }

  return obj;
}

const jsonReplaceLoader: LoaderDefinitionFunction = function (source) {
  const jsonObject = JSON.parse(source as string);
  replaceAffine(jsonObject);
  return JSON.stringify(jsonObject, null, 2);
};

export default jsonReplaceLoader;
