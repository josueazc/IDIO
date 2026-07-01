/**
 * Configuración de red y contratos.
 *
 * Por defecto apunta a los contratos de IDIO ya desplegados en Stellar
 * Testnet (ver `deployments.testnet.json` en la raíz). Se pueden sobrescribir
 * con variables `VITE_*` en `frontend/.env`.
 */

export const config = {
  network: import.meta.env.VITE_STELLAR_NETWORK ?? 'testnet',
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  /** Cuenta usada como fuente para simular lecturas (debe existir on-chain). */
  readSource:
    import.meta.env.VITE_READ_SOURCE ?? 'GCTXTCGN5W3QG6GARAVOIQ6WV5QBFSAVHZ6J2SJENHFKQHMU36FJAK6R',
  contracts: {
    asp: import.meta.env.VITE_ASP_CONTRACT_ID ?? 'CBKCM7DFWKYLMQIXN3IE2IRFV7P2ZZQI3DPGZNQZRYB3R3FG7SJ3ZJNR',
    token:
      import.meta.env.VITE_TOKEN_CONTRACT_ID ?? 'CBVDXELQKBRLVQRVZNZJFPPQS3CCJRHPQ6DSCUO3SSONBPUM3YI3BPQH',
    verifier:
      import.meta.env.VITE_VERIFIER_CONTRACT_ID ??
      'CDPACMY5BFOL4OWEW42ESAICPVVXBNPE6QJVNFASQJTI2UT7JMTR3IB6',
    auction:
      import.meta.env.VITE_AUCTION_CONTRACT_ID ??
      'CDGVV7ZARFX7NZWYROCW3IKCX2ZGCJK2BYD7647YOOUO2DX4JIKHFWL4',
  },
  /**
   * Covenant (allow-list ZK): set de secretos del árbol de Merkle de miembros.
   * El admin usa la misma lista al configurar el ASP (`set_membership`) y el
   * frontend la usa para generar la prueba de pertenencia. Cada banco registrado
   * recibe un índice en esta lista. Demo/research: en producción cada banco
   * conocería solo su propio secreto y su camino, no toda la lista.
   */
  covenant: {
    secretsCsv: import.meta.env.VITE_COVENANT_SECRETS ?? '1,2,3,4,5,6,7,8',
  },
}

export type IdioConfig = typeof config
