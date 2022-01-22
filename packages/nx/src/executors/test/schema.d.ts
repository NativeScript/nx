export interface TestBuilderSchema {
  platform?: 'ios' | 'android';
  coverage?: boolean;
  device?: string;
  force?: boolean;
}
