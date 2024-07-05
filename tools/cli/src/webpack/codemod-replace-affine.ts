import type {
  API,
  FileInfo,
  JSXAttribute,
  JSXElement,
  JSXText,
} from 'jscodeshift';

const transform = (fileInfo: FileInfo, api: API) => {
  if (fileInfo.path.endsWith('.json')) {
    console.log(`Processing file: ${fileInfo.path}`);
  }
  const j = api.jscodeshift;
  // Replace text in JSON content
  if (fileInfo.path.endsWith('.json')) {
    const jsonContent = JSON.parse(fileInfo.source);
    const updatedJsonContent = JSON.stringify(
      jsonContent,
      (key, value) => {
        if (typeof value === 'string' && value.includes('AFFiNE')) {
          console.log(`Replacements made in file: ${fileInfo.path}`);
          return value.replace(/AFFiNE/g, 'Readease');
        }
        return value;
      },
      2
    ); // 2 spaces for indentation
    return updatedJsonContent;
  } else {
    const root = j(fileInfo.source);
    // Replace text in JSX elements
    root.find(j.JSXText).forEach(path => {
      const node = path.node as JSXText;
      if (node.value.includes('AFFiNE')) {
        node.value = node.value.replace(/AFFiNE/g, 'Readease');
        console.log(`Replacements made in file: ${fileInfo.path}`);
      }
    });

    // Replace text in JSX attributes
    root.find(j.JSXAttribute).forEach(path => {
      const node = path.node as JSXAttribute;
      if (
        node.value &&
        node.value.type === 'Literal' &&
        typeof node.value.value === 'string' &&
        node.value.value.includes('AFFiNE')
      ) {
        node.value.value = node.value.value.replace(/AFFiNE/g, 'Readease');
        console.log(`Replacements made in file: ${fileInfo.path}`);
      }
    });

    // Replace text in JSX elements
    root.findJSXElements().forEach((path: { node: JSXElement }) => {
      const { node } = path;
      j(node)
        .find(j.JSXText)
        .forEach(textPath => {
          const { node: textNode } = textPath;
          console.log('textNode.value', textNode.value);
          if (textNode.value.includes('AFFiNE')) {
            textNode.value = textNode.value.replace(/AFFiNE/g, 'readease');
            console.log(`Replacements made in file: ${fileInfo.path}`);
          }
        });
    });

    return root.toSource();
  }
};

export default transform;
