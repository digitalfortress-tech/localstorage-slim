import { ls } from './ls';

describe('LS wrapper', () => {
  afterEach(() => {
    global.localStorage.clear();
    ls.config.ttl = null;
    ls.config.enableEncryption = false;
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
    ls.set('some_object', exp, { ttl: 1 });
    expect(ls.get('some_object')).toStrictEqual(exp);

    // should expire after 1s and not after 3s
    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_object')).toBe(null);
  });

  it('Calling get() should return null after ttl expires', async () => {
    ls.set('some_key', 'some_value', { ttl: 1 });
    expect(ls.get('some_key')).toBe('some_value');

    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_key')).toBe(null);
  });

  it('Calling get() should return null after global ttl expires', async () => {
    ls.config.ttl = 1;
    ls.set('some_key', 'some_value');
    expect(ls.get('some_key')).toBe('some_value');

    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_key')).toBe(null);
  });

  it('Local ttl should take precedence over global ttl (conf)', async () => {
    ls.config.ttl = 1;
    ls.set('some_key', 'some_value', { ttl: 2 });
    expect(ls.get('some_key')).toBe('some_value');

    // after global ttl
    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_key')).toBe('some_value');

    // after local ttl
    await new Promise((res) => setTimeout(res, 1000));
    expect(ls.get('some_key')).toBe(null);
  });

  it('When global ttl is enabled, Disable ttl for only a particular item', async () => {
    ls.config.ttl = 1;
    ls.set('some_key', 'some_value', { ttl: null });
    expect(ls.get('some_key')).toBe('some_value');

    // after global ttl, val should not be expired
    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_key')).toBe('some_value');
  });

  it('should encrypt the data with default implementation when encryption is enabled', async () => {
    ls.config.enableEncryption = true;
    ls.set('some_key', 'value');
    expect(localStorage.getItem('some_key')).toBe('"Á¬·À°"');
    expect(ls.get('some_key')).toBe('value');
  });

  it('should encrypt only a particular field', async () => {
    ls.config.enableEncryption = false;
    ls.set('some_key', 'value', { enableEncryption: true });
    expect(localStorage.getItem('some_key')).toBe('"Á¬·À°"');
    // calling get() without enableEncryption set to true
    expect(ls.get('some_key')).toBe('Á¬·À°');
    expect(ls.get('some_key', { enableEncryption: true })).toBe('value');
  });

  it('When global encryption is enabled, using a custom secret must work', async () => {
    ls.config.enableEncryption = true;
    ls.set('some_key', 'value', { secret: 57 });
    expect(localStorage.getItem('some_key')).toBe('"¯¥®"');
    expect(ls.get('some_key', { secret: 57 })).toBe('value');
    // if secret is not provided, fall back to global secret and return garbage
    expect(ls.get('some_key')).toBe('dOZcS');
    // if correct secret is not provided, return garbage
    expect(ls.get('some_key', { secret: 5 })).toBe('ª ©');
  });

  it('local enableEncryption param should take precedence over global enableEncryption config param', async () => {
    ls.config.enableEncryption = true;
    ls.set('some_key', 'value', { enableEncryption: false });
    expect(localStorage.getItem('some_key')).toBe('"value"');

    // if encryption was not disabled while retrieval as well, return garbage
    expect(ls.get('some_key')).toBe('+!*');
    expect(ls.get('some_key', { enableEncryption: false })).toBe('value');
  });

  it('should encrypt the data with custom implementation', async () => {
    ls.config.enableEncryption = true;
    ls.config.encrypter = jest.fn(() => 'mÁ¬·À°m');
    ls.config.decrypter = jest.fn(() => '"value"');

    ls.set('some_key', 'value');
    expect(ls.config.encrypter).toHaveBeenCalled();
    expect(ls.get('some_key')).toBe('"value"');
    expect(ls.config.decrypter).toHaveBeenCalled();
  });

  it('when encryption is enabled and ttl is provided, ttl should not be encrypted', async () => {
    ls.config.enableEncryption = true;
    ls.set('some_key', 'value', { ttl: 3 });
    const val = JSON.parse(localStorage.getItem('some_key'));
    expect(typeof val.ttl).toBe('number');
  });
});
