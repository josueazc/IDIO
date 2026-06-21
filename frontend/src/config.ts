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
    asp: import.meta.env.VITE_ASP_CONTRACT_ID ?? 'CDO3GEOQMUWNUAIIJJG5HUJIUQYLBSYJ3WTZCQGIBMLNORHVCHBVQOA3',
    token:
      import.meta.env.VITE_TOKEN_CONTRACT_ID ?? 'CB3OQN6NKSEGMGC5OIMEL4ALSMPSKKZ3NDWUY5GZCJOPZHVZKSCQUIHX',
    verifier:
      import.meta.env.VITE_VERIFIER_CONTRACT_ID ??
      'CB4ROINDQOTHMV7DBEUXEM5K5PAEBSX6DF6C4FBFKMBCJUPVF3PKVOAB',
    auction:
      import.meta.env.VITE_AUCTION_CONTRACT_ID ??
      'CCMBQIP3Y53DQUM3APIWPJATL6SZUW3SVOCXRPAAPWBPHGZOO66SNO5Q',
  },
}

export type IdioConfig = typeof config
