describe('MyUtils.serializeMemo / parseMemo', () => {
  let MyUtils;
  let FIELDS;

  beforeAll(async () => {
    ({ MyUtils } = await import('../utils.js'));
    ({ FIELDS } = await import('../config.js'));
  });

  test('serializeMemo produces expected tagged string', () => {
    const data = { day: 'あり', talk: ['Cloud', 'Studio'], comment: 'hello\nline2' };
    const s = MyUtils.serializeMemo(data, FIELDS);
    expect(s).toMatch(/【通所】あり/);
    expect(s).toMatch(/【内容】Cloud, Studio/);
    expect(s).toMatch(/【メモ】hello line2/);
  });

  test('parseMemo restores object for checkbox and textarea', () => {
    const text = '【通所】あり 【内容】Cloud, Studio 【メモ】aaa';
    const parsed = MyUtils.parseMemo(text, FIELDS);
    expect(parsed.day).toBe('あり');
    expect(Array.isArray(parsed.talk)).toBe(true);
    expect(parsed.talk).toContain('Cloud');
    expect(parsed.comment).toBe('aaa');
  });
});

