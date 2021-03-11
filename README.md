# localstorage-slim.js 

[![npm version](https://img.shields.io/npm/v/localstorage-slim.svg)](https://www.npmjs.com/package/localstorage-slim)
[![Build Status](https://travis-ci.org/niketpathak/localstorage-slim.svg?branch=master)](https://travis-ci.org/niketpathak/localstorage-slim) 
[![code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
![Downloads](https://img.shields.io/npm/dt/localstorage-slim) 
![maintained](https://img.shields.io/badge/maintained-yes-blueviolet) 
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---
An ultra slim localstorage wrapper with optional support for ttl and encryption

**localstorage-slim.js**

- is an pure JS localstorage wrapper with **ZERO DEPENDENCIES**!
- is a very light-weight library [![](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/localstorage-slim?compression=gzip)](https://cdn.jsdelivr.net/npm/localstorage-slim)
- supports TTL (i.e. expiry of data in LocalStorage)
- supports encryption/decryption
- checks LocalStorage browser support internally
- Allows you to store data in multiple formats (numbers, strings, objects, arrays, ...) with checks for cyclic references
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
<script src="https://unpkg.com/localstorage-slim@1.7.0/dist/localstorage-slim.js"></script>
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
ls.set('key2', value, { ttl: 5 }); // with optional ttl in seconds

// get from localstorage
const result1 = ls.get('key1');  // { a: "currentdate", b: "null", c: false, d: 'superman', e: 1234 }

// within 5 seconds
const result2 = ls.get('key2');  // { a: "currentdate", b: "null", c: false, d: 'superman', e: 1234 }
// after 5 seconds
const result2 = ls.get('key2');  // null

```

---
## <a id="config">Configuration</a>

`LocalStorage-slim` provides you a config object (**`ls.config`**) which can be modified to suit your needs. The available config parameters are as follows and all of them are completely **OPTIONAL**

| Parameter | Description | Default |
| --------- | ----------- | ------- |
|`ttl?: number\|null` |Allows you to set a global TTL(time to live) **in seconds** which will be used for every item stored in the localstorage. **Global `ttl`** can be overriden with the `ls.set()/ls.get()` API.|null|
|`enableEncryption?: boolean` |Allows you to setup encryption of the data stored in localstorage. [Details](#encryption) **Global `ttl`** can be overriden with the `ls.set()/ls.get()` API  | false|
|`encrypter?: (input: string, secret: string): string` |An encryption function whose signature can be seen on the left. A default implementation only obfuscates the value. This function can be overriden with the `ls.set()/ls.get()` API.  |Obfuscation|
|`decrypter?: (encryptedString: string, secret: string): string`|A decryption function whose signature can be seen on the left. A default implementation only performs deobfuscation. This function can be overriden with the `ls.set()/ls.get()` API.  |deobfuscation|
|`secret: unknown` |Allows you to set a secret key that will be passed to the encrypter/decrypter functions as a parameter. The default implementation accepts a number. **Global `secret`** can be overriden with the `ls.set()/ls.get()` API.  |75|
---

#### <a id="encryption">Encryption/Decryption</a>

LocalStorage-slim allows you to encrypt the data that will be stored in your localStorage.

```javascript
// enable encryption globally
ls.config.enableEncryption = true;

// optionally use a different secret key
ls.config.secret = 57;
```
Enabling encryption ensures that the data stored in your localStorage will be unreadable by majority of the users. **Be aware** of the fact that default implementation is not a true encryption but a mere obfuscation to keep the library light in weight. You can customize the `encrypter`/`decrypter` functions to use a secure encryption algorithm with [CryptoJS](https://www.npmjs.com/package/crypto-js) to suit your needs. 

To use a library like CryptoJS, update the following config options -
```javascript
// enable encryption
ls.config.enableEncryption = true;
// override encrypter function
ls.config.encrypter = (text: string, secret: string): string => 'encrypted string';
// override decrypter function
ls.config.decrypter = (encryptedString: string, secret: string): string => 'original string';
// set a secret
ls.config.secret = 'secretKey';

```
As seen, you can easily override the `encrypter` and `decrypter` functions with your own implementation of encryption/decryption logic to secure your data.

```javascript
// Then, use ls as you normally would
ls.set(...); // internally calls ls.config.encrypter(...);
ls.get(...); // internally calls ls.config.decrypter(...);

// you can encrypt a particular LS item by providing a different secret as well.
ls.set("key", "value", { secret: 'xyz'});
ls.get("key", { secret: 'xyz'});

```

**Note**: It is recommended that you **do not** save user passwords or credit card details in LocalStorage (whether they be encrypted or not).

---

## API

The Api is very similar to that of the native `LocalStorage API`.

* [`ls.set()`](#lsset)
* [`ls.get()`](#lsget)
* [`ls.remove()`](#lsremove)
* [`ls.clear()`](#lsclear)
* [`ls.flush()`](#lsflush)

---

#### <a id="lsset">ls.`set()`</a>

Sets an item in the LocalStorage. It can accept 4 arguments

1. `key: string` **[Required]** - The key with which the value should be associated
2. `value: string|Date|Number|Object|Boolean|Null` **[Required]** - The value to be stored
3. `localConfig: Config` **[Optional]** - This parameter takes the same parameters as the [global config](#config) object

Returns `false` if there was an error, else returns `undefined`.

```javascript
const res = ls.set('key', 'value');
console.log('Value =>', res); // returns undefined if successful or false if there was a problem

// with ttl
ls.config.ttl = 3; // global ttl set to 3 seconds
ls.set('key', 'value'); // value expires after 3s
ls.set('key', 'value', { ttl: 5 }); // value expires after 5s (overrides global ttl)

// with encryption (to encrypt particular fields)
ls.set('key', 'value', { enableEncryption: true });
```

#### <a id="lsget">ls.`get()`</a>

Retrieves the Data associated with the key stored in the LocalStorage. It accepts 2 arguments -

1. `key: string` **[Required]** - The key with which the value is associated
2. `localConfig: Config` **[Optional]** - This parameter takes the same parameters as the [global config](#config) object

If the passed key does not exist, it returns `null`.

```javascript
const value = ls.get('key');
console.log('Value =>', value); // value retrieved from LS

// if ttl was set
ls.get('key'); // returns the value if ttl has not expired, else returns null

// when a particular field is encrypted, and it needs decryption
ls.get('key', { enableEncryption: true });

// get decrypted value when global encryption is enabled
ls.config.enableEncryption = true;
ls.get('key'); // returns decrypted value
```

#### <a id="lsremove">ls.`remove()`</a>

Accepts the `key: string` as an argument to remove the data associated with it.

```javascript
// delete data from the LS
ls.remove('key'); // returns undefined if successful, false otherwise
```

#### <a id="lsclear">ls.`clear()`</a>

Clears the entire localstorage linked to the current domain.

```javascript
// removes all data from the LS
ls.clear(); // returns undefined if successful, false otherwise
```

#### <a id="lsflush">ls.`flush()`</a>

Flushes all expired items in the localStorage. This function is called once automatically on initialization. It can accept an optional argument `force: boolean` which is used to force-flush all items including the ones that haven't expired yet. Note that doing `flush(true);` will not remove items that had no TTL set on them.

```javascript
// removes all expired data (i.e. ttl has expired)
ls.flush();
// removes all data that have a ttl (i.e. even if the ttl has not expired)
ls.flush(true);
```
---

### Contribute

Interested in contributing features and fixes?

[Read more on contributing](./contributing.md).

### Changelog

See the [Changelog](https://github.com/niketpathak/localstorage-slim/wiki/Changelog)

### License

[MIT](LICENSE) © [Niket Pathak](https://niketpathak.com)