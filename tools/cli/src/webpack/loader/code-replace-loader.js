import { parseSync, printSync } from '@swc/core';

import ReplaceVisitor from './code-replace-visitor.mjs';

const tsReplaceLoader = function (source) {
  const resourcePath = this.resourcePath;
  // if (!resourcePath.includes('app-sidebar/app-download-button/index.tsx')) {
  //   return source;
  // }
  // if (resourcePath.includes('workspace/page-list-empty.tsx')) {
  // console.log(`Processing file: ${resourcePath}`);
  // console.log(`Original Source: ${source}`);
  const ast = parseSync(source, {
    syntax: 'typescript',
    tsx: true,
  });
  const visitor = new ReplaceVisitor(resourcePath.split('/').slice(-2).join('/'));
  const newAst = visitor.visitProgram(ast);
  const { code } = printSync(newAst, {
    inputSourceMap: true, // Preserves the source map if available
    sourceFileName: resourcePath,
  });
  // console.log('Modified Source:', code);
  return code;
};
export default tsReplaceLoader;
