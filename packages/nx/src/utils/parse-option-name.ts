export function parseOptionName(flag: string) {
  // strip just the option name from extra arguments
  // --provision='match AppStore my.bundle.com' > provision
  return flag.split('=')[0].replace('--', '');
}
