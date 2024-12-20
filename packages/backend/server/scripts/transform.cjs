const { parseSync, printSync } = require('@swc/core');

const ReplaceVisitor =
  require('./../../../../tools/cli/src/webpack/loader/code-replace-visitor.mjs').default;

module.exports = function (fileInfo) {
  // 跳过.d.ts结尾的文件
  if (fileInfo.path.endsWith('.d.ts') || fileInfo.path.endsWith('.gen.ts')) {
    return fileInfo.source;
  }

  // if (!fileInfo.path.includes('fundamentals/mailer/template.js')) {
  //   return fileInfo.source;
  // }

  const source = fileInfo.source;
  const ast = parseSync(source, {
    syntax: 'typescript',
    tsx: true,
  });

  const visitor = new ReplaceVisitor(fileInfo.path.split('/').slice(-2).join('/'));
  const newAst = visitor.visitProgram(ast);

  const { code } = printSync(newAst, {
    inputSourceMap: true,
    sourceFileName: fileInfo.path,
  });

  return code;
};
