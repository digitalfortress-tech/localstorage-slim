# localstorage-slim.js 

[![npm version](https://img.shields.io/npm/v/localstorage-slim.svg)](https://www.npmjs.com/package/localstorage-slim)
[![Build Status](https://travis-ci.org/niketpathak/localstorage-slim.svg?branch=master)](https://travis-ci.org/niketpathak/localstorage-slim) 
[![code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
![Downloads](https://img.shields.io/npm/dt/localstorage-slim) 
![maintained](https://img.shields.io/badge/maintained-yes-blueviolet) 
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---
An ultra slim localstorage wrapper with optional support for ttl

**localstorage-slim.js**

- is an pure JS localstorage wrapper with **ZERO DEPENDENCIES**!
- is a very light-weight library [![](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/localstorage-slim?compression=gzip)](https://cdn.jsdelivr.net/npm/localstorage-slim)
- supports TTL (i.e. expiry of data in LocalStorage)
- checks LocalStorage browser support internally
- Allows you to store data in any data format (strings, objects, arrays, ...) with checks for cyclic references
---

## Install

```shell script
# you can install typeahead with npm
$ npm install --save localstorage-slim

# Alternatively you can use Yarn
$ yarn add localstorage-slim
```
Then include the library in your App/Page.

**As a module,** 
```javascript
// using ES6 modules
import { ls } from 'localstorage-slim';

// using CommonJS modules
var ls = require('localstorage-slim');
```

**In the browser context,**
```html
<!-- Include the library -->
<script src="./node_modules/localstorage-slim/dist/localstorage-slim.js"></script>

<!-- Alternatively, you can use a CDN with jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/localstorage-slim"></script>
<!-- or with unpkg.com -->
<script src="https://unpkg.com/localstorage-slim@1.0.0/dist/localstorage-slim.js"></script>
```
The library will be available as a global object at `window.ls`

## Usage

Typical usage of localstorage-slim is as follows:


#### Html

```html
<!-- include the library -->
<script src="..." async></script>
```
#### Javascript

```javascript
// store in localstorage
const value = {
  a: new Date(),
  b: null,
  c: false,
  d: 'superman',
  e: 1234
}
ls.set('key1', value); // value can be anything (object, array, string, numbers,...)
ls.set('key2', value, 5000); // with optional ttl in milliseconds

// get from localstorage
const result1 = ls.get('key1');  // { a: "currentdate", b: "null", c: false, d: 'superman', e: 1234 }

// within 5 seconds
const result2 = ls.get('key2');  // { a: "currentdate", b: "null", c: false, d: 'superman', e: 1234 }
// after 5 seconds
const result2 = ls.get('key2');  // null

```

---

### Contribute

Interested in contributing features and fixes?

[Read more on contributing](./contributing.md).

### Changelog

See the [Changelog](https://github.com/niketpathak/localstorage-slim/wiki/Changelog)

### License

[MIT](LICENSE) © [Niket Pathak](https://niketpathak.com)