# NativeScript Plugin for Nx

<p align="center"><img src="https://raw.githubusercontent.com/nativescript/nx/master/tools/assets/images/nx-nativescript.jpg" width="600"></p>

<div align="center">

[![License](https://img.shields.io/npm/l/@nativescript/core.svg?style=flat-square)]()
[![NPM Version](https://badge.fury.io/js/%40nativescript%2Fnx.svg)](https://www.npmjs.com/@nativescript/nx)

</div>

**NOTE**: Under development right now. Not recommended to use yet.

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
  - [Release build](#release-build)
  - [Test/lint the app](#testlint-the-app)
- [Create NativeScript library](#create-nativescript-library)
  - [`--groupByName`](#--groupbyname-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting started

### Create a new Nx workspace

```sh
npx create-nx-workspace --cli=nx --preset=empty
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

Use this option to create a specific frontend framework integration app.

By default a "vanilla" NativeScript app will be generated using xml view files. 

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

### Develop on simulators and devices

**Android:**

```sh
npx nx run <app-name>:android
```

**iOS:** (Mac only)

```sh
npx nx run <app-name>:ios
```

### Release build

**Android:**

```sh
npx nx run <app-name>:android:build
```

**iOS:** (Mac only)

```sh
npx nx run <app-name>:ios:build
```


### Test/lint the app

```sh
npx nx run <app-name>:test
npx nx run <app-name>:lint
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

