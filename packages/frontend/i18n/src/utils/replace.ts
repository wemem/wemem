// 定义 JSON 文件中可能出现的数据结构类型
interface JsonObject {
  [key: string]: any;
}

// 替换函数
export function replaceAffineWithReadease(obj: JsonObject) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // 递归调用替换子对象
      replaceAffineWithReadease(obj[key]);
    } else if (typeof obj[key] === 'string') {
      // 替换字符串中的 "affine" 为 "readease"
      obj[key] = obj[key].replace(/AFFiNE/g, 'Readease');
    }
  }
}
