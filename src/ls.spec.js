import { ls } from './ls';

describe('LS wrapper', () => {
  afterEach(() => {
    global.localStorage.clear();
  });

  it('Calling get() with non-existent key should return null', () => {
    expect(ls.get('some_key')).toBe(null);
  });

  it('Calling set() with/without ttl should return undefined', () => {
    expect(ls.set('some_key', 'some_value')).toBe(undefined);
    expect(ls.set('some_key1', 'some_value1', 3600)).toBe(undefined);
  });

  it('LS should set(), get() correct value (with/without ttl)', () => {
    // string values
    ls.set('some_key', 'some_value');
    expect(ls.get('some_key')).toBe('some_value');
    ls.set('some_key1', 'some_value1', 3600);
    expect(ls.get('some_key1')).toBe('some_value1');

    // objects
    const inputObj = {
      a: null,
      b: undefined,
      c: 'xyz',
      d: new Date(Date.UTC('2021', '1', '27', '11', '00', '00')),
      e: ['x', 1, { z: false }],
    };
    const outputObj = {
      a: null,
      c: 'xyz',
      d: '2021-02-27T11:00:00.000Z',
      e: ['x', 1, { z: false }],
    };
    ls.set('some_object', inputObj);
    expect(ls.get('some_object')).toStrictEqual(outputObj);
    ls.set('some_object', inputObj, 3600);
    expect(ls.get('some_object')).toStrictEqual(outputObj);

    // arrays
    const inputArr = ['a', 1, null, true, false, undefined, new Date('01/20/2021 11:00:00'), { x: undefined }];
    const outputArr = ['a', 1, null, true, false, null, '2021-01-20T10:00:00.000Z', {}];
    ls.set('some_array', inputArr);
    expect(ls.get('some_array')).toStrictEqual(outputArr);
    ls.set('some_array', inputArr, 3600);
    expect(ls.get('some_array')).toStrictEqual(outputArr);
  });

  it('Calling get() should return null after ttl expires', async () => {
    ls.set('some_key', 'some_value', 1);
    expect(ls.get('some_key')).toBe('some_value');

    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_key')).toBe(null);
  });

  it('Calling get() should return null after global ttl expires', async () => {
    ls.config.global_ttl = 1;
    ls.set('some_key', 'some_value', 1);
    expect(ls.get('some_key')).toBe('some_value');

    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_key')).toBe(null);
  });

  it('ttl should take precedence over global_ttl', async () => {
    ls.config.global_ttl = 1;
    ls.set('some_key', 'some_value', 2);
    expect(ls.get('some_key')).toBe('some_value');

    // after global_ttl
    await new Promise((res) => setTimeout(res, 1100));
    expect(ls.get('some_key')).toBe('some_value');

    // after ttl
    await new Promise((res) => setTimeout(res, 1000));
    expect(ls.get('some_key')).toBe(null);

  });
});
