// Run offline with Node.js 24+: node --test tests/service-form.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICE_CATEGORIES,
  getServiceCategoryOptions,
  getServicePricingOptions,
  getServiceFormDefaults,
  createServiceFormSchema,
  buildServiceSubmission,
} from '../src/lib/service-form.ts';

const service = {
  id: 'example', title: 'Servicio de prueba', description: 'Descripción de prueba',
  price: 'Desde $1,500', base_price: 1500, hora_extra: 800,
  category: 'Talleres Creativos', pricing_type: 'fixed', icon: 'palette',
  features: ['Materiales incluidos'], duration: '2 horas', max_participants: 15,
};

test('new services offer canonical categories and supported pricing modes', () => {
  assert.deepEqual(SERVICE_CATEGORIES, ['Estaciones de Juego', 'Talleres Creativos', 'Extras']);
  assert.deepEqual(getServiceCategoryOptions(), SERVICE_CATEGORIES);
  assert.deepEqual(getServicePricingOptions(), ['fixed', 'per_child']);
  const defaults = getServiceFormDefaults();
  assert.equal(defaults.base_price, undefined, 'new services must explicitly enter a numeric price');
  assert.equal(defaults.hora_extra, 0);
  assert.equal(defaults.pricing_type, 'fixed');
});

test('editing preserves canonical categories, numeric pricing, text display price, and zero values', () => {
  for (const base_price of [0, 25, 1500]) {
    for (const hora_extra of [0, 800]) {
      const initial = { ...service, base_price, hora_extra, pricing_type: 'per_child' };
      const defaults = getServiceFormDefaults(initial);
      const result = buildServiceSubmission(defaults, defaults.features, initial);
      assert.equal(result.base_price, base_price);
      assert.equal(result.hora_extra, hora_extra);
      assert.equal(result.pricing_type, 'per_child');
      assert.equal(result.category, initial.category);
      assert.equal(result.price, initial.price);
    }
  }
});

test('known and unknown legacy categories can be preserved but cannot be silently assigned to new services', () => {
  for (const category of ['talleres-creativos', 'tematico', 'Categoría anterior ']) {
    const initial = { ...service, category };
    assert.deepEqual(getServiceCategoryOptions(category), [...SERVICE_CATEGORIES, category]);
    const defaults = getServiceFormDefaults(initial);
    assert.equal(buildServiceSubmission(defaults, [], initial).category, category);
    assert.equal(createServiceFormSchema().safeParse(defaults).success, false);
    assert.equal(createServiceFormSchema(initial).safeParse({ ...defaults, category: 'otra-desconocida' }).success, false);
    assert.equal(createServiceFormSchema(initial).safeParse({ ...defaults, category: 'Extras' }).success, true);
  }
  assert.deepEqual(getServiceCategoryOptions('Extras'), SERVICE_CATEGORIES);
});

test('existing unknown pricing modes remain available without enabling arbitrary new values', () => {
  const initial = { ...service, pricing_type: 'legacy_mode' };
  assert.deepEqual(getServicePricingOptions(initial.pricing_type), ['fixed', 'per_child', 'legacy_mode']);
  const defaults = getServiceFormDefaults(initial);
  assert.equal(buildServiceSubmission(defaults, [], initial).pricing_type, 'legacy_mode');
  assert.equal(createServiceFormSchema().safeParse(defaults).success, false);
});

test('negative, fractional, missing, nonnumeric, infinite, and out-of-range pricing cannot submit', () => {
  for (const field of ['base_price', 'hora_extra']) {
    for (const value of [-1, 0.5, undefined, '', '1500', NaN, Infinity, 2147483648]) {
      const parsed = createServiceFormSchema().safeParse({ ...service, [field]: value });
      assert.equal(parsed.success, false, `${field} must reject ${String(value)}`);
      assert.throws(() => buildServiceSubmission({ ...service, [field]: value }, []));
    }
  }
  assert.equal(createServiceFormSchema().safeParse({ ...service, base_price: 2147483647 }).success, true);
});

test('submission includes edited prices and features without deriving numbers from display text', () => {
  const result = buildServiceSubmission({ ...service, price: 'Consultar disponibilidad', base_price: 2200, hora_extra: 1000 }, ['Nuevo material']);
  assert.equal(result.price, 'Consultar disponibilidad');
  assert.equal(result.base_price, 2200);
  assert.equal(result.hora_extra, 1000);
  assert.deepEqual(result.features, ['Nuevo material']);
});

test('missing numeric base price in an old record is not guessed from display text', () => {
  const defaults = getServiceFormDefaults({ ...service, base_price: undefined });
  assert.equal(defaults.base_price, undefined);
  assert.equal(createServiceFormSchema().safeParse(defaults).success, false);
});

test('form defaults do not reuse mutable feature arrays across edits', () => {
  const defaults = getServiceFormDefaults(service);
  defaults.features.push('Nuevo material');
  assert.deepEqual(service.features, ['Materiales incluidos']);
});
