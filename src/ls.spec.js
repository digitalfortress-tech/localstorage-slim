/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import ls from './ls';
import AES from 'crypto-js/aes';
import encUTF8 from 'crypto-js/enc-utf8';

const testObj = {
  type: 'DC heroes',
  superman: {
    name: 'Clark kent',
    hero: true,
    strength: 100,
    weak: false,
    weird: null,
    abilities: ['heat vision', 'speed'],
  },
};

const testArr = ['Apple', 13, true, null, false, 14.5, { ironman: 'Tony Stark' }];

describe('LS wrapper', () => {
  afterEach(() => {
    global.localStorage.clear();
    ls.config.ttl = null;
    ls.config.encrypt = false;
    ls.config.secret = 75;
  });

  it('expired items should be flushed on Init', async () => {
    localStorage.setItem('key1', JSON.stringify({ '\u0000': 'value1', ttl: 1615476122549 })); // ttl is expired
    localStorage.setItem('key2', JSON.stringify({ '\u0000': 'value2', ttl: 1615476122549 })); // ttl is expired
    localStorage.setItem('key3', 'value3'); // ttl is expired
    expect(localStorage.getItem('key1')).toBe('{"\\u0000":"value1","ttl":1615476122549}');
    expect(localStorage.getItem('key2')).toBe('{"\\u0000":"value2","ttl":1615476122549}');

    ls.set('key', 'value'); // call to any API method on init, calls flush() internally
    expect(localStorage.getItem('key1')).toBe(null);
    expect(localStorage.getItem('key2')).toBe(null);
    expect(localStorage.getItem('key3')).toBe('value3');
  });

  it('Calling get() with non-existent key should return null', () => {
    expect(ls.get('some_key')).toBe(null);
  });

  it('Calling set() with/without ttl should return undefined', () => {
    expect(ls.set('some_key', 'some_value')).toBe(undefined);
    expect(ls.set('some_key1', 'some_value1', { ttl: 3 })).toBe(undefined);
  });

  it('LS should set(), get() correct value (with/without ttl)', async () => {
    // string values
    ls.set('some_key', 'some_value');
    expect(ls.get('some_key')).toBe('some_value');
    ls.set('some_key1', 'some_value1', { ttl: 3 });
    expect(ls.get('some_key1')).toBe('some_value1');
    const val = JSON.parse(localStorage.getItem('some_key1'));
    expect(typeof val.ttl).toBe('number');

    // objects
    const inputObj = {
      a: null,
      b: undefined,
      c: 'xyz',
      d: new Date('2021/2/27 11:00:00 GMT').toUTCString(),
      e: ['x', 1, { z: false }],
    };
    const outputObj = {
      a: null,
      c: 'xyz',
      d: 'Sat, 27 Feb 2021 11:00:00 GMT',
      e: ['x', 1, { z: false }],
    };
    ls.set('some_object', inputObj);
    expect(ls.get('some_object')).toStrictEqual(outputObj);
    ls.set('some_object', inputObj, { ttl: 3 });
    expect(ls.get('some_object')).toStrictEqual(outputObj);

    // arrays
    const inputArr = [
      'a',
      1,
      null,
      true,
      false,
      undefined,
      new Date('2021/2/27 11:00:00 GMT').toUTCString(),
      { x: undefined, y: 'yellow' },
    ];
    const outputArr = ['a', 1, null, true, false, null, 'Sat, 27 Feb 2021 11:00:00 GMT', { y: 'yellow' }];
    ls.set('some_array', inputArr);
    expect(ls.get('some_array')).toStrictEqual(outputArr);
    ls.set('some_array', inputArr, { ttl: 2 });
    expect(ls.get('some_array')).toStrictEqual(outputArr);

    // exceptional cases: setting ttl as value inside an object
    const exp = {
      ttl: 3,
      value: 'xyz',
    };

    ls.set('some_object', exp);
    expect(ls.get('some_object')).toStrictEqual(exp);
    ls.set('some_object', exp, { ttl: 0.2 });
    expect(ls.get('some_object')).toStrictEqual(exp);

    // should expire after 0.5s and not after 3s
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_object')).toBe(null);
  });

  it('Calling get() should return null after ttl expires', async () => {
    ls.set('some_key', 'some_value', { ttl: 0.1 });
    expect(ls.get('some_key')).toBe('some_value');

    await new Promise((res) => setTimeout(res, 150));
    expect(ls.get('some_key')).toBe(null);

    ls.set('some_key', testObj, { ttl: 0.2 });
    expect(ls.get('some_key')).toStrictEqual(testObj);
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);
  });

  it('Calling get() should return null after global ttl expires', async () => {
    ls.config.ttl = 0.2;
    ls.set('some_key', 'some_value');
    expect(ls.get('some_key')).toBe('some_value');

    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);

    ls.set('some_key', testObj);
    expect(ls.get('some_key')).toStrictEqual(testObj);
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);
  });

  it('Local ttl should take precedence over global ttl (conf)', async () => {
    ls.config.ttl = 0.01;
    ls.set('some_key', 'some_value', { ttl: 0.1 });
    expect(ls.get('some_key')).toBe('some_value');

    // after global ttl
    await new Promise((res) => setTimeout(res, 50));
    expect(ls.get('some_key')).toBe('some_value');

    // after local ttl
    await new Promise((res) => setTimeout(res, 150));
    expect(ls.get('some_key')).toBe(null);

    ls.set('some_key', 'some_value', { ttl: null });
    await new Promise((res) => setTimeout(res, 150));
    expect(ls.get('some_key')).toBe('some_value');
  });

  it('When global ttl is enabled, Disable ttl for only a particular item', async () => {
    ls.config.ttl = 0.2;
    ls.set('some_key', 'some_value', { ttl: null });
    ls.set('some_array', testArr, { ttl: null });

    expect(ls.get('some_key')).toBe('some_value');

    // after global ttl, val should not be expired
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe('some_value');
    expect(ls.get('some_array')).toStrictEqual(testArr);
  });

  it('should encrypt the data with default implementation when encryption is enabled', () => {
    ls.config.encrypt = true;

    // encrypt string
    ls.set('some_key', 'value');
    expect(localStorage.getItem('some_key')).toBe('"mÁ¬·À°m"');
    expect(ls.get('some_key')).toBe('value');

    // encrypt object
    ls.set('my object', testObj);
    expect(localStorage.getItem('my object')).toBe(
      '"Æm¿Ä»°mmk³°½º°¾mwm¾À»°½¸¬¹mÆm¹¬¸°mm·¬½¶k¶°¹¿mwm³°½ºm¿½À°wm¾¿½°¹²¿³m|{{wmÂ°¬¶m±¬·¾°wmÂ°´½¯m¹À··wm¬­´·´¿´°¾m¦m³°¬¿kÁ´¾´º¹mwm¾»°°¯m¨ÈÈ"'
    );
    expect(ls.get('my object')).toStrictEqual(testObj);

    // encrypt Array
    ls.set('myArray', testArr);
    expect(localStorage.getItem('myArray')).toBe('"¦m»»·°mw|~w¿½À°w¹À··w±¬·¾°w|ywÆm´½º¹¸¬¹mmº¹Äk¿¬½¶mÈ¨"');
    expect(ls.get('myArray')).toStrictEqual(testArr);
  });

  it('should encrypt only a particular field', () => {
    ls.config.encrypt = false;
    ls.set('some_key', 'value', { encrypt: true });
    expect(localStorage.getItem('some_key')).toBe('"mÁ¬·À°m"');
    // calling get() without encrypt set to true
    expect(ls.get('some_key')).toBe('mÁ¬·À°m');
    expect(ls.get('some_key', { encrypt: true })).toBe('value');

    // objects
    ls.set('plainObj', testObj);
    expect(ls.get('plainObj')).toStrictEqual(testObj);
    expect(ls.get('plainObj', { encrypt: true })).toStrictEqual(testObj); // should work even if erroneous flag is set
    ls.set('my object', testObj, { encrypt: true });
    expect(ls.get('my object')).toBe(
      'Æm¿Ä»°mmk³°½º°¾mwm¾À»°½¸¬¹mÆm¹¬¸°mm·¬½¶k¶°¹¿mwm³°½ºm¿½À°wm¾¿½°¹²¿³m|{{wmÂ°¬¶m±¬·¾°wmÂ°´½¯m¹À··wm¬­´·´¿´°¾m¦m³°¬¿kÁ´¾´º¹mwm¾»°°¯m¨ÈÈ'
    );
    expect(ls.get('my object', { decrypt: true })).toStrictEqual(testObj);

    // arrays
    ls.set('plainArr', testArr);
    expect(ls.get('plainArr')).toStrictEqual(testArr);
    expect(ls.get('plainArr', { encrypt: true })).toStrictEqual(testArr); // should work even if erroneous flag is set
    expect(ls.get('plainArr', { decrypt: true })).toStrictEqual(testArr); // should work even if erroneous flag is set
    ls.set('myArray', testArr, { encrypt: true });
    expect(ls.get('myArray')).toBe('¦m»»·°mw|~w¿½À°w¹À··w±¬·¾°w|ywÆm´½º¹¸¬¹mmº¹Äk¿¬½¶mÈ¨');
    expect(ls.get('myArray', { decrypt: true })).toStrictEqual(testArr);
  });

  it('When global encryption is enabled, using a custom secret must work', () => {
    ls.config.encrypt = true;
    ls.set('some_key', 'value', { secret: 83 });
    expect(localStorage.getItem('some_key')).toBe('"uÉ´¿È¸u"');
    expect(ls.get('some_key', { secret: 83 })).toBe('value');
    // if secret is not provided, NO fall back to global secret, return encrypted value
    expect(ls.get('some_key')).toBe('uÉ´¿È¸u');
    // if correct secret is not provided, return encrypted value
    expect(ls.get('some_key', { secret: 5 })).toBe('uÉ´¿È¸u');

    // objects
    ls.set('plainObj', testObj, { secret: 95 });
    expect(ls.get('plainObj')).toBe(
      'ÚÓØÏÄ£¢ÇÄÑÎÄÒÒÔÏÄÑÌÀÍÚÍÀÌÄ¢ËÀÑÊÊÄÍÓÇÄÑÎÓÑÔÄÒÓÑÄÍÆÓÇÖÄÀÊÅÀËÒÄÖÄÈÑÃÍÔËËÀÁÈËÈÓÈÄÒºÇÄÀÓÕÈÒÈÎÍÒÏÄÄÃ¼ÜÜ'
    );
    expect(ls.get('plainObj', { secret: 91 })).toBe(
      'ÚÓØÏÄ£¢ÇÄÑÎÄÒÒÔÏÄÑÌÀÍÚÍÀÌÄ¢ËÀÑÊÊÄÍÓÇÄÑÎÓÑÔÄÒÓÑÄÍÆÓÇÖÄÀÊÅÀËÒÄÖÄÈÑÃÍÔËËÀÁÈËÈÓÈÄÒºÇÄÀÓÕÈÒÈÎÍÒÏÄÄÃ¼ÜÜ'
    );
    expect(ls.get('plainObj', { secret: 95 })).toStrictEqual(testObj);
  });

  it('local encrypt param should take precedence over global encrypt config param', () => {
    ls.config.encrypt = true;
    ls.set('some_key', 'value', { encrypt: false });
    expect(localStorage.getItem('some_key')).toBe('"value"');

    // if it was not encrypted, return raw value
    expect(ls.get('some_key')).toBe('value');
    expect(ls.get('some_key', { decrypt: false })).toBe('value');

    // objects
    ls.set('plainObj', testObj, { encrypt: false });
    expect(ls.get('plainObj')).toStrictEqual(testObj);
    expect(ls.get('plainObj', { decrypt: false })).toStrictEqual(testObj);

    // arrays
    ls.set('myArray', testArr, { encrypt: false });
    expect(ls.get('myArray')).toStrictEqual(testArr);
    expect(ls.get('myArray', { decrypt: false })).toStrictEqual(testArr);
  });

  it('should return raw Data when trying to decrypt unencrypted data', () => {
    ls.set('some_key', 'value');
    expect(ls.get('some_key')).toBe('value');
    expect(ls.get('some_key', { decrypt: true })).toBe('value');

    // objects
    ls.set('test-obj', testObj);
    expect(ls.get('test-obj', { decrypt: true })).toStrictEqual(testObj);
  });

  it('should return null when encrypted value has expired', async () => {
    ls.config.ttl = 0.1;
    ls.config.encrypt = true;
    ls.set('some_key', 'value');
    expect(ls.get('some_key')).toBe('value');

    await new Promise((res) => setTimeout(res, 150));
    expect(ls.get('some_key')).toBe(null);

    // objects
    ls.set('some_key', testObj);
    expect(ls.get('some_key')).toStrictEqual(testObj);
    await new Promise((res) => setTimeout(res, 150));
    expect(ls.get('some_key')).toBe(null);

    ls.config.encrypt = false;
    ls.set('some_key', testObj, { encrypt: true });
    await new Promise((res) => setTimeout(res, 150));
    expect(ls.get('some_key')).toBe(null);
  });

  it('should encrypt the data with custom implementation', () => {
    ls.config.encrypt = true;
    const encrypt = ls.config.encrypter;
    const decrypt = ls.config.decrypter;
    ls.config.encrypter = jest.fn(() => 'mÁ¬·À°m');
    ls.config.decrypter = jest.fn(() => '"value"');

    ls.set('some_key', 'value');
    expect(ls.config.encrypter).toHaveBeenCalled();
    expect(ls.get('some_key')).toBe('"value"');
    expect(ls.config.decrypter).toHaveBeenCalled();

    // restore functions
    ls.config.encrypter = encrypt;
    ls.config.decrypter = decrypt;
  });

  it('when encryption is enabled and ttl is provided, ttl should not be encrypted', () => {
    ls.config.encrypt = true;
    ls.set('some_key', 'value', { ttl: 3 });
    const val = JSON.parse(localStorage.getItem('some_key'));
    expect(typeof val.ttl).toBe('number');
  });

  it('should encrypt the data with Crypto JS AES encoding', async () => {
    ls.config.encrypt = true;
    ls.config.secret = 'my-secret-pwd';
    const encrypt = ls.config.encrypter;
    const decrypt = ls.config.decrypter;
    ls.config.encrypter = (data, secret) => AES.encrypt(JSON.stringify(data), secret).toString();
    ls.config.decrypter = (data, secret) => {
      try {
        return JSON.parse(AES.decrypt(data, secret).toString(encUTF8));
      } catch (e) {
        // incorrect/missing secret, return the encrypted data instead
        return data;
      }
    };

    ls.set('some_key', 'value');
    expect(localStorage.getItem('some_key')).not.toBe('"value"'); // gives a different value each time => "U2FsdGVkX18XhBuSMqyl/PWScjKeorvlPfHCQn0JZIg"
    expect(localStorage.getItem('some_key').length).toBeGreaterThan(40);
    expect(ls.get('some_key')).toBe('value');

    // retrieve with incorrect secret
    expect(ls.get('some_key', { secret: 'another-secret' })).not.toBe('value');
    expect(ls.get('some_key', { secret: 'another-secret' }).length).toBeGreaterThan(40);

    // override global secret
    ls.set('some_key', 'value', { secret: 'overriding-secret' });
    expect(ls.get('some_key').length).toBeGreaterThan(40);
    expect(ls.get('some_key', { secret: 'overriding-secret' })).toBe('value');

    // with ttl
    ls.set('some_key', 'value', { ttl: 0.2 });
    let rawValue = JSON.parse(localStorage.getItem('some_key'));
    expect(rawValue.ttl).not.toBe(null);
    expect(rawValue[String.fromCharCode(0)].length).toBeGreaterThan(40);
    expect(ls.get('some_key')).toBe('value');
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);

    // with ttl + override global secret
    ls.set('some_key', 'value', { ttl: 0.2, secret: 'overridden' });
    rawValue = JSON.parse(localStorage.getItem('some_key'));
    expect(rawValue.ttl).not.toBe(null);
    expect(rawValue[String.fromCharCode(0)].length).toBeGreaterThan(40);
    expect(ls.get('some_key').length).toBeGreaterThan(40);
    expect(ls.get('some_key', { secret: 'overridden' })).toBe('value');
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);

    // disable encryption
    ls.set('some_key', 'value', { encrypt: false });
    expect(localStorage.getItem('some_key')).toBe('"value"');

    // disable encryption + ttl
    ls.set('some_key', 'value', { encrypt: false, ttl: 0.2 });
    rawValue = JSON.parse(localStorage.getItem('some_key'));
    expect(rawValue.ttl).not.toBe(null);
    expect(rawValue[String.fromCharCode(0)].length).toBe(5);
    expect(ls.get('some_key')).toBe('value');
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);

    // disable global encryption
    ls.config.encrypt = false;

    // encrypt custom field
    ls.set('some_key', 'value', { encrypt: true });
    expect(localStorage.getItem('some_key').length).toBeGreaterThan(40);
    expect(ls.get('some_key').length).toBeGreaterThan(40);
    expect(ls.get('some_key', { decrypt: true })).toBe('value');

    // encrypt custom field + ttl
    ls.set('some_key', 'value', { encrypt: true, ttl: 0.2 });
    rawValue = JSON.parse(localStorage.getItem('some_key'));
    expect(rawValue.ttl).not.toBe(null);
    expect(rawValue[String.fromCharCode(0)].length).toBeGreaterThan(40);
    expect(ls.get('some_key').length).toBeGreaterThan(40);
    expect(ls.get('some_key', { decrypt: true, secret: 'incorrect-secret' }).length).toBeGreaterThan(40);
    expect(ls.get('some_key', { decrypt: true })).toBe('value');
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);

    // encrypt custom field + ttl + override global secret
    ls.set('some_key', 'value', { encrypt: true, ttl: 0.2, secret: 'special-word' });
    rawValue = JSON.parse(localStorage.getItem('some_key'));
    expect(rawValue.ttl).not.toBe(null);
    expect(rawValue[String.fromCharCode(0)].length).toBeGreaterThan(40);
    expect(ls.get('some_key').length).toBeGreaterThan(40);
    expect(ls.get('some_key', { decrypt: true }).length).toBeGreaterThan(40);
    expect(ls.get('some_key', { decrypt: true, secret: 'incorrect-secret' }).length).toBeGreaterThan(40);
    expect(ls.get('some_key', { decrypt: true, secret: 'special-word' })).toBe('value');
    await new Promise((res) => setTimeout(res, 250));
    expect(ls.get('some_key')).toBe(null);

    // retrieve with erroneous flag
    ls.set('some_key', 'value', { encrypt: false });
    expect(ls.get('some_key', { decrypt: true })).toBe('value');

    // restore functions
    ls.config.encrypter = encrypt;
    ls.config.decrypter = decrypt;
  });

  it('should flush() correctly', async () => {
    ls.set('key1', 'value1', { ttl: 0.2 });
    ls.set('key2', 'value2', { ttl: 0.2, encrypt: true });
    ls.set('key3', 'value3', { ttl: 1 });
    ls.set('key4', 'value4', { ttl: 1, encrypt: true });

    // should not flush before ttl expires
    ls.flush();
    expect(ls.get('key1')).toBe('value1');
    expect(ls.get('key2')).toBe('mÁ¬·À°}m');
    expect(ls.get('key3')).toBe('value3');
    expect(ls.get('key4')).toBe('mÁ¬·À°m');

    // expired items should be flushed
    await new Promise((res) => setTimeout(res, 250));
    ls.flush();
    expect(localStorage.getItem('key1')).toBe(null);
    expect(localStorage.getItem('key2')).toBe(null);

    // force flush whether items are expired or not
    ls.flush(true);
    expect(ls.get('key3')).toBe(null);
    expect(ls.get('key4')).toBe(null);
  });
});
