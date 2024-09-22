// 替换函数
function replaceAffine(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // 递归调用替换子对象
      replaceAffine(obj[key]);
    } else if (typeof obj[key] === 'string') {
      // 替换字符串中的 "affine" 为 "wemem"
      obj[key] = obj[key]
        .replace(/Cloud 同步/g, '云同步')
        .replace(/Cloud 服务/g, '云同步')
        .replace(/Cloud /g, '云同步')
        .replace(/AFFiNE/g, 'Wemem');
    }
  }
  return obj;
}
const jsonReplaceLoader = function (source) {
  const jsonObject = JSON.parse(source);
  replaceAffine(jsonObject);
  return JSON.stringify(jsonObject, null, 2);
};
export default jsonReplaceLoader;
