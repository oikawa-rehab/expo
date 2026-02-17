describe('UIEngine.renderForm', () => {
  let UIEngine;
  let FIELDS;

  beforeAll(async () => {
    ({ UIEngine } = await import('../ui.js'));
    ({ FIELDS } = await import('../config.js'));
  });

  test('renders inputs for radio, checkbox and textarea', () => {
    // ensure DOM root exists (jest jsdom)
    document.body.innerHTML = '';
    const form = UIEngine.renderForm(FIELDS);
    document.body.appendChild(form);

    const dayField = FIELDS.find(f => f.id === 'day');
    const talkField = FIELDS.find(f => f.id === 'talk');
    const commentField = FIELDS.find(f => f.id === 'comment');

    // radios
    const radios = form.querySelectorAll(`input[type="radio"][name="${dayField.id}"]`);
    expect(radios.length).toBe(dayField.options.length);

    // checkboxes
    const checks = form.querySelectorAll(`input[type="checkbox"][name="${talkField.id}"]`);
    expect(checks.length).toBe(talkField.options.length);

    // textarea
    const ta = form.querySelector(`textarea[name="${commentField.id}"]`);
    expect(ta).not.toBeNull();
  });
});

