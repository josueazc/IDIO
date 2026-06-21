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
    asp: import.meta.env.VITE_ASP_CONTRACT_ID ?? 'CAMRACXOGXS7NZXI6JF7JZNNNYPTUNI6AQRHWGFSMXNQOYJ3RP7DS5JY',
    token:
      import.meta.env.VITE_TOKEN_CONTRACT_ID ?? 'CBVDXELQKBRLVQRVZNZJFPPQS3CCJRHPQ6DSCUO3SSONBPUM3YI3BPQH',
    verifier:
      import.meta.env.VITE_VERIFIER_CONTRACT_ID ??
      'CDPACMY5BFOL4OWEW42ESAICPVVXBNPE6QJVNFASQJTI2UT7JMTR3IB6',
    auction:
      import.meta.env.VITE_AUCTION_CONTRACT_ID ??
      'CAYM26B6AVARFVTQEXPXSB753MMPLA7GZ4RANN7ID3M7LFYM3KTZQRFT',
  },
}

export type IdioConfig = typeof config
