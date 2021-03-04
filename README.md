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
- supports encryption
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
<script src="https://unpkg.com/localstorage-slim@1.2.0/dist/localstorage-slim.js"></script>
```
The library will be available as a global object at `window.ls`

## Usage

Typical usage of localstorage-slim is as follows:

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
ls.set('key2', value, 5); // with optional ttl in seconds

// get from localstorage
const result1 = ls.get('key1');  // { a: "currentdate", b: "null", c: false, d: 'superman', e: 1234 }

// within 5 seconds
const result2 = ls.get('key2');  // { a: "currentdate", b: "null", c: false, d: 'superman', e: 1234 }
// after 5 seconds
const result2 = ls.get('key2');  // null

```

---
## Configuration

`LocalStorage-slim` provides you a config object (**`ls.config`**) which can be modified to suit your needs. The available config parameters are as follows:

| Parameter | Description | Default |
| --------- | ----------- | ------- |
|`global_ttl` [Optional]|Allows you to set a global timeout which will be used for all the data stored in localstorage. **Note:** `ttl` set using the `ls.set()` API overrides `global_ttl`  |null|
|`global_encrypt` [Optional]|Allows you to setup encryption of the data stored in localstorage. [Details](#encryption) **Note:** The `encrypt` option set using the `ls.set()` API overrides `global_encrypt` config option  | { enable: false }|
---

#### <a id="lsset">Encryption/Decryption</a>

LocalStorage-slim allows you to encrypt the data that will be stored in your localStorage.

```javascript
// enable encryption
ls.global_encrypt.enable = true;

// optionally use a different secret
ls.global_encrypt.secret = 57; // defaults to 75
```
Setting this single flag will ensure that the data stored in the localStorage will be unreadable by majority of your users. Note that the default implementation is not a true encryption but a mere obfuscation to keep the library light in weight. You can use a secure encryption algorithm with [CryptoJS](https://www.npmjs.com/package/crypto-js) to suit your needs. 

To do so, update the config option `global_encrypt` as follows -
```javascript
ls.global_encrypt = {
  enable: true, // boolean
  encrypter: (text: string, secret: string): string => 'encrypted string',
  decrypter: (encryptedString: string, secret: string): string => 'original string',
  secret: 'secretKey', // string|number
}

// use ls normally
ls.set(); // internally calls encrypter()
ls.get(); // internally calls decrypter()
```
As seen above, you can provide 2 functions - `encrypter` and `decrypter` with your own implementation of encryption/decryption
to secure your data. 

**Note**: It is recommended to not save user passwords or credit card details in LocalStorage (encrypted or not).
---

### API

* [`ls.set()`](#lsset)
* [`ls.get()`](#lsget)

#### <a id="lsset">ls.`set()`</a>

Sets an item in the LocalStorage. It can accept 4 arguments

1. `Key: string` **[Required]**
2. `Value: string|Date|Number|Object|Boolean|Null` **[Required]**
3. `ttl: Number` [Optional] (in seconds)
4. `encrypt: Encrypt` [Optional] { enable: boolean, encrypter: Fn(), decrypter: Fn(), secret: string|number}

Returns `false` if there was an error, else returns `undefined`.

```javascript
const res = ls.set('some_key', 'some_value');
console.log('Value =>', res); // undefined (data persisted to LS)

// with ttl
ls.set('some_key', 'some_value', 5); // value expires after 5s

// with encryption (to encrypt particular fields)
ls.set('some_key', 'some_value', null, { enable: true });
```

#### <a id="lsget">ls.`get()`</a>

Retrieves the Data associated with the key stored in the LocalStorage. Requires the `key: string` as an argument. If the passed key does not exist, it returns `null`.

It also accepts a 2nd optional parameter (`encrypt: Encrypt`).

```javascript
const value = ls.get('some_key');
console.log('Value =>', value); // value retrieved from LS

// When a particular field is encrypted, and it needs decryption
ls.get('some_key', { enable: true });
// Note: while using global_encrypt, the above option is not required
```

---

### Contribute

Interested in contributing features and fixes?

[Read more on contributing](./contributing.md).

### Changelog

See the [Changelog](https://github.com/niketpathak/localstorage-slim/wiki/Changelog)

### License

[MIT](LICENSE) © [Niket Pathak](https://niketpathak.com)