/**
 * Maintains packages/nx/src/utils/versions.ts.
 *
 * Usage:
 *   npm run update-versions             # report current vs available versions
 *   npm run update-versions -- --write  # apply the proposed bumps to versions.ts
 *   npm run update-versions -- --check  # exit 1 if anything is outdated (CI)
 *
 * Policies:
 *   latest   follow the package's latest dist-tag (range prefix preserved)
 *   angular  follow the Angular major supported by NativeScript, i.e. the
 *            major of @nativescript/angular's latest release
 *   hold     never bumped automatically (compatibility-bound); latest is
 *            shown for reference only
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

type Policy = 'latest' | 'angular' | 'hold';

const POLICIES: Record<string, Policy> = {
  '@nativescript/core': 'latest',
  '@nativescript/types': 'latest',
  '@nativescript/webpack': 'latest',
  '@nativescript/ios': 'latest',
  '@nativescript/android': 'latest',
  '@nativescript/angular': 'angular',
  '@angular/animations': 'angular',
  '@angular/common': 'angular',
  '@angular/compiler': 'angular',
  '@angular/compiler-cli': 'angular',
  '@angular/core': 'angular',
  '@angular/forms': 'angular',
  '@angular/platform-browser': 'angular',
  '@angular/router': 'angular',
  '@angular-devkit/build-angular': 'angular',
  '@ngtools/webpack': 'angular',
  rxjs: 'hold', // follows Angular's peer range
  '@nativescript/tailwind': 'hold', // moves together with tailwindcss
  tailwindcss: 'hold', // must stay on a major supported by @nativescript/tailwind
  typescript: 'hold', // bounded by the Angular compiler's supported range
  ajv: 'latest',
};

const VERSIONS_FILE = join(__dirname, '..', 'packages', 'nx', 'src', 'utils', 'versions.ts');

function npmLatest(pkg: string): string {
  return execSync(`npm view ${pkg} dist-tags.latest`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function parseEntries(source: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const entryPattern = /(?:'([^']+)'|([A-Za-z$_][\w$]*)):\s*'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = entryPattern.exec(source)) !== null) {
    entries[match[1] || match[2]] = match[3];
  }
  return entries;
}

function rangePrefix(range: string): string {
  return range[0] === '^' || range[0] === '~' ? range[0] : '';
}

function majorMinor(version: string): { major: number; minor: number } {
  const parts = version.replace(/^[^\d]*/, '').split('.');
  return { major: parseInt(parts[0], 10), minor: parseInt(parts[1] || '0', 10) };
}

function pad(text: string, width: number): string {
  while (text.length < width) {
    text += ' ';
  }
  return text;
}

function main() {
  const write = process.argv.indexOf('--write') !== -1;
  const check = process.argv.indexOf('--check') !== -1;

  let source = readFileSync(VERSIONS_FILE, 'utf-8');
  const entries = parseEntries(source);

  const unknown = Object.keys(entries).filter((pkg) => !POLICIES[pkg]);
  if (unknown.length) {
    console.error(`No policy defined for: ${unknown.join(', ')} — add them to POLICIES in tools/update-versions.ts`);
    process.exit(1);
  }

  const angularMajor = majorMinor(npmLatest('@nativescript/angular')).major;

  let outdated = 0;
  const rows: string[][] = [['package', 'policy', 'current', 'target', 'status']];

  for (const pkg of Object.keys(entries)) {
    const current = entries[pkg];
    const policy = POLICIES[pkg];
    let target = current;
    let status = 'ok';

    try {
      const latest = npmLatest(pkg);
      if (policy === 'latest') {
        const { major, minor } = majorMinor(latest);
        target = `${rangePrefix(current) || '~'}${major}.${minor}.0`;
      } else if (policy === 'angular') {
        target = `^${angularMajor}.0.0`;
      } else {
        status = majorMinor(latest).major > majorMinor(current).major ? `held (latest ${latest})` : 'held';
      }
    } catch (e) {
      status = 'npm lookup failed';
    }

    if (policy !== 'hold' && target !== current) {
      outdated++;
      status = write ? `updated -> ${target}` : `outdated -> ${target}`;
      if (write) {
        const escaped = pkg.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
        source = source.replace(new RegExp(`((?:'${escaped}'|${escaped}):\\s*)'[^']+'`), `$1'${target}'`);
      }
    }

    rows.push([pkg, policy, current, target, status]);
  }

  const widths = rows[0].map((_, column) => Math.max(...rows.map((row) => row[column].length)));
  for (const row of rows) {
    console.log(row.map((cell, column) => pad(cell, widths[column] + 2)).join(''));
  }

  if (write && outdated) {
    writeFileSync(VERSIONS_FILE, source);
    console.log(`\nWrote ${outdated} update(s) to ${VERSIONS_FILE}`);
  } else if (outdated) {
    console.log(`\n${outdated} package(s) outdated. Run with --write to apply.`);
    if (check) {
      process.exit(1);
    }
  } else {
    console.log('\nAll versions match their policy.');
  }
}

main();
