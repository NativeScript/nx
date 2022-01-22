import type { Tree } from '@nrwl/devkit';
import * as ts from 'typescript';

function updateTsSourceFile(
  host: Tree,
  sourceFile: ts.SourceFile,
  filePath: string
): ts.SourceFile {
  const newFileContents = host.read(filePath).toString('utf-8');
  return sourceFile.update(newFileContents, {
    newLength: newFileContents.length,
    span: {
      length: sourceFile.text.length,
      start: 0,
    },
  });
}

export function insertChange(
  host: Tree,
  sourceFile: ts.SourceFile,
  filePath: string,
  insertPosition: number,
  contentToInsert: string
): ts.SourceFile {
  const content = host.read(filePath).toString();
  const prefix = content.substring(0, insertPosition);
  const suffix = content.substring(insertPosition);

  host.write(filePath, `${prefix}${contentToInsert}${suffix}`);

  return updateTsSourceFile(host, sourceFile, filePath);
}