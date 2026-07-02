import { describe, it, expect } from 'vitest'
import { can, ROLE_ROUTES, ROLES } from './role'

describe('role permissions (can)', () => {
  it('el emisor emite, liquida, audita y cumple', () => {
    expect(can('emisor', 'create')).toBe(true)
    expect(can('emisor', 'settle')).toBe(true)
    expect(can('emisor', 'audit')).toBe(true)
    expect(can('emisor', 'comply')).toBe(true)
    expect(can('oferente', 'create')).toBe(false)
  })

  it('solo el oferente puja y paga', () => {
    expect(can('oferente', 'bid')).toBe(true)
    expect(can('oferente', 'pay')).toBe(true)
    expect(can('emisor', 'bid')).toBe(false)
    expect(can('emisor', 'audit')).toBe(true)
    expect(can('oferente', 'audit')).toBe(false)
  })

  it('null role no puede nada', () => {
    expect(can(null, 'create')).toBe(false)
    expect(can(null, 'bid')).toBe(false)
    expect(can(null, 'audit')).toBe(false)
    expect(can(null, 'comply')).toBe(false)
    expect(can(null, 'pay')).toBe(false)
    expect(can(null, 'settle')).toBe(false)
  })

  it('emisor no puede pagar ni ofertar', () => {
    expect(can('emisor', 'bid')).toBe(false)
    expect(can('emisor', 'pay')).toBe(false)
  })

  it('oferente no puede emitir, liquidar, cumplir', () => {
    expect(can('oferente', 'create')).toBe(false)
    expect(can('oferente', 'settle')).toBe(false)
    expect(can('oferente', 'comply')).toBe(false)
  })
})

describe('rutas por rol', () => {
  it('el emisor tiene emisión, cupos, auditoría y cumplimiento', () => {
    expect(ROLE_ROUTES.emisor).toContain('/audit')
    expect(ROLE_ROUTES.emisor).toContain('/compliance')
    expect(ROLE_ROUTES.emisor).toContain('/create')
    expect(ROLE_ROUTES.emisor).toContain('/capacity')
    expect(ROLE_ROUTES.emisor).toContain('/')
    expect(ROLE_ROUTES.emisor).toContain('/account')
    expect(ROLE_ROUTES.emisor).toContain('/activity')
  })

  it('el oferente solo ve subastas y actividad', () => {
    expect(ROLE_ROUTES.oferente).not.toContain('/create')
    expect(ROLE_ROUTES.oferente).not.toContain('/compliance')
    expect(ROLE_ROUTES.oferente).not.toContain('/audit')
    expect(ROLE_ROUTES.oferente).not.toContain('/capacity')
    expect(ROLE_ROUTES.oferente).toContain('/auctions')
    expect(ROLE_ROUTES.oferente).toContain('/activity')
    expect(ROLE_ROUTES.oferente).toContain('/')
  })

  it('ambos roles tienen inicio y cuenta', () => {
    for (const role of ['emisor', 'oferente'] as const) {
      expect(ROLE_ROUTES[role]).toContain('/')
      expect(ROLE_ROUTES[role]).toContain('/account')
    }
  })
})

describe('ROLES metadata', () => {
  it('contiene exactamente dos roles', () => {
    expect(ROLES).toHaveLength(2)
  })

  it('cada rol tiene id, label, desc, icon', () => {
    for (const r of ROLES) {
      expect(r.id).toBeTruthy()
      expect(r.label).toBeTruthy()
      expect(r.desc).toBeTruthy()
      expect(r.icon).toBeTruthy()
    }
  })

  it('los ids coinciden con las claves de ROLE_ROUTES', () => {
    const ids = ROLES.map((r) => r.id)
    expect(ids).toEqual(expect.arrayContaining(Object.keys(ROLE_ROUTES)))
  })
})
