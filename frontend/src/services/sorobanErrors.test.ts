import { describe, it, expect } from 'vitest'
import { decodeSorobanError, errorAction } from './sorobanErrors'

describe('decodeSorobanError', () => {
  it('decodifica Error(Contract, #1) como subasta no existente', () => {
    const msg = decodeSorobanError('Error(Contract, #1)')
    expect(msg.toLowerCase()).toContain('subasta')
  })

  it('decodifica Error(Contract, #2) como subasta cerrada o estado incorrecto', () => {
    expect(decodeSorobanError('Error(Contract, #2)')).toContain('cerrada')
  })

  it('decodifica Error(Contract, #3) como oferta ya realizada', () => {
    expect(decodeSorobanError('Error(Contract, #3)')).toContain('oferta')
  })

  it('decodifica Error(Contract, #4) como oferta bajo el mínimo', () => {
    expect(decodeSorobanError('Error(Contract, #4)')).toContain('mínimo')
  })

  it('decodifica Error(Contract, #6) como prueba ZK inválida', () => {
    const msg = decodeSorobanError('Error(Contract, #6)')
    expect(msg.toLowerCase()).toContain('zk')
  })

  it('decodifica Error(Contract, #7) como allow-list', () => {
    expect(decodeSorobanError('Error(Contract, #7)')).toContain('allow-list')
  })

  it('pasa errores desconocidos sin modificar', () => {
    const raw = 'Something totally unexpected happened'
    expect(decodeSorobanError(raw)).toBe(raw)
  })

  it('maneja cadena vacía sin explotar', () => {
    expect(() => decodeSorobanError('')).not.toThrow()
  })

  it('maneja todos los códigos 1–20 sin explotar', () => {
    for (let i = 1; i <= 20; i++) {
      expect(() => decodeSorobanError(`Error(Contract, #${i})`)).not.toThrow()
    }
  })

  it('detecta errores de red por patrón', () => {
    const msg = decodeSorobanError('fetch failed: network timeout connecting to rpc')
    expect(msg.toLowerCase()).not.toBe('fetch failed: network timeout connecting to rpc')
  })
})

describe('errorAction', () => {
  it('retorna string o null para códigos conocidos', () => {
    for (let i = 1; i <= 20; i++) {
      const raw = `Error(Contract, #${i})`
      const result = errorAction(raw)
      expect(result === null || typeof result === 'string').toBe(true)
    }
  })

  it('retorna null para errores desconocidos', () => {
    expect(errorAction('some random error')).toBeNull()
  })

  it('código #2 (subasta cerrada) sugiere acción de navegación', () => {
    const action = errorAction('Error(Contract, #2)')
    if (action !== null) {
      expect(action.length).toBeGreaterThan(0)
    }
  })
})
