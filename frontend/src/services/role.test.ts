import { describe, it, expect } from 'vitest'
import { can, ROLE_ROUTES } from './role'

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
})

describe('rutas por rol', () => {
  it('el emisor tiene emisión, cupos, auditoría y cumplimiento', () => {
    expect(ROLE_ROUTES.emisor).toContain('/audit')
    expect(ROLE_ROUTES.emisor).toContain('/compliance')
    expect(ROLE_ROUTES.emisor).toContain('/create')
    expect(ROLE_ROUTES.emisor).toContain('/capacity')
  })
  it('el oferente solo ve subastas y actividad', () => {
    expect(ROLE_ROUTES.oferente).not.toContain('/create')
    expect(ROLE_ROUTES.oferente).not.toContain('/compliance')
    expect(ROLE_ROUTES.oferente).toContain('/auctions')
  })
})
