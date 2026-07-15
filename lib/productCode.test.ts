import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extraerNumeroCodigo,
  calcularSiguienteNumero,
  construirCodigo,
  generarSiguienteCodigo,
} from './productCode.ts';

test('extraerNumeroCodigo: extrae el numero cuando el codigo empieza con el prefijo', () => {
  assert.equal(extraerNumeroCodigo('C001', 'C'), 1);
  assert.equal(extraerNumeroCodigo('C123', 'C'), 123);
});

test('extraerNumeroCodigo: retorna null si no empieza con el prefijo', () => {
  assert.equal(extraerNumeroCodigo('X001', 'C'), null);
});

test('extraerNumeroCodigo: retorna null si el resto no es puramente numerico', () => {
  assert.equal(extraerNumeroCodigo('CM001', 'C'), null);
});

test('extraerNumeroCodigo: retorna null si el resto esta vacio', () => {
  assert.equal(extraerNumeroCodigo('C', 'C'), null);
});

test('calcularSiguienteNumero: encuentra el maximo entre codigos con huecos', () => {
  assert.equal(calcularSiguienteNumero(['C001', 'C003', 'C002'], 'C'), 4);
});

test('calcularSiguienteNumero: ignora codigos de otros prefijos', () => {
  assert.equal(calcularSiguienteNumero(['C001', 'CM050'], 'C'), 2);
});

test('calcularSiguienteNumero: retorna 1 cuando no hay codigos previos', () => {
  assert.equal(calcularSiguienteNumero([], 'C'), 1);
});

test('construirCodigo: aplica padding correctamente', () => {
  assert.equal(construirCodigo('C', 5), 'C005');
  assert.equal(construirCodigo('C', 123), 'C123');
});

test('generarSiguienteCodigo: combina calculo y construccion', () => {
  assert.equal(generarSiguienteCodigo(['C001', 'C003'], 'C'), 'C004');
  assert.equal(generarSiguienteCodigo([], 'CM'), 'CM001');
});
