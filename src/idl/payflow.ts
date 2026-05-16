/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/payflow.json`.
 */
export type Payflow = {
  "address": "2woLsnG7zvKdyd7geH9GAFgKSt6NLrnLDDMmFBUdDjFU",
  "metadata": {
    "name": "payflow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "PayFlow - Yield Discounting Protocol for Solana"
  },
  "instructions": [
    {
      "name": "buyDeal",
      "docs": [
        "Buy a deal",
        "Transfers payment to seller, activates the deal"
      ],
      "discriminator": [
        238,
        240,
        163,
        186,
        237,
        55,
        172,
        73
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "deal",
          "writable": true
        },
        {
          "name": "buyerPaymentAccount",
          "docs": [
            "Token account de l'acheteur (USDC)"
          ],
          "writable": true
        },
        {
          "name": "sellerPaymentAccount",
          "docs": [
            "Token account du vendeur (reçoit le paiement)"
          ],
          "writable": true
        },
        {
          "name": "treasuryAccount",
          "docs": [
            "Treasury (reçoit les fees)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "buyMeteoraLpDeal",
      "docs": [
        "Buy a Meteora LP fee deal",
        "Buyer pays seller and gains rights to claim fees during the deal period"
      ],
      "discriminator": [
        94,
        186,
        141,
        79,
        1,
        136,
        151,
        241
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "deal",
          "writable": true
        },
        {
          "name": "buyerPaymentAccount",
          "docs": [
            "Buyer's payment token account (USDC)"
          ],
          "writable": true
        },
        {
          "name": "sellerPaymentAccount",
          "docs": [
            "Seller's payment token account (receives payment)"
          ],
          "writable": true
        },
        {
          "name": "treasuryAccount",
          "docs": [
            "Treasury (receives protocol fees)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "buybackDeal",
      "docs": [
        "Buyback a deal before it ends (early exit)",
        "Seller pays back buyer with penalty based on current token value"
      ],
      "discriminator": [
        233,
        113,
        218,
        213,
        163,
        75,
        226,
        0
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "yieldDeal"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault contenant les receipt tokens"
          ],
          "writable": true
        },
        {
          "name": "sellerPaymentAccount",
          "docs": [
            "Token account du vendeur pour payer le buyback (USDC)"
          ],
          "writable": true
        },
        {
          "name": "sellerReceiptAccount",
          "docs": [
            "Token account du vendeur pour récupérer ses receipt tokens"
          ],
          "writable": true
        },
        {
          "name": "buyerPaymentAccount",
          "docs": [
            "Token account de l'acheteur (reçoit le remboursement)"
          ],
          "writable": true
        },
        {
          "name": "receiptTokenMint",
          "docs": [
            "Receipt token mint (needed for decimals in price calculation)"
          ]
        },
        {
          "name": "priceUpdate",
          "docs": [
            "Optional: Pyth price update account (required on mainnet for LST tokens)"
          ],
          "optional": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "currentTokenValue",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelDeal",
      "docs": [
        "Cancel a deal that hasn't been purchased yet",
        "Returns the locked tokens to the seller"
      ],
      "discriminator": [
        158,
        86,
        193,
        45,
        168,
        111,
        48,
        29
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "yieldDeal"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault contenant les receipt tokens"
          ],
          "writable": true
        },
        {
          "name": "sellerTokenAccount",
          "docs": [
            "Token account du vendeur (récupère ses tokens)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "cancelMeteoraLpDeal",
      "docs": [
        "Cancel a Meteora LP deal before it's purchased",
        "Seller can retrieve their Position NFT"
      ],
      "discriminator": [
        231,
        205,
        1,
        32,
        38,
        51,
        147,
        110
      ],
      "accounts": [
        {
          "name": "seller",
          "docs": [
            "Only the seller can cancel"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "deal",
          "writable": true
        },
        {
          "name": "nftVault",
          "docs": [
            "The vault holding the Position NFT"
          ],
          "writable": true
        },
        {
          "name": "sellerNftAccount",
          "docs": [
            "Seller's token account to receive the NFT back"
          ],
          "writable": true
        },
        {
          "name": "positionNftMint",
          "docs": [
            "Position NFT mint (needed for transfer_checked)"
          ]
        },
        {
          "name": "nftTokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "claimMeteoraFees",
      "docs": [
        "Claim accumulated Meteora fees",
        "Buyer can call this anytime during the deal to claim fees"
      ],
      "discriminator": [
        21,
        207,
        178,
        64,
        130,
        211,
        31,
        100
      ],
      "accounts": [
        {
          "name": "buyer",
          "docs": [
            "The buyer who owns the fee rights during the deal"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "deal",
          "writable": true
        },
        {
          "name": "nftVault",
          "docs": [
            "The vault holding the Position NFT (deal is the authority)"
          ]
        },
        {
          "name": "buyerTokenAAccount",
          "docs": [
            "Buyer's token account to receive Token A fees"
          ],
          "writable": true
        },
        {
          "name": "buyerTokenBAccount",
          "docs": [
            "Buyer's token account to receive Token B fees"
          ],
          "writable": true
        },
        {
          "name": "meteoraProgram",
          "docs": [
            "Meteora DAMM v2 Program"
          ]
        },
        {
          "name": "poolAuthority",
          "docs": [
            "Meteora Pool Authority (constant address)"
          ]
        },
        {
          "name": "eventAuthority",
          "docs": [
            "Meteora Event Authority PDA"
          ]
        },
        {
          "name": "meteoraPosition",
          "docs": [
            "Meteora Position account"
          ],
          "writable": true
        },
        {
          "name": "meteoraPool",
          "docs": [
            "Meteora Pool account"
          ]
        },
        {
          "name": "poolTokenAVault",
          "docs": [
            "Pool's Token A vault"
          ],
          "writable": true
        },
        {
          "name": "poolTokenBVault",
          "docs": [
            "Pool's Token B vault"
          ],
          "writable": true
        },
        {
          "name": "tokenAMint",
          "docs": [
            "Token A mint"
          ]
        },
        {
          "name": "tokenBMint",
          "docs": [
            "Token B mint"
          ]
        },
        {
          "name": "tokenAProgram",
          "docs": [
            "Token program for Token A (can be SPL Token or Token-2022)"
          ]
        },
        {
          "name": "tokenBProgram",
          "docs": [
            "Token program for Token B (can be SPL Token or Token-2022)"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "crankSettle",
      "docs": [
        "Crank-style settlement for expired deals",
        "Anyone can call this to settle deals and receive rent as incentive"
      ],
      "discriminator": [
        103,
        68,
        217,
        130,
        163,
        137,
        13,
        99
      ],
      "accounts": [
        {
          "name": "cranker",
          "docs": [
            "The cranker/keeper who triggers the settlement",
            "Receives rent from closed vault and deal accounts as incentive"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "yieldDeal"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault containing the locked receipt tokens"
          ],
          "writable": true
        },
        {
          "name": "buyerTokenAccount",
          "docs": [
            "Buyer's token account (receives yield in receipt tokens)"
          ],
          "writable": true
        },
        {
          "name": "sellerTokenAccount",
          "docs": [
            "Seller's token account (receives principal)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "currentTokenValue",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createDeal",
      "docs": [
        "Create a new yield deal",
        "Locks receipt tokens (kUSDC, mSOL, etc.) in a vault PDA"
      ],
      "discriminator": [
        198,
        212,
        144,
        151,
        97,
        56,
        149,
        113
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "config.deal_counter",
                "account": "protocolConfig"
              }
            ]
          }
        },
        {
          "name": "sellerTokenAccount",
          "docs": [
            "Le token account du vendeur (contient kUSDC, mSOL, etc.)"
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "Vault PDA pour stocker les tokens lockés"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "deal"
              }
            ]
          }
        },
        {
          "name": "receiptTokenMint",
          "docs": [
            "Mint du receipt token"
          ]
        },
        {
          "name": "paymentMint",
          "docs": [
            "Mint du token de paiement (USDC)"
          ]
        },
        {
          "name": "priceUpdate",
          "docs": [
            "Optional: Pyth price update account (required on mainnet for LST tokens)",
            "When config.use_oracle is true AND receipt_token is an LST,",
            "this account must be provided for price validation"
          ],
          "optional": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createDealParams"
            }
          }
        }
      ]
    },
    {
      "name": "createMeteoraLpDeal",
      "docs": [
        "Create a new Meteora LP fee deal",
        "Locks a Position NFT in PayFlow vault to sell future fees"
      ],
      "discriminator": [
        200,
        60,
        129,
        175,
        155,
        62,
        24,
        62
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  101,
                  111,
                  114,
                  97,
                  95,
                  108,
                  112,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "config.deal_counter",
                "account": "protocolConfig"
              }
            ]
          }
        },
        {
          "name": "sellerNftAccount",
          "docs": [
            "The seller's token account holding the Position NFT"
          ],
          "writable": true
        },
        {
          "name": "nftVault",
          "docs": [
            "Vault PDA to hold the Position NFT"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  101,
                  111,
                  114,
                  97,
                  95,
                  110,
                  102,
                  116,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "deal"
              }
            ]
          }
        },
        {
          "name": "positionNftMint",
          "docs": [
            "The Position NFT mint (1 NFT = 1 LP position)"
          ]
        },
        {
          "name": "meteoraPosition",
          "docs": [
            "Meteora Position account"
          ]
        },
        {
          "name": "meteoraPool",
          "docs": [
            "Meteora Pool account"
          ]
        },
        {
          "name": "tokenAMint",
          "docs": [
            "Token A mint from the pool"
          ]
        },
        {
          "name": "tokenBMint",
          "docs": [
            "Token B mint from the pool"
          ]
        },
        {
          "name": "paymentMint",
          "docs": [
            "Payment token mint (usually USDC)"
          ]
        },
        {
          "name": "nftTokenProgram",
          "docs": [
            "Token program for NFT (Token or Token2022)"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createMeteoraLpDealParams"
            }
          }
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the PayFlow protocol",
        "Sets up the global configuration with default parameters"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury wallet - must be a valid system account"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "settleDeal",
      "docs": [
        "Settle a deal after it has ended",
        "Distributes yield to buyer and principal to seller"
      ],
      "discriminator": [
        28,
        10,
        168,
        174,
        203,
        149,
        134,
        54
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "N'importe qui peut trigger le settlement (permissionless)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "docs": [
            "Seller receives the deal account rent"
          ],
          "writable": true
        },
        {
          "name": "deal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "deal.deal_id",
                "account": "yieldDeal"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault contenant les receipt tokens"
          ],
          "writable": true
        },
        {
          "name": "buyerTokenAccount",
          "docs": [
            "Token account de l'acheteur (reçoit le yield en receipt tokens)"
          ],
          "writable": true
        },
        {
          "name": "sellerTokenAccount",
          "docs": [
            "Token account du vendeur (reçoit le principal)"
          ],
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "Protocol config (needed to check use_oracle flag)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "receiptTokenMint",
          "docs": [
            "Receipt token mint (needed for decimals in price calculation)"
          ]
        },
        {
          "name": "priceUpdate",
          "docs": [
            "Optional: Pyth price update account (required on mainnet for LST tokens)",
            "When config.use_oracle is true AND receipt_token is an LST,",
            "this account must be provided for price calculation"
          ],
          "optional": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "currentTokenValue",
          "type": "u64"
        }
      ]
    },
    {
      "name": "settleMeteoraLpDeal",
      "docs": [
        "Settle a Meteora LP deal after it ends",
        "Returns the Position NFT to the seller (permissionless)"
      ],
      "discriminator": [
        195,
        32,
        60,
        155,
        142,
        18,
        234,
        240
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Anyone can settle an expired deal (permissionless)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "docs": [
            "Seller receives the deal account rent"
          ],
          "writable": true
        },
        {
          "name": "buyer",
          "docs": [
            "Buyer (for validating token accounts)"
          ]
        },
        {
          "name": "deal",
          "writable": true
        },
        {
          "name": "nftVault",
          "docs": [
            "The vault holding the Position NFT"
          ],
          "writable": true
        },
        {
          "name": "sellerNftAccount",
          "docs": [
            "Seller's token account to receive the NFT back"
          ],
          "writable": true
        },
        {
          "name": "positionNftMint",
          "docs": [
            "Position NFT mint (needed for transfer_checked)"
          ]
        },
        {
          "name": "nftTokenProgram"
        },
        {
          "name": "buyerTokenAAccount",
          "docs": [
            "Buyer's token account to receive Token A fees"
          ],
          "writable": true
        },
        {
          "name": "buyerTokenBAccount",
          "docs": [
            "Buyer's token account to receive Token B fees"
          ],
          "writable": true
        },
        {
          "name": "meteoraProgram",
          "docs": [
            "Meteora DAMM v2 Program"
          ]
        },
        {
          "name": "poolAuthority",
          "docs": [
            "Meteora Pool Authority (constant address)"
          ]
        },
        {
          "name": "eventAuthority",
          "docs": [
            "Meteora Event Authority PDA"
          ]
        },
        {
          "name": "meteoraPosition",
          "docs": [
            "Meteora Position account"
          ],
          "writable": true
        },
        {
          "name": "meteoraPool",
          "docs": [
            "Meteora Pool account"
          ]
        },
        {
          "name": "poolTokenAVault",
          "docs": [
            "Pool's Token A vault"
          ],
          "writable": true
        },
        {
          "name": "poolTokenBVault",
          "docs": [
            "Pool's Token B vault"
          ],
          "writable": true
        },
        {
          "name": "tokenAMint",
          "docs": [
            "Token A mint"
          ]
        },
        {
          "name": "tokenBMint",
          "docs": [
            "Token B mint"
          ]
        },
        {
          "name": "tokenAProgram",
          "docs": [
            "Token program for Token A (can be SPL Token or Token-2022)"
          ]
        },
        {
          "name": "tokenBProgram",
          "docs": [
            "Token program for Token B (can be SPL Token or Token-2022)"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "splitMeteoraPosition",
      "docs": [
        "Split a Meteora position into two positions",
        "Used before creating a deal to sell only a portion of a position's fees"
      ],
      "discriminator": [
        105,
        208,
        86,
        222,
        117,
        142,
        253,
        58
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The owner of both positions (must own both for split)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "meteoraPool",
          "docs": [
            "Meteora Pool account"
          ],
          "writable": true
        },
        {
          "name": "sourcePosition",
          "docs": [
            "Source position (existing position to split FROM)"
          ],
          "writable": true
        },
        {
          "name": "sourceNftAccount",
          "docs": [
            "Source position NFT account (owned by owner)"
          ]
        },
        {
          "name": "targetPosition",
          "docs": [
            "Target position (new position to receive split liquidity)"
          ],
          "writable": true
        },
        {
          "name": "targetNftAccount",
          "docs": [
            "Target position NFT account (owned by owner)"
          ]
        },
        {
          "name": "targetNftMint",
          "docs": [
            "Target position NFT mint (for reference, must have supply=1)"
          ]
        },
        {
          "name": "meteoraProgram",
          "docs": [
            "Meteora DAMM v2 Program"
          ]
        },
        {
          "name": "eventAuthority",
          "docs": [
            "Meteora Event Authority PDA"
          ]
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "splitMeteoraPositionParams"
            }
          }
        }
      ]
    },
    {
      "name": "updateConfig",
      "docs": [
        "Update protocol configuration",
        "Only callable by authority"
      ],
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "updateConfigParams"
            }
          }
        }
      ]
    },
    {
      "name": "withdrawMeteoraLiquidity",
      "docs": [
        "Withdraw all liquidity from a Meteora position after deal settlement",
        "Seller can call this to convert LP position back to underlying tokens"
      ],
      "discriminator": [
        117,
        176,
        192,
        196,
        164,
        50,
        3,
        158
      ],
      "accounts": [
        {
          "name": "seller",
          "docs": [
            "The seller who owns the position after settlement"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "deal",
          "docs": [
            "The settled deal (for reference and validation)"
          ]
        },
        {
          "name": "sellerNftAccount",
          "docs": [
            "Seller's NFT account (NFT was returned after settlement)"
          ]
        },
        {
          "name": "sellerTokenAAccount",
          "docs": [
            "Seller's token account to receive Token A"
          ],
          "writable": true
        },
        {
          "name": "sellerTokenBAccount",
          "docs": [
            "Seller's token account to receive Token B"
          ],
          "writable": true
        },
        {
          "name": "meteoraProgram",
          "docs": [
            "Meteora DAMM v2 Program"
          ]
        },
        {
          "name": "meteoraPosition",
          "docs": [
            "Meteora Position account"
          ],
          "writable": true
        },
        {
          "name": "meteoraPool",
          "docs": [
            "Meteora Pool account"
          ],
          "writable": true
        },
        {
          "name": "poolTokenAVault",
          "docs": [
            "Pool's Token A vault"
          ],
          "writable": true
        },
        {
          "name": "poolTokenBVault",
          "docs": [
            "Pool's Token B vault"
          ],
          "writable": true
        },
        {
          "name": "tokenAMint",
          "docs": [
            "Token A mint"
          ]
        },
        {
          "name": "tokenBMint",
          "docs": [
            "Token B mint"
          ]
        },
        {
          "name": "poolAuthority",
          "docs": [
            "Meteora Pool Authority (constant address)"
          ]
        },
        {
          "name": "eventAuthority",
          "docs": [
            "Meteora Event Authority PDA"
          ]
        },
        {
          "name": "tokenAProgram"
        },
        {
          "name": "tokenBProgram"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "withdrawMeteoraLiquidityParams"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "meteoraLpDeal",
      "discriminator": [
        88,
        16,
        225,
        179,
        189,
        254,
        44,
        170
      ]
    },
    {
      "name": "priceUpdateV2",
      "discriminator": [
        34,
        241,
        35,
        99,
        157,
        126,
        244,
        205
      ]
    },
    {
      "name": "protocolConfig",
      "discriminator": [
        207,
        91,
        250,
        28,
        152,
        179,
        215,
        209
      ]
    },
    {
      "name": "yieldDeal",
      "discriminator": [
        216,
        238,
        159,
        168,
        226,
        65,
        200,
        38
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "protocolPaused",
      "msg": "Protocol is paused"
    },
    {
      "code": 6001,
      "name": "invalidDuration",
      "msg": "Invalid duration (must be 30, 60, 90, 180, or 365 days)"
    },
    {
      "code": 6002,
      "name": "invalidPrice",
      "msg": "Invalid price"
    },
    {
      "code": 6003,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6004,
      "name": "dealNotAvailable",
      "msg": "Deal is not available for purchase"
    },
    {
      "code": 6005,
      "name": "dealNotActive",
      "msg": "Deal is not active"
    },
    {
      "code": 6006,
      "name": "dealNotEnded",
      "msg": "Deal has not ended yet"
    },
    {
      "code": 6007,
      "name": "dealEnded",
      "msg": "Deal has already ended"
    },
    {
      "code": 6008,
      "name": "dealAlreadyActive",
      "msg": "Deal is already active (has a buyer)"
    },
    {
      "code": 6009,
      "name": "notSeller",
      "msg": "Only the seller can perform this action"
    },
    {
      "code": 6010,
      "name": "notBuyer",
      "msg": "Only the buyer can perform this action"
    },
    {
      "code": 6011,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for buyback"
    },
    {
      "code": 6012,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6013,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6014,
      "name": "invalidMint",
      "msg": "Receipt token mint is not in the allowed whitelist"
    },
    {
      "code": 6015,
      "name": "whitelistFull",
      "msg": "Whitelist is full, cannot add more mints"
    },
    {
      "code": 6016,
      "name": "mintAlreadyWhitelisted",
      "msg": "Mint is already in the whitelist"
    },
    {
      "code": 6017,
      "name": "mintNotInWhitelist",
      "msg": "Mint is not in the whitelist"
    },
    {
      "code": 6018,
      "name": "invalidMeteoraPosition",
      "msg": "Invalid Meteora position"
    },
    {
      "code": 6019,
      "name": "positionPoolMismatch",
      "msg": "Position does not belong to the expected pool"
    },
    {
      "code": 6020,
      "name": "invalidPositionNft",
      "msg": "Invalid Position NFT - must be amount 1"
    },
    {
      "code": 6021,
      "name": "notDealBuyer",
      "msg": "Caller is not the deal buyer"
    },
    {
      "code": 6022,
      "name": "dealNotSettled",
      "msg": "Deal has not been settled yet"
    },
    {
      "code": 6023,
      "name": "invalidSplitPercentage",
      "msg": "Invalid split percentage (must be 0-100)"
    },
    {
      "code": 6024,
      "name": "feeTooHigh",
      "msg": "Fee exceeds maximum allowed (10%)"
    },
    {
      "code": 6025,
      "name": "penaltyTooHigh",
      "msg": "Penalty exceeds maximum allowed"
    },
    {
      "code": 6026,
      "name": "invalidPenaltyRange",
      "msg": "Invalid penalty range: base_penalty must be >= min_penalty"
    },
    {
      "code": 6027,
      "name": "invalidTokenValue",
      "msg": "Token value is outside acceptable bounds"
    },
    {
      "code": 6028,
      "name": "oracleRequired",
      "msg": "Oracle price feed required for LST tokens on mainnet"
    },
    {
      "code": 6029,
      "name": "priceMismatch",
      "msg": "Price from oracle doesn't match declared value"
    },
    {
      "code": 6030,
      "name": "unsupportedPriceFeed",
      "msg": "Price feed not supported for this token"
    },
    {
      "code": 6031,
      "name": "stalePriceData",
      "msg": "Price data is stale (older than maximum age)"
    },
    {
      "code": 6032,
      "name": "invalidOraclePrice",
      "msg": "Invalid price from oracle (negative or zero)"
    },
    {
      "code": 6033,
      "name": "feesAlreadyClaimed",
      "msg": "Fees have already been claimed for this deal"
    },
    {
      "code": 6034,
      "name": "invalidTreasury",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6035,
      "name": "invalidDealDuration",
      "msg": "Invalid deal duration (must be > 0)"
    },
    {
      "code": 6036,
      "name": "invalidPaymentMint",
      "msg": "Payment token mint is not in the allowed whitelist"
    },
    {
      "code": 6037,
      "name": "paymentWhitelistFull",
      "msg": "Payment mint whitelist is full, cannot add more mints"
    },
    {
      "code": 6038,
      "name": "paymentMintAlreadyWhitelisted",
      "msg": "Payment mint is already in the whitelist"
    },
    {
      "code": 6039,
      "name": "paymentMintNotInWhitelist",
      "msg": "Payment mint is not in the whitelist"
    }
  ],
  "types": [
    {
      "name": "createDealParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "receiptTokensAmount",
            "type": "u64"
          },
          {
            "name": "principalValueAtLock",
            "type": "u64"
          },
          {
            "name": "expectedYield",
            "type": "u64"
          },
          {
            "name": "sellingPrice",
            "type": "u64"
          },
          {
            "name": "durationDays",
            "type": "u16"
          },
          {
            "name": "sourceProtocol",
            "type": {
              "defined": {
                "name": "sourceProtocol"
              }
            }
          },
          {
            "name": "exchangeRateAtLock",
            "docs": [
              "Exchange rate at lock time (scaled by 1e6, e.g., 1.05 = 1_050_000)",
              "Used to validate settlement values and prevent manipulation"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "createMeteoraLpDealParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "positionAccount",
            "docs": [
              "Meteora Position account address (for reference)"
            ],
            "type": "pubkey"
          },
          {
            "name": "pool",
            "docs": [
              "Meteora Pool address"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeAAtLock",
            "docs": [
              "Current fee_a_pending from the position (snapshot)"
            ],
            "type": "u64"
          },
          {
            "name": "feeBAtLock",
            "docs": [
              "Current fee_b_pending from the position (snapshot)"
            ],
            "type": "u64"
          },
          {
            "name": "expectedFeeA",
            "docs": [
              "Estimated Token A fees during deal period"
            ],
            "type": "u64"
          },
          {
            "name": "expectedFeeB",
            "docs": [
              "Estimated Token B fees during deal period"
            ],
            "type": "u64"
          },
          {
            "name": "expectedFeeValueUsdc",
            "docs": [
              "Combined estimated value in USDC"
            ],
            "type": "u64"
          },
          {
            "name": "sellingPrice",
            "docs": [
              "Price asked by seller (in payment token)"
            ],
            "type": "u64"
          },
          {
            "name": "durationDays",
            "docs": [
              "Duration in days (30, 60, 90, 180, 365)"
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "dealStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "created"
          },
          {
            "name": "active"
          },
          {
            "name": "settled"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "boughtBack"
          }
        ]
      }
    },
    {
      "name": "meteoraLpDeal",
      "docs": [
        "Meteora DAMM v2 LP Fee Deal",
        "Represents a deal where a LP sells their future fees for a specific period.",
        "The Position NFT is locked in PayFlow vault during the deal."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dealId",
            "docs": [
              "Unique deal ID (auto-incremented)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "seller",
            "docs": [
              "Seller - original owner of the Position NFT"
            ],
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "docs": [
              "Buyer - purchaser of the fee rights (default if not purchased)"
            ],
            "type": "pubkey"
          },
          {
            "name": "positionNftMint",
            "docs": [
              "The Position NFT mint (1 NFT = 1 LP position)"
            ],
            "type": "pubkey"
          },
          {
            "name": "positionAccount",
            "docs": [
              "The Meteora Position account address"
            ],
            "type": "pubkey"
          },
          {
            "name": "positionNftVault",
            "docs": [
              "PayFlow vault holding the Position NFT"
            ],
            "type": "pubkey"
          },
          {
            "name": "pool",
            "docs": [
              "The Meteora pool address"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenAMint",
            "docs": [
              "Token A mint of the pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenBMint",
            "docs": [
              "Token B mint of the pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeAAtLock",
            "docs": [
              "fee_a_pending at deal creation (snapshot)"
            ],
            "type": "u64"
          },
          {
            "name": "feeBAtLock",
            "docs": [
              "fee_b_pending at deal creation (snapshot)"
            ],
            "type": "u64"
          },
          {
            "name": "expectedFeeA",
            "docs": [
              "Estimated Token A fees during deal period"
            ],
            "type": "u64"
          },
          {
            "name": "expectedFeeB",
            "docs": [
              "Estimated Token B fees during deal period"
            ],
            "type": "u64"
          },
          {
            "name": "expectedFeeValueUsdc",
            "docs": [
              "Combined estimated value in USDC (for reference)"
            ],
            "type": "u64"
          },
          {
            "name": "sellingPrice",
            "docs": [
              "Price set by seller (in payment_mint tokens)"
            ],
            "type": "u64"
          },
          {
            "name": "paymentMint",
            "docs": [
              "Payment token mint (usually USDC)"
            ],
            "type": "pubkey"
          },
          {
            "name": "durationDays",
            "docs": [
              "Duration in days (30, 60, 90, 180, 365)"
            ],
            "type": "u16"
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp when deal was created"
            ],
            "type": "i64"
          },
          {
            "name": "purchasedAt",
            "docs": [
              "Timestamp when deal was purchased (0 if not yet)"
            ],
            "type": "i64"
          },
          {
            "name": "endsAt",
            "docs": [
              "Timestamp when deal ends (0 if not yet purchased)"
            ],
            "type": "i64"
          },
          {
            "name": "status",
            "docs": [
              "Current deal status"
            ],
            "type": {
              "defined": {
                "name": "dealStatus"
              }
            }
          },
          {
            "name": "feesClaimed",
            "docs": [
              "Whether fees have been claimed for this deal period"
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "priceFeedMessage",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feedId",
            "docs": [
              "`FeedId` but avoid the type alias because of compatibility issues with Anchor's `idl-build` feature."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "price",
            "type": "i64"
          },
          {
            "name": "conf",
            "type": "u64"
          },
          {
            "name": "exponent",
            "type": "i32"
          },
          {
            "name": "publishTime",
            "docs": [
              "The timestamp of this price update in seconds"
            ],
            "type": "i64"
          },
          {
            "name": "prevPublishTime",
            "docs": [
              "The timestamp of the previous price update. This field is intended to allow users to",
              "identify the single unique price update for any moment in time:",
              "for any time t, the unique update is the one such that prev_publish_time < t <= publish_time.",
              "",
              "Note that there may not be such an update while we are migrating to the new message-sending logic,",
              "as some price updates on pythnet may not be sent to other chains (because the message-sending",
              "logic may not have triggered). We can solve this problem by making the message-sending mandatory",
              "(which we can do once publishers have migrated over).",
              "",
              "Additionally, this field may be equal to publish_time if the message is sent on a slot where",
              "where the aggregation was unsuccesful. This problem will go away once all publishers have",
              "migrated over to a recent version of pyth-agent."
            ],
            "type": "i64"
          },
          {
            "name": "emaPrice",
            "type": "i64"
          },
          {
            "name": "emaConf",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "priceUpdateV2",
      "docs": [
        "A price update account. This account is used by the Pyth Receiver program to store a verified price update from a Pyth price feed.",
        "It contains:",
        "- `write_authority`: The write authority for this account. This authority can close this account to reclaim rent or update the account to contain a different price update.",
        "- `verification_level`: The [`VerificationLevel`] of this price update. This represents how many Wormhole guardian signatures have been verified for this price update.",
        "- `price_message`: The actual price update.",
        "- `posted_slot`: The slot at which this price update was posted."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "writeAuthority",
            "type": "pubkey"
          },
          {
            "name": "verificationLevel",
            "type": {
              "defined": {
                "name": "verificationLevel"
              }
            }
          },
          {
            "name": "priceMessage",
            "type": {
              "defined": {
                "name": "priceFeedMessage"
              }
            }
          },
          {
            "name": "postedSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "protocolConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "minDurationDays",
            "type": "u16"
          },
          {
            "name": "maxDurationDays",
            "type": "u16"
          },
          {
            "name": "basePenaltyBps",
            "type": "u16"
          },
          {
            "name": "minPenaltyBps",
            "type": "u16"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "dealCounter",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "allowedMints",
            "docs": [
              "Whitelist of allowed receipt token mints (kUSDC, mSOL, etc.)"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "allowedPaymentMints",
            "docs": [
              "Whitelist of allowed payment token mints (USDC, USDT, etc.)"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "useOracle",
            "docs": [
              "Enable Pyth oracle validation (mainnet only)",
              "When true, LST deals require oracle price validation at creation and settlement"
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "sourceProtocol",
      "docs": [
        "Source protocol categories for yield-bearing assets",
        "Phase 1: Lending & Liquid Staking (receipt tokens that appreciate)",
        "Phase 2: LP Positions (coming soon)",
        "Phase 3: Fee Streams (coming soon)"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "kamino"
          },
          {
            "name": "solend"
          },
          {
            "name": "save"
          },
          {
            "name": "marinade"
          },
          {
            "name": "jito"
          },
          {
            "name": "blaze"
          },
          {
            "name": "sanctum"
          },
          {
            "name": "raydiumLp"
          },
          {
            "name": "meteoraLp"
          },
          {
            "name": "orcaLp"
          },
          {
            "name": "feeStream"
          }
        ]
      }
    },
    {
      "name": "splitMeteoraPositionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "unlockedLiquidityPercentage",
            "docs": [
              "Percentage of unlocked liquidity to transfer to target (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "permanentLockedLiquidityPercentage",
            "docs": [
              "Percentage of permanent locked liquidity to transfer (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "feeAPercentage",
            "docs": [
              "Percentage of pending fee A to transfer (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "feeBPercentage",
            "docs": [
              "Percentage of pending fee B to transfer (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "reward0Percentage",
            "docs": [
              "Percentage of reward 0 to transfer (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "reward1Percentage",
            "docs": [
              "Percentage of reward 1 to transfer (0-100)"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "updateConfigParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeBps",
            "docs": [
              "New fee in basis points (None = no change)"
            ],
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "basePenaltyBps",
            "docs": [
              "New base penalty in basis points (None = no change)"
            ],
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "minPenaltyBps",
            "docs": [
              "New minimum penalty in basis points (None = no change)"
            ],
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "isPaused",
            "docs": [
              "Pause/unpause the protocol (None = no change)"
            ],
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "newTreasury",
            "docs": [
              "New treasury address (None = no change)"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "newAuthority",
            "docs": [
              "New authority address (None = no change)"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "addMint",
            "docs": [
              "Mint to add to whitelist (None = no addition)"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "removeMint",
            "docs": [
              "Mint to remove from whitelist (None = no removal)"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "addPaymentMint",
            "docs": [
              "Payment mint to add to whitelist (None = no addition)"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "removePaymentMint",
            "docs": [
              "Payment mint to remove from whitelist (None = no removal)"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "useOracle",
            "docs": [
              "Enable/disable Pyth oracle validation (None = no change)",
              "Should be set to true on mainnet for LST price validation"
            ],
            "type": {
              "option": "bool"
            }
          }
        ]
      }
    },
    {
      "name": "verificationLevel",
      "docs": [
        "Pyth price updates are bridged to all blockchains via Wormhole.",
        "Using the price updates on another chain requires verifying the signatures of the Wormhole guardians.",
        "The usual process is to check the signatures for two thirds of the total number of guardians, but this can be cumbersome on Solana because of the transaction size limits,",
        "so we also allow for partial verification.",
        "",
        "This enum represents how much a price update has been verified:",
        "- If `Full`, we have verified the signatures for two thirds of the current guardians.",
        "- If `Partial`, only `num_signatures` guardian signatures have been checked.",
        "",
        "# Warning",
        "Using partially verified price updates is dangerous, as it lowers the threshold of guardians that need to collude to produce a malicious price update."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "partial",
            "fields": [
              {
                "name": "numSignatures",
                "type": "u8"
              }
            ]
          },
          {
            "name": "full"
          }
        ]
      }
    },
    {
      "name": "withdrawMeteoraLiquidityParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenAAmountThreshold",
            "docs": [
              "Minimum Token A to receive (slippage protection)"
            ],
            "type": "u64"
          },
          {
            "name": "tokenBAmountThreshold",
            "docs": [
              "Minimum Token B to receive (slippage protection)"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "yieldDeal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dealId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "receiptTokenMint",
            "type": "pubkey"
          },
          {
            "name": "receiptTokenVault",
            "type": "pubkey"
          },
          {
            "name": "receiptTokensAmount",
            "type": "u64"
          },
          {
            "name": "principalValueAtLock",
            "type": "u64"
          },
          {
            "name": "expectedYield",
            "type": "u64"
          },
          {
            "name": "sellingPrice",
            "type": "u64"
          },
          {
            "name": "paymentMint",
            "type": "pubkey"
          },
          {
            "name": "exchangeRateAtLock",
            "docs": [
              "Exchange rate at lock time (scaled by 1e6)",
              "Used to validate current_token_value at settlement (anti-manipulation)"
            ],
            "type": "u64"
          },
          {
            "name": "durationDays",
            "type": "u16"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "purchasedAt",
            "type": "i64"
          },
          {
            "name": "endsAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "dealStatus"
              }
            }
          },
          {
            "name": "sourceProtocol",
            "type": {
              "defined": {
                "name": "sourceProtocol"
              }
            }
          }
        ]
      }
    }
  ]
};
