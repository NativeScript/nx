# NativeScript Plugin for Nx

<p align="center"><img src="https://raw.githubusercontent.com/nativescript/nx/master/tools/assets/images/nx-nativescript.jpg" width="600"></p>

<div align="center">

[![License](https://img.shields.io/npm/l/@nativescript/core.svg?style=flat-square)]()
[![NPM Version](https://badge.fury.io/js/%40nativescript%2Fnx.svg)](https://www.npmjs.com/@nativescript/nx)

</div>

> Requires at least NativeScript CLI v8.x.x or higher. You can confirm your CLI version by running `ns --version`.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Getting started](#getting-started)
  - [Create a new Nx workspace](#create-a-new-nx-workspace)
  - [Install NativeScript plugin](#install-nativescript-plugin)
  - [Create an app](#create-an-app)
    - [`--framework [angular]`](#--framework-angular)
    - [`--groupByName`](#--groupbyname)
    - [Develop on simulators and devices](#develop-on-simulators-and-devices)
    - [Configuration options](#configuration-options)
    - [Run with a specific configuration](#run-with-a-specific-configuration)
    - [Create a build](#create-a-build)
    - [Clean](#clean)
- [Create NativeScript library](#create-nativescript-library)
  - [`--groupByName`](#--groupbyname-1)
- [Using NativeScript plugins](#using-nativescript-plugins)
  - [Installing NativeScript plugins at app-level](#installing-nativescript-plugins-at-app-level)
  - [Installing NativeScript plugins at workspace-level](#installing-nativescript-plugins-at-workspace-level)
  - [Known issues](#known-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting started

### Create a new Nx workspace

```sh
npx create-nx-workspace@latest --cli=nx --preset=empty

// If you run into any issue with latest Nx workspace version you may want to try the last known stable version with the following:
npx create-nx-workspace@12.4 --cli=nx --preset=empty
```

### Install NativeScript plugin

```sh
# Using npm
npm install --save-dev @nativescript/nx

# Using yarn
yarn add -D @nativescript/nx
```

### Create an app

```sh
npx nx g @nativescript/nx:app <app-name> [...options]
```

This will generate: 

```
apps/nativescript-<app-name>
```

The NativeScript Nx plugin will prefix apps by default to help distinguish them against other apps in your workspace for clarity. 

#### `--framework [angular]`

You will be prompted to choose a framework when this flag is ommitted.

Use this option to explicitly choose a specific frontend framework integration app.

This setting will be saved with plugin settings the first time it's used to automatically choose this frontend framework integration for subsequent usages and with other generators without having to specify the flag again.

#### `--groupByName`

If you prefer you can also provide a flag to suffix instead:

```sh
npx nx g @nativescript/nx:app <app-name> --groupByName
```

This will generate: 

```
apps/<app-name>-nativescript
```

#### Develop on simulators and devices

**Android:**

```sh
npx nx run <app-name>:android
```

**iOS:** (Mac only)

```sh
npx nx run <app-name>:ios
```

#### Configuration options

A custom builder is provided via `@nativescript/nx:build` with the following options:

```
"debug": {
  "type": "boolean",
  "default": true,
  "description": "Use 'ns debug' instead of 'ns run'. Defaults to true"
},
"device": {
  "type": "string",
  "description": "Device identifier to run app on.",
  "alias": "d"
},
"emulator": {
  "type": "boolean",
  "default": false,
  "description": "Explicitly run with an emulator or simulator"
},
"noHmr": {
  "type": "boolean",
  "default": false,
  "description": "Disable HMR"
},
"uglify": {
  "type": "boolean",
  "default": false,
  "description": "Enable uglify during the webpack build"
},
"verbose": {
  "type": "boolean",
  "default": false,
  "description": "Enable verbose logging"
},
"release": {
  "type": "boolean",
  "default": false,
  "description": "Enable release mode during build using the --release flag"
},
"forDevice": {
  "type": "boolean",
  "default": false,
  "description": "Build in device mode using the --for-device flag"
},
"production": {
  "type": "boolean",
  "default": false,
  "description": "Build in production mode using the --env.production flag"
},
"copyTo": {
  "type": "string",
  "description": "When building, copy the package to this location."
},
"provision": {
  "type": "string",
  "description": "(iOS Only) When building, use this provision profile name."
},
"aab": {
  "type": "boolean",
  "default": false,
  "description": "(Android Only) When building, create an Android App Bundle (.aab file)."
},
"keyStorePath": {
  "type": "string",
  "description": "(Android Only) When building, use the keystore file at this location."
},
"keyStorePassword": {
  "type": "string",
  "description": "(Android Only) When building, use this keystore password."
},
"keyStoreAlias": {
  "type": "string",
  "description": "(Android Only) When building, use this keystore alias."
},
"keyStoreAliasPassword": {
  "type": "string",
  "description": "(Android Only) When building, use this keystore alias password."
}
```

The options follow the [NativeScript command line option flags](https://docs.nativescript.org/development-workflow.html#run).

Here's an example app config:

```
"nativescript-mobile": {
  "projectType": "application",
  "root": "apps/nativescript-mobile/",
  "sourceRoot": "apps/nativescript-mobile/src",
  "prefix": "",
  "targets": {
    "build": {
      "builder": "@nativescript/nx:build",
      "options": {
        "noHmr": true,
        "production": true,
        "uglify": true,
        "release": true,
        "forDevice": true
      },
      "configurations": {
        "prod": {
          "fileReplacements": [
            {
              "replace": "./src/environments/environment.ts",
              "with": "./src/environments/environment.prod.ts"
            }
          ]
        }
      }
    },
    "ios": {
      "builder": "@nativescript/nx:build",
      "options": {
        "platform": "ios"
      },
      "configurations": {
        "build": {
          "provision": "AppStore Profile",
          "copyTo": "./dist/build.ipa"
        },
        "prod": {
          "combineWithConfig": "build:prod"
        }
      }
    },
    "android": {
      "builder": "@nativescript/nx:build",
      "options": {
        "platform": "android"
      },
      "configurations": {
        "build": {
          "aab": true,
          "keyStorePath": "./tools/keystore.jks",
          "keyStorePassword": "your-password",
          "keyStoreAlias": "keystore-alias",
          "keyStoreAliasPassword": "keystore-alias-password",
          "copyTo": "./dist/build.aab"
        },
        "prod": {
          "combineWithConfig": "build:prod"
        }
      }
    },
    "clean": {
      "builder": "@nativescript/nx:build",
      "options": {
        "clean": true
      }
    }
  }
}
```

#### Run with a specific configuration

**Android:**

```sh
npx nx run <app-name>:android:prod
```

**iOS:** (Mac only)

```sh
npx nx run <app-name>:ios:prod
```

#### Create a build

Instead of running the app on a simulator or device you can create a build for the purposes of distribution/release. Various release settings will be needed for iOS and Android which can be passed as additional command line arguments. [See more in the NativeScript docs here](https://docs.nativescript.org/releasing.html#overview). Any additional cli flags as stated in the docs can be passed on the end of the `nx build` command that follows.

The key difference is usage of `nx build` instead of `nx run`.

Build with an environment configuration enabled (for example, with `prod`):

**Android:**

```sh
npx nx build <app-name>:android:prod
```

You can pass additional NativeScript CLI options as flags on the end of you build command.

* example of building AAB bundle for upload to Google Play:

```
npx nx build <app-name>:android:prod \
  --aab \
  --key-store-path <path-to-your-keystore> \
  --key-store-password <your-key-store-password> \
  --key-store-alias <your-alias-name> \
  --key-store-alias-password <your-alias-password> \
  --copy-to ./dist/build.aab
```

**iOS:** (Mac only)

```sh
npx nx build <app-name>:ios:prod
```

As mentioned, you can pass any additional NativeScript CLI options as flags on the end of your nx build command:

* example of building IPA for upload to iOS TestFlight:

```
npx nx build <app-name>:ios:prod \
  --provision <provisioning-profile-name> \
  --copy-to ./dist/build.ipa
```

#### Clean

It can be helpful to clean the app at times. This will clear out old dependencies plus iOS/Android platform files to give your app a nice reset.

```sh
npx nx run <app-name>:clean
```

## Create NativeScript library

You can create a library of NativeScript components or plugins or whatever you'd like.

```sh
npx nx g @nativescript/nx:lib buttons
```

This will generate a `nativescript-buttons` library where you could build out an entire suite of button behaviors and styles for your NativeScript apps.

```ts
import { PrimaryButton } from '@myorg/nativescript-buttons';
```

The NativeScript Nx plugin will prefix libraries by default to help distinguish them against other apps and libraries in your workspace for clarity. 

### `--groupByName`

If you prefer you can also provide a flag to suffix instead:

```sh
npx nx g @nativescript/nx:lib buttons --groupByName
```

Which would generate a `buttons-nativescript` library.

```ts
import { PrimaryButton } from '@myorg/buttons-nativescript';
```


## Using NativeScript plugins

NativeScript plugins can be used in Nx workspaces in one of the two following methods:

### Installing NativeScript plugins at app-level

If the plugin is needed by one app only, and not others, you can install it for the specific app:

```sh
cd apps/<app-name>
ns plugin add <plugin-name>
```

### Installing NativeScript plugins at workspace-level

Alternatively, you can install the plugins at the workspace (root), so it is accesible to all your workspace apps:
```sh
npm install --save <plugin-name>
```

### Known issues
If a plugin contains platforms folder with native includes, the plugin must be added to app package.json at moment. https://github.com/NativeScript/nx/issues/17#issuecomment-841680719
