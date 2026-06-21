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
    asp: import.meta.env.VITE_ASP_CONTRACT_ID ?? 'CA7Z7PRBUW4WTBGZQJTKUXQQVCOVEXM3OQSZB2GLDMPDWGZANEXARERO',
    token:
      import.meta.env.VITE_TOKEN_CONTRACT_ID ?? 'CD7L23OCVDMB2PQ4Y7GJZ4SPAUQ7R44BF5UHHHZHSD7WGAA3KYFYGCUB',
    verifier:
      import.meta.env.VITE_VERIFIER_CONTRACT_ID ??
      'CBJQ3FADEOOVBN3G7ZN66FUHSB7MOK5SBJ2F3NZBJHLWK3PCONYF4YLV',
    auction:
      import.meta.env.VITE_AUCTION_CONTRACT_ID ??
      'CB5LFRG2ZKWDDIC4EISCJYLHFR5HNENHQKWLHZ6SVSL33WQRWAQQO6LZ',
  },
}

export type IdioConfig = typeof config
