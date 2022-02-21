export interface TestBuilderSchema {
  platform?: 'ios' | 'android';
  coverage?: boolean;
  device?: string;
  force?: boolean;
  flags?: string;
  id?: string;
}
