import { describe, it, expect } from 'vitest'
import { can, ROLE_ROUTES } from './role'

describe('role permissions (can)', () => {
  it('solo el emisor crea y liquida', () => {
    expect(can('emisor', 'create')).toBe(true)
    expect(can('emisor', 'settle')).toBe(true)
    expect(can('oferente', 'create')).toBe(false)
    expect(can('auditor', 'create')).toBe(false)
  })

  it('solo el oferente puja y paga', () => {
    expect(can('oferente', 'bid')).toBe(true)
    expect(can('oferente', 'pay')).toBe(true)
    expect(can('emisor', 'bid')).toBe(false)
    expect(can('auditor', 'bid')).toBe(false)
  })

  it('cada rol audita/cumple según corresponde', () => {
    expect(can('auditor', 'audit')).toBe(true)
    expect(can('regulador', 'comply')).toBe(true)
    expect(can('oferente', 'audit')).toBe(false)
  })
})

describe('rutas por rol', () => {
  it('el emisor puede auditar sus subastas', () => {
    expect(ROLE_ROUTES.emisor).toContain('/audit')
    expect(ROLE_ROUTES.emisor).toContain('/create')
  })
  it('el oferente no accede a crear ni compliance', () => {
    expect(ROLE_ROUTES.oferente).not.toContain('/create')
    expect(ROLE_ROUTES.oferente).not.toContain('/compliance')
  })
})
