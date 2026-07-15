export function extraerNumeroCodigo(codigo: string, prefijo: string): number | null {
  if (!codigo.startsWith(prefijo)) return null;
  const resto = codigo.slice(prefijo.length);
  if (resto.length === 0 || !/^\d+$/.test(resto)) return null;
  return parseInt(resto, 10);
}

export function calcularSiguienteNumero(codigos: string[], prefijo: string): number {
  let max = 0;
  for (const codigo of codigos) {
    const numero = extraerNumeroCodigo(codigo, prefijo);
    if (numero !== null && numero > max) max = numero;
  }
  return max + 1;
}

export function construirCodigo(prefijo: string, numero: number, padding = 3): string {
  return `${prefijo}${String(numero).padStart(padding, '0')}`;
}

export function generarSiguienteCodigo(codigos: string[], prefijo: string, padding = 3): string {
  const numero = calcularSiguienteNumero(codigos, prefijo);
  return construirCodigo(prefijo, numero, padding);
}
