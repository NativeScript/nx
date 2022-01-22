export interface BuildBuilderSchema {
  debug?: boolean;
  device?: string;
  emulator?: boolean;
  clean?: boolean;
  noHmr?: boolean;
  uglify?: boolean;
  verbose?: boolean;
  release?: boolean;
  forDevice?: boolean;
  production?: boolean;
  platform?: 'ios' | 'android';
  copyTo?: string;
  force?: boolean;
  /** For running `ns prepare <platform>` */
  prepare:? boolean;

  // ios only
  provision?: string;

  // android only
  aab?: boolean;
  keyStorePath?: string;
  keyStorePassword?: string;
  keyStoreAlias?: string;
  keyStoreAliasPassword?: string;
}
