import { chain, Rule } from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  addPackageWithInit,
  updateWorkspace,
} from '@nrwl/workspace';
import { Schema } from './schema';
import {
  nsCoreVersion,
  nsThemeVersion,
  nxVersion,
} from '../../utils/versions';
import { JsonObject } from '@angular-devkit/core';

export default function (schema: Schema) {
  return chain([
    setWorkspaceDefaults(),
    addPackageWithInit('@nrwl/jest'),
    addDependencies(),
  ]);
}

export function addDependencies(): Rule {
  return addDepsToPackageJson(
    {
      '@nativescript/core': nsCoreVersion,
      '@nativescript/theme': nsThemeVersion,
    },
    {}
  );
}

function setWorkspaceDefaults(): Rule {
  return updateWorkspace((workspace) => {
    workspace.extensions.cli = workspace.extensions.cli || {};
    const defaultCollection: string =
      workspace.extensions.cli &&
      ((workspace.extensions.cli as JsonObject).defaultCollection as string);

    if (!defaultCollection) {
      (workspace.extensions.cli as JsonObject).defaultCollection =
        '@nativescript/nx';
    }
  });
}