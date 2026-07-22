/**
 * Versions the generators install into user workspaces, keyed by npm package name.
 *
 * The Angular entries double as the NativeScript<->Angular compatibility record:
 * `@nativescript/angular` publishes no peerDependencies, so this map is the only
 * place the supported Angular range is encoded.
 *
 * Maintained with `npm run update-versions` (tools/update-versions.ts), which
 * also defines the per-package bump policy.
 */
export const versions = {
  // NativeScript
  '@nativescript/core': '~9.0.0',
  '@nativescript/types': '~9.0.0',
  '@nativescript/webpack': '~5.0.0',
  '@nativescript/ios': '~9.0.0',
  '@nativescript/android': '~9.0.0',

  // Angular
  '@nativescript/angular': '^22.0.0',
  '@angular/animations': '^22.0.0',
  '@angular/common': '^22.0.0',
  '@angular/compiler': '^22.0.0',
  '@angular/compiler-cli': '^22.0.0',
  '@angular/core': '^22.0.0',
  '@angular/forms': '^22.0.0',
  '@angular/platform-browser': '^22.0.0',
  '@angular/router': '^22.0.0',
  // required by @nativescript/webpack's Angular integration
  '@angular-devkit/build-angular': '^22.0.0',
  '@ngtools/webpack': '^22.0.0',
  rxjs: '~7.8.0',

  // Tooling
  '@nativescript/tailwind': '^2.1.0',
  tailwindcss: '~3.4.0',
  typescript: '~6.0.0',
  ajv: '~8.20.0',
} as const;

export type VersionedPackage = keyof typeof versions;
