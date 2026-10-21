// Run offline with Node.js 24+: node --test tests/pricing.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPreciosCotizacion as price, aplicarDescuento, precioEstaciones } from '../supabase/functions/_shared/pricing.ts';

const station = (id, base_price = 2000) => ({id, base_price, category: 'Estaciones de Juego', hora_extra: 500});
const workshop = (id, base_price = 1500) => ({id, base_price, category: 'Talleres Creativos', hora_extra: 1000});
const kit = {id: 'kit', base_price: 25, category: 'Talleres Creativos', pricing_type: 'per_child', hora_extra: 999};

test('station pairing, odd remainder, and individual DB price remain unchanged', () => {
  assert.deepEqual([0,1,2,3,4,5].map(n => precioEstaciones(n)), [0,2000,3500,5500,7000,9000]);
  assert.equal(price([station('one', 2500)], 15).total, 2500);
  const p = price([station('a'),station('b'),station('c')], 15);
  assert.deepEqual([...p.perService.values()], [1834,1833,1833]);
  assert.equal(p.total,5500);
});
test('workshop boundaries and rounding are exact', () => {
  assert.deepEqual([1,15,16,30,31,50,51].map(n => price([workshop('w')],n).total), [1500,1500,1950,1950,2250,2250,2700]);
  assert.equal(price([workshop('w',1001)],16).total,1301);
});
test('per-child items override category and ignore extra hours', () => {
  assert.equal(price([kit],30,2).total,750);
  assert.equal(price([kit],0,2).total,25);
});
test('extra hours apply per fixed service, discounts are bounded', () => {
  const p=price([station('a'),station('b'),workshop('w'),kit],30,2);
  assert.equal(p.total,10200);
  assert.deepEqual(aplicarDescuento(p.total,10), {discountAmount:1020,totalConDescuento:9180});
  assert.equal(aplicarDescuento(101,50).discountAmount,51);
  assert.equal(aplicarDescuento(100,-1).totalConDescuento,100);
  assert.equal(aplicarDescuento(100,200).totalConDescuento,0);
});

test('mixed services preserve subtotal and line-item sum over boundary matrix', () => {
  const counts = [1, 15, 16, 30, 31, 50, 51];
  const workshopPrices = [1500, 1500, 1950, 1950, 2250, 2250, 2700];
  const stationPrices = [0, 2000, 3500, 5500, 7000, 9000];
  for (let n = 0; n < stationPrices.length; n++) {
    for (let i = 0; i < counts.length; i++) {
      for (const hours of [0, 1, 2]) {
        const services = [...Array.from({length:n}, (_, j) => station(String(j))), workshop('w'), kit];
        const result = price(services, counts[i], hours);
        const expected = stationPrices[n] + workshopPrices[i] + counts[i] * 25 + hours * (n * 500 + 1000);
        assert.equal(result.total, expected);
        assert.equal([...result.perService.values()].reduce((a,b) => a+b, 0), expected);
      }
    }
  }
});

test('other fixed services and empty selections retain current behavior', () => {
  assert.equal(price([], 15).total, 0);
  assert.equal(price([{id:'extra', category:'Extras', base_price:1200, hora_extra:800}], 30, 2).total, 2800);
});
