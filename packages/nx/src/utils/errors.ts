import * as nxStringUtils from '@nx/devkit/src/utils/string-utils';
import { supportedFrameworks } from './general';

export function missingArgument(argName: string, description: string = '', example: string = '') {
  return `Missing ${argName} argument. ${description} ${example ? 'Example: ' + example : ''}`;
}

export function unsupportedFrameworkError(framework: string) {
  return `${framework} is currently not a supported framework. Supported at the moment: ${supportedFrameworks.map((f) => nxStringUtils.capitalize(f))}. Please request support for this framework if you'd like and/or submit a PR which we would greatly appreciate.`;
}

export function generateOptionError(type: string, missingFeature?: boolean) {
  const exampleCommand = `nx g ${type} my-${type} --feature=foo`;
  if (missingFeature) {
    return `You did not specify the name of the feature you'd like your ${type} to be a part of. For example: ${exampleCommand}`;
  } else {
    return `You did not specify the name of the ${type} you'd like to generate. For example: ${exampleCommand}`;
  }
}

export function generatorError(type: string) {
  return `If this is an app specific ${type}, please specify app names to generate the ${type} for with --apps=name,name2,etc. If you want to generate the ${type} for use across many apps, just specify the platforms you wish to build the ${type} for with --platforms=web,nativescript,etc.${
    type !== 'feature' ? ' and the feature you want them a part of with --feature=foo' : ''
  }`;
}
