import jscodeshift, { type API, type Stats } from 'jscodeshift';
import { type Compiler } from 'webpack';
import pkg from 'webpack';
const { sources } = pkg;

import transform from './codemod-replace-affine.js';

class CodemodPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.emit.tapAsync('CodemodPlugin', (compilation, callback) => {
      // 遍历所有输出的文件
      for (const filename in compilation.assets) {
        if (/\.(js|jsx|json)$/.test(filename)) {
          const asset = compilation.assets[filename];
          const originalSource = asset.source().toString();

          const api: API = {
            j: jscodeshift,
            jscodeshift: jscodeshift,
            stats: (() => {}) as unknown as Stats, // 创建一个空函数作为占位符
            report: (() => {}) as unknown as (msg: string) => void, // 创建一个空函数作为占位符
          };

          // 使用 codemod 函数处理文件内容
          const transformedSource = transform(
            {
              path: filename,
              source: originalSource,
            },
            api
          );

          // 使用 updateAsset 方法替换构建输出中的文件内容
          compilation.updateAsset(
            filename,
            new sources.RawSource(transformedSource)
          );
        }
      }
      callback();
    });
  }
}

export default CodemodPlugin;
