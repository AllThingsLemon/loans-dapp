import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Nft
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const nftAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false
      },
      {
        name: 'newAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false
      }
    ],
    name: 'AdminChanged'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'approved',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true
      }
    ],
    name: 'Approval'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false }
    ],
    name: 'ApprovalForAll'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'beacon',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'BeaconUpgraded'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegator',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'fromDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'toDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'DelegateChanged'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegate',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'previousBalance',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'newBalance',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'DelegateVotesChanged'
  },
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }
    ],
    name: 'Initialized'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true
      }
    ],
    name: 'RoleAdminChanged'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'RoleGranted'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'RoleRevoked'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true
      }
    ],
    name: 'Transfer'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'Upgraded'
  },
  {
    type: 'function',
    inputs: [],
    name: 'CLOCK_MODE',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure'
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'MINTER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'ambassadorMax',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'ambassadorMintCost',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOfByType',
    outputs: [
      { name: 'founderBalance', internalType: 'uint256', type: 'uint256' },
      { name: 'ambassadorBalance', internalType: 'uint256', type: 'uint256' },
      { name: 'cloudxBalance', internalType: 'uint256', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'clock',
    outputs: [{ name: '', internalType: 'uint48', type: 'uint48' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'cloudxMax',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'cloudxMintCost',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'contractURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      {
        name: 'nftType',
        internalType: 'enum IRewardNft.NftType',
        type: 'uint8'
      }
    ],
    name: 'decrementMintingWhitelistAllowance',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint8', type: 'uint8' },
      { name: '', internalType: 'bytes32', type: 'bytes32' },
      { name: '', internalType: 'bytes32', type: 'bytes32' }
    ],
    name: 'delegateBySig',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'delegates',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { name: 'fields', internalType: 'bytes1', type: 'bytes1' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'version', internalType: 'string', type: 'string' },
      { name: 'chainId', internalType: 'uint256', type: 'uint256' },
      { name: 'verifyingContract', internalType: 'address', type: 'address' },
      { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
      { name: 'extensions', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'founderMax',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'founderMintCost',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getNftType',
    outputs: [
      { name: '', internalType: 'enum IRewardNft.NftType', type: 'uint8' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'timepoint', internalType: 'uint256', type: 'uint256' }],
    name: 'getPastTotalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'getPastVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSupplies',
    outputs: [
      { name: 'total', internalType: 'uint256', type: 'uint256' },
      { name: 'founderTotal', internalType: 'uint256', type: 'uint256' },
      { name: 'ambassadorTotal', internalType: 'uint256', type: 'uint256' },
      { name: 'cloudxTotal', internalType: 'uint256', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      {
        name: 'nftType',
        internalType: 'enum IRewardNft.NftType',
        type: 'uint8'
      }
    ],
    name: 'incrementMintingWhitelistAllowance',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'baseURI_', internalType: 'string', type: 'string' },
      { name: 'contractURI_', internalType: 'string', type: 'string' },
      { name: 'paymentWallet_', internalType: 'address', type: 'address' },
      { name: 'paymentToken_', internalType: 'address', type: 'address' },
      { name: 'ambassadorMintCost_', internalType: 'uint256', type: 'uint256' },
      { name: 'founderMintCost_', internalType: 'uint256', type: 'uint256' },
      { name: 'mintWallet_', internalType: 'address', type: 'address' },
      { name: 'mintFeeToken_', internalType: 'address', type: 'address' },
      { name: 'mintFeeCost_', internalType: 'uint256', type: 'uint256' },
      { name: 'cloudxMintCost_', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'isMintingEnabled',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'isPaymentEnabled',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'mintFeeAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'mintFeeCost',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'mintFeeToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'mintingWhitelistAllowance',
    outputs: [
      { name: 'founderAllowance', internalType: 'uint256', type: 'uint256' },
      { name: 'ambassadorAllowance', internalType: 'uint256', type: 'uint256' },
      { name: 'cloudxAllowance', internalType: 'uint256', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'paymentAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'paymentToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'numberToMint', internalType: 'uint256', type: 'uint256' },
      {
        name: 'nftType',
        internalType: 'enum IRewardNft.NftType',
        type: 'uint8'
      }
    ],
    name: 'safeMintBatch',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'numberToMint', internalType: 'uint256', type: 'uint256' },
      {
        name: 'nftType',
        internalType: 'enum IRewardNft.NftType',
        type: 'uint8'
      }
    ],
    name: 'safeMintBatchPayment',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'numberToMint', internalType: 'uint256', type: 'uint256' },
      {
        name: 'nftType',
        internalType: 'enum IRewardNft.NftType',
        type: 'uint8'
      }
    ],
    name: 'safeMintBatchWhitelist',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'ambassadorMintCost_', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'setAmbassadorMintCost',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' }
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'baseURI_', internalType: 'string', type: 'string' }],
    name: 'setBaseURI',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'cloudxMintCost_', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'setCloudxMintCost',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'contractURI_', internalType: 'string', type: 'string' }],
    name: 'setContractURI',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'founderMintCost_', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'setFounderMintCost',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'isMintingEnabled_', internalType: 'bool', type: 'bool' }],
    name: 'setIsMintingEnabled',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'isPaymentEnabled_', internalType: 'bool', type: 'bool' }],
    name: 'setIsPaymentEnabled',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: '_maxSupply', internalType: 'uint256', type: 'uint256' },
      { name: '_founderMax', internalType: 'uint256', type: 'uint256' },
      { name: '_ambassadorMax', internalType: 'uint256', type: 'uint256' },
      { name: '_cloudxMax', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'setMaxSupply',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'mintFeeAddress_', internalType: 'address', type: 'address' }
    ],
    name: 'setMintFeeAddress',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'mintFeeCost_', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'setMintFeeCost',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'mintFeeToken_', internalType: 'address', type: 'address' }
    ],
    name: 'setMintFeeToken',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'paymentAddress_', internalType: 'address', type: 'address' }
    ],
    name: 'setPaymentAddress',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'paymentToken_', internalType: 'address', type: 'address' }
    ],
    name: 'setPaymentToken',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: '_staker', internalType: 'address', type: 'address' }],
    name: 'setStaker',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'staker',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'index', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'tokensOfOwner',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'tokensOfOwnerByType',
    outputs: [
      { name: 'founderTokens', internalType: 'uint256[]', type: 'uint256[]' },
      {
        name: 'ambassadorTokens',
        internalType: 'uint256[]',
        type: 'uint256[]'
      },
      { name: 'cloudxTokens', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_startIndex', internalType: 'uint256', type: 'uint256' },
      { name: '_pageSize', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'tokensOfOwnerSubset',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalUnredeemed',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' }
    ],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' }
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable'
  }
] as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const nftAddress = {
  56: '0x93778D643200078BD49F9fF7f03cfB906a5d4987',
  97: '0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA'
} as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const nftConfig = { address: nftAddress, abi: nftAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NitroRewards
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const nitroRewardsAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'EmergencyWithdrawalExecuted'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }
    ],
    name: 'Initialized'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'RewardAdded'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'RewardClaimed'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'users',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false
      },
      {
        name: 'amounts',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'RewardsAllocated'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'users',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false
      },
      {
        name: 'amounts',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'RewardsRevoked'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true
      }
    ],
    name: 'RoleAdminChanged'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'RoleGranted'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'RoleRevoked'
  },
  {
    type: 'function',
    inputs: [],
    name: 'ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'ALLOCATOR_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_BATCH_SIZE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'users', internalType: 'address[]', type: 'address[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    name: 'allocateRewards',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'users', internalType: 'address[]', type: 'address[]' }],
    name: 'claimReward',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'to', internalType: 'address', type: 'address' }],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'getUnAllocatedRewardAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'users', internalType: 'address[]', type: 'address[]' }],
    name: 'getUserRewardAmount',
    outputs: [
      { name: 'rewardAmounts', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'grantAllocatorRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: '_token', internalType: 'contract IERC20', type: 'address' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'reward', internalType: 'uint256', type: 'uint256' }],
    name: 'notifyRewardAmount',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'revokeAllocatorRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'users', internalType: 'address[]', type: 'address[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    name: 'revokeRewards',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view'
  }
] as const

/**
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const nitroRewardsAddress = {
  97: '0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd'
} as const

/**
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const nitroRewardsConfig = {
  address: nitroRewardsAddress,
  abi: nitroRewardsAbi
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RewardDistributor
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const rewardDistributorAbi = [
  {
    type: 'error',
    inputs: [
      {
        name: '_initializationContractAddress',
        internalType: 'address',
        type: 'address'
      },
      { name: '_calldata', internalType: 'bytes', type: 'bytes' }
    ],
    name: 'InitializationFunctionReverted'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_diamondCut',
        internalType: 'struct IDiamondCut.FacetCut[]',
        type: 'tuple[]',
        components: [
          { name: 'facetAddress', internalType: 'address', type: 'address' },
          {
            name: 'action',
            internalType: 'enum IDiamondCut.FacetCutAction',
            type: 'uint8'
          },
          {
            name: 'functionSelectors',
            internalType: 'bytes4[]',
            type: 'bytes4[]'
          }
        ],
        indexed: false
      },
      {
        name: '_init',
        internalType: 'address',
        type: 'address',
        indexed: false
      },
      {
        name: '_calldata',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false
      }
    ],
    name: 'DiamondCut'
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_diamondCut',
        internalType: 'struct IDiamondCut.FacetCut[]',
        type: 'tuple[]',
        components: [
          { name: 'facetAddress', internalType: 'address', type: 'address' },
          {
            name: 'action',
            internalType: 'enum IDiamondCut.FacetCutAction',
            type: 'uint8'
          },
          {
            name: 'functionSelectors',
            internalType: 'bytes4[]',
            type: 'bytes4[]'
          }
        ]
      },
      { name: '_init', internalType: 'address', type: 'address' },
      { name: '_calldata', internalType: 'bytes', type: 'bytes' }
    ],
    name: 'diamondCut',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: '_functionSelector', internalType: 'bytes4', type: 'bytes4' }
    ],
    name: 'facetAddress',
    outputs: [
      { name: 'facetAddress_', internalType: 'address', type: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'facetAddresses',
    outputs: [
      { name: 'facetAddresses_', internalType: 'address[]', type: 'address[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: '_facet', internalType: 'address', type: 'address' }],
    name: 'facetFunctionSelectors',
    outputs: [
      {
        name: '_facetFunctionSelectors',
        internalType: 'bytes4[]',
        type: 'bytes4[]'
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'facets',
    outputs: [
      {
        name: 'facets_',
        internalType: 'struct IDiamondLoupe.Facet[]',
        type: 'tuple[]',
        components: [
          { name: 'facetAddress', internalType: 'address', type: 'address' },
          {
            name: 'functionSelectors',
            internalType: 'bytes4[]',
            type: 'bytes4[]'
          }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: '_interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'OwnershipTransferred'
  },
  {
    type: 'function',
    inputs: [],
    name: 'nftActivityAssigner',
    outputs: [{ name: 'assigner_', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'owner_', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: '_newAssigner', internalType: 'address', type: 'address' }
    ],
    name: 'transferNftActivityAssigner',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: '_newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'lastRewardTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'totalRewardsPerSecond',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'accRewardsPerShare',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'totalRewardsWeight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      },
      {
        name: 'totalStakedNfts',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'LogUpdatePool'
  },
  {
    type: 'function',
    inputs: [],
    name: 'nftRewardsPerSecond',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'releasableUnrewardedTokens',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'releaseUnrewardedTokens',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'rewardsStartTime',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: '_rewardsStartTime', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'setRewardsStartTime',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'newTreasury', internalType: 'address', type: 'address' }],
    name: 'setTreasury',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalPendingRewards',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalRewarded',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalRewardsPerSecond',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalRewardsWeight',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalTreasuryWeight',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'treasury',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'updatePool',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenIds',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false
      }
    ],
    name: 'NftsStaked'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenIds',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false
      }
    ],
    name: 'NftsUnstaked'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'areNftsActive',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: '_accounts', internalType: 'address[]', type: 'address[]' },
      { name: '_areNftsActive', internalType: 'bool[]', type: 'bool[]' }
    ],
    name: 'bulkSetAreNftsActive',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' }
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenIds', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    name: 'stakeTokens',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'stakedBalanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'stakedBalanceOfByType',
    outputs: [
      { name: 'founderBalance', internalType: 'uint256', type: 'uint256' },
      { name: 'ambassadorBalance', internalType: 'uint256', type: 'uint256' },
      { name: 'cloudxBalance', internalType: 'uint256', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'index', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'stakedTokenOfOwnerByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'stakedTokensOfOwner',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'stakedTokensOfOwnerByType',
    outputs: [
      { name: 'founderTokens', internalType: 'uint256[]', type: 'uint256[]' },
      {
        name: 'ambassadorTokens',
        internalType: 'uint256[]',
        type: 'uint256[]'
      },
      { name: 'cloudxTokens', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_startIndex', internalType: 'uint256', type: 'uint256' },
      { name: '_pageSize', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'stakedTokensOfOwnerSubset',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalActiveNfts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalStakedNfts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalTreasuryNfts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenIds', internalType: 'uint256[]', type: 'uint256[]' }
    ],
    name: 'unstakeTokens',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'RewardsCollected'
  },
  {
    type: 'function',
    inputs: [],
    name: 'collectAvailable',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'collectRewards',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'feeAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'feeAmountUsd',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'feeToken',
    outputs: [
      { name: '', internalType: 'contract IERC20Metadata', type: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'pendingRewards',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'priceFeed',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'rewardsPerSecond',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'rewardsToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'rewardsWeight',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'newFeeAddress', internalType: 'address', type: 'address' }
    ],
    name: 'setFeeAddress',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'setFeeAmountUsd',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newFeeToken',
        internalType: 'contract IERC20Metadata',
        type: 'address'
      }
    ],
    name: 'setFeeToken',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'newPriceFeed', internalType: 'address', type: 'address' }
    ],
    name: 'setPriceFeed',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newRewardsToken',
        internalType: 'contract IERC20',
        type: 'address'
      }
    ],
    name: 'setRewardsToken',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'timestamp', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'addExternalBurn',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'burnMax',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'IntervalBurn'
  },
  {
    type: 'function',
    inputs: [],
    name: 'intervalBurn',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'lastIntervalBurnTime',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'updateTotalRewardsPerSecond',
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const rewardDistributorAddress = {
  56: '0x90327Ef98E4dE43d789C7f74B396f82438c2A052',
  97: '0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0'
} as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const rewardDistributorConfig = {
  address: rewardDistributorAddress,
  abi: rewardDistributorAbi
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Token
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const tokenAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialSupply_', internalType: 'uint256', type: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'Approval'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'OwnershipTransferred'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false
      }
    ],
    name: 'Paused'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'Transfer'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false
      }
    ],
    name: 'Unpaused'
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'burnFrom',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'excludeFromIncomingFee',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'excludeFromOutgoingFee',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'includeInIncomingFee',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'includeInOutgoingFee',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'initialSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'isExcludedFromIncomingFee',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'isExcludedFromOutgoingFee',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'transferFeePercentage',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const tokenAddress = {
  56: '0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e',
  97: '0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25'
} as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const tokenConfig = { address: tokenAddress, abi: tokenAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// USDC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const usdcAbi = [
  {
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ],
    name: 'Approval'
  },
  {
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ],
    name: 'Transfer'
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const usdcAddress = {
  56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  97: '0x64544969ed7EBf5f083679233325356EbE738930'
} as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const usdcConfig = { address: usdcAddress, abi: usdcAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// USDT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const usdtAbi = [
  {
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ],
    name: 'Approval'
  },
  {
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ],
    name: 'Transfer'
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const usdtAddress = {
  56: '0x55d398326f99059fF775485246999027B3197955',
  97: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
} as const

/**
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const usdtConfig = { address: usdtAddress, abi: usdtAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNft = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"CLOCK_MODE"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftClockMode = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'CLOCK_MODE'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftDefaultAdminRole = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'DEFAULT_ADMIN_ROLE'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"MINTER_ROLE"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftMinterRole = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'MINTER_ROLE'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"ambassadorMax"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftAmbassadorMax = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'ambassadorMax'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"ambassadorMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftAmbassadorMintCost = /*#__PURE__*/ createUseReadContract(
  { abi: nftAbi, address: nftAddress, functionName: 'ambassadorMintCost' }
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'balanceOf'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"balanceOfByType"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftBalanceOfByType = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'balanceOfByType'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"clock"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftClock = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'clock'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"cloudxMax"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftCloudxMax = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'cloudxMax'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"cloudxMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftCloudxMintCost = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'cloudxMintCost'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"contractURI"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftContractUri = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'contractURI'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"delegates"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftDelegates = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'delegates'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"eip712Domain"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftEip712Domain = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'eip712Domain'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"founderMax"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftFounderMax = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'founderMax'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"founderMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftFounderMintCost = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'founderMintCost'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"getApproved"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftGetApproved = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'getApproved'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"getNftType"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftGetNftType = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'getNftType'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"getPastTotalSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftGetPastTotalSupply = /*#__PURE__*/ createUseReadContract(
  { abi: nftAbi, address: nftAddress, functionName: 'getPastTotalSupply' }
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"getPastVotes"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftGetPastVotes = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'getPastVotes'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftGetRoleAdmin = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'getRoleAdmin'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"getSupplies"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftGetSupplies = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'getSupplies'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"getVotes"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftGetVotes = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'getVotes'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"hasRole"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftHasRole = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'hasRole'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftIsApprovedForAll = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'isApprovedForAll'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"isMintingEnabled"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftIsMintingEnabled = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'isMintingEnabled'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"isPaymentEnabled"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftIsPaymentEnabled = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'isPaymentEnabled'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"maxSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftMaxSupply = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'maxSupply'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"mintFeeAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftMintFeeAddress = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'mintFeeAddress'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"mintFeeCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftMintFeeCost = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'mintFeeCost'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"mintFeeToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftMintFeeToken = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'mintFeeToken'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"mintingWhitelistAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftMintingWhitelistAllowance =
  /*#__PURE__*/ createUseReadContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'mintingWhitelistAllowance'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftName = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'name'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"ownerOf"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'ownerOf'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"paymentAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftPaymentAddress = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'paymentAddress'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"paymentToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftPaymentToken = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'paymentToken'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'proxiableUUID'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"staker"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftStaker = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'staker'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftSupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'supportsInterface'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftSymbol = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'symbol'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"tokenByIndex"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTokenByIndex = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'tokenByIndex'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"tokenOfOwnerByIndex"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTokenOfOwnerByIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'tokenOfOwnerByIndex'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"tokenURI"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'tokenURI'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"tokensOfOwner"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTokensOfOwner = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'tokensOfOwner'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"tokensOfOwnerByType"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTokensOfOwnerByType =
  /*#__PURE__*/ createUseReadContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'tokensOfOwnerByType'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"tokensOfOwnerSubset"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTokensOfOwnerSubset =
  /*#__PURE__*/ createUseReadContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'tokensOfOwnerSubset'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'totalSupply'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"totalUnredeemed"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useReadNftTotalUnredeemed = /*#__PURE__*/ createUseReadContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'totalUnredeemed'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNft = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftApprove = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"burn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftBurn = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'burn'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"decrementMintingWhitelistAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftDecrementMintingWhitelistAllowance =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'decrementMintingWhitelistAllowance'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"delegate"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftDelegate = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'delegate'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"delegateBySig"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftDelegateBySig = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'delegateBySig'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"grantRole"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftGrantRole = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'grantRole'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"incrementMintingWhitelistAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftIncrementMintingWhitelistAllowance =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'incrementMintingWhitelistAllowance'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'initialize'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"renounceRole"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftRenounceRole = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'renounceRole'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"revokeRole"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftRevokeRole = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'revokeRole'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeMintBatch"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSafeMintBatch = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'safeMintBatch'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeMintBatchPayment"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSafeMintBatchPayment =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'safeMintBatchPayment'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeMintBatchWhitelist"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSafeMintBatchWhitelist =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'safeMintBatchWhitelist'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSafeTransferFrom = /*#__PURE__*/ createUseWriteContract(
  { abi: nftAbi, address: nftAddress, functionName: 'safeTransferFrom' }
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setAmbassadorMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetAmbassadorMintCost =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setAmbassadorMintCost'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setApprovalForAll'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setBaseURI"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetBaseUri = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setBaseURI'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setCloudxMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetCloudxMintCost =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setCloudxMintCost'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setContractURI"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetContractUri = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setContractURI'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setFounderMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetFounderMintCost =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setFounderMintCost'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setIsMintingEnabled"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetIsMintingEnabled =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setIsMintingEnabled'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setIsPaymentEnabled"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetIsPaymentEnabled =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setIsPaymentEnabled'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMaxSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetMaxSupply = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setMaxSupply'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMintFeeAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetMintFeeAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setMintFeeAddress'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMintFeeCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetMintFeeCost = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setMintFeeCost'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMintFeeToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetMintFeeToken = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setMintFeeToken'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setPaymentAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetPaymentAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setPaymentAddress'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setPaymentToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetPaymentToken = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setPaymentToken'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setStaker"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftSetStaker = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setStaker'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'transferFrom'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'upgradeTo'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWriteNftUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract(
  { abi: nftAbi, address: nftAddress, functionName: 'upgradeToAndCall' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNft = /*#__PURE__*/ createUseSimulateContract({
  abi: nftAbi,
  address: nftAddress
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"burn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftBurn = /*#__PURE__*/ createUseSimulateContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'burn'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"decrementMintingWhitelistAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftDecrementMintingWhitelistAllowance =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'decrementMintingWhitelistAllowance'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"delegate"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftDelegate = /*#__PURE__*/ createUseSimulateContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'delegate'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"delegateBySig"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftDelegateBySig =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'delegateBySig'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"grantRole"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftGrantRole = /*#__PURE__*/ createUseSimulateContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'grantRole'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"incrementMintingWhitelistAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftIncrementMintingWhitelistAllowance =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'incrementMintingWhitelistAllowance'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftInitialize = /*#__PURE__*/ createUseSimulateContract(
  { abi: nftAbi, address: nftAddress, functionName: 'initialize' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"renounceRole"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'renounceRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"revokeRole"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftRevokeRole = /*#__PURE__*/ createUseSimulateContract(
  { abi: nftAbi, address: nftAddress, functionName: 'revokeRole' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeMintBatch"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSafeMintBatch =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'safeMintBatch'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeMintBatchPayment"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSafeMintBatchPayment =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'safeMintBatchPayment'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeMintBatchWhitelist"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSafeMintBatchWhitelist =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'safeMintBatchWhitelist'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'safeTransferFrom'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setAmbassadorMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetAmbassadorMintCost =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setAmbassadorMintCost'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setApprovalForAll'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setBaseURI"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetBaseUri = /*#__PURE__*/ createUseSimulateContract(
  { abi: nftAbi, address: nftAddress, functionName: 'setBaseURI' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setCloudxMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetCloudxMintCost =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setCloudxMintCost'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setContractURI"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetContractUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setContractURI'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setFounderMintCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetFounderMintCost =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setFounderMintCost'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setIsMintingEnabled"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetIsMintingEnabled =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setIsMintingEnabled'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setIsPaymentEnabled"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetIsPaymentEnabled =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setIsPaymentEnabled'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMaxSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetMaxSupply =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setMaxSupply'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMintFeeAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetMintFeeAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setMintFeeAddress'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMintFeeCost"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetMintFeeCost =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setMintFeeCost'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setMintFeeToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetMintFeeToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setMintFeeToken'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setPaymentAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetPaymentAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setPaymentAddress'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setPaymentToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetPaymentToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'setPaymentToken'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"setStaker"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftSetStaker = /*#__PURE__*/ createUseSimulateContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'setStaker'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'transferFrom'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftUpgradeTo = /*#__PURE__*/ createUseSimulateContract({
  abi: nftAbi,
  address: nftAddress,
  functionName: 'upgradeTo'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nftAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useSimulateNftUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nftAbi,
    address: nftAddress,
    functionName: 'upgradeToAndCall'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: nftAbi,
  address: nftAddress
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"AdminChanged"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'AdminChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'Approval'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'ApprovalForAll'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"BeaconUpgraded"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftBeaconUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'BeaconUpgraded'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"DelegateChanged"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftDelegateChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'DelegateChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"DelegateVotesChanged"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftDelegateVotesChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'DelegateVotesChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftEip712DomainChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'EIP712DomainChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"Initialized"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'Initialized'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'RoleAdminChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'RoleGranted'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'RoleRevoked'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'Transfer'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nftAbi}__ and `eventName` set to `"Upgraded"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x93778D643200078BD49F9fF7f03cfB906a5d4987)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x9cE60e029342Eb7FD3243A842F7ee686638d5bcA)
 */
export const useWatchNftUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nftAbi,
    address: nftAddress,
    eventName: 'Upgraded'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewards = /*#__PURE__*/ createUseReadContract({
  abi: nitroRewardsAbi,
  address: nitroRewardsAddress
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"ADMIN_ROLE"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsAdminRole = /*#__PURE__*/ createUseReadContract(
  {
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'ADMIN_ROLE'
  }
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"ALLOCATOR_ROLE"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsAllocatorRole =
  /*#__PURE__*/ createUseReadContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'ALLOCATOR_ROLE'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'DEFAULT_ADMIN_ROLE'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"MAX_BATCH_SIZE"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsMaxBatchSize =
  /*#__PURE__*/ createUseReadContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'MAX_BATCH_SIZE'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsGetRoleAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'getRoleAdmin'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"getUnAllocatedRewardAmount"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsGetUnAllocatedRewardAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'getUnAllocatedRewardAmount'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"getUserRewardAmount"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsGetUserRewardAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'getUserRewardAmount'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"hasRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsHasRole = /*#__PURE__*/ createUseReadContract({
  abi: nitroRewardsAbi,
  address: nitroRewardsAddress,
  functionName: 'hasRole'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'supportsInterface'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"token"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useReadNitroRewardsToken = /*#__PURE__*/ createUseReadContract({
  abi: nitroRewardsAbi,
  address: nitroRewardsAddress,
  functionName: 'token'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewards = /*#__PURE__*/ createUseWriteContract({
  abi: nitroRewardsAbi,
  address: nitroRewardsAddress
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"allocateRewards"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsAllocateRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'allocateRewards'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"claimReward"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsClaimReward =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'claimReward'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"emergencyWithdraw"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsEmergencyWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'emergencyWithdraw'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"grantAllocatorRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsGrantAllocatorRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'grantAllocatorRole'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsGrantRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'grantRole'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'initialize'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"notifyRewardAmount"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsNotifyRewardAmount =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'notifyRewardAmount'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'renounceRole'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"revokeAllocatorRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsRevokeAllocatorRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'revokeAllocatorRole'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"revokeRewards"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsRevokeRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'revokeRewards'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWriteNitroRewardsRevokeRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'revokeRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewards = /*#__PURE__*/ createUseSimulateContract({
  abi: nitroRewardsAbi,
  address: nitroRewardsAddress
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"allocateRewards"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsAllocateRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'allocateRewards'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"claimReward"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsClaimReward =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'claimReward'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"emergencyWithdraw"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsEmergencyWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'emergencyWithdraw'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"grantAllocatorRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsGrantAllocatorRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'grantAllocatorRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'grantRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'initialize'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"notifyRewardAmount"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsNotifyRewardAmount =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'notifyRewardAmount'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'renounceRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"revokeAllocatorRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsRevokeAllocatorRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'revokeAllocatorRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"revokeRewards"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsRevokeRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'revokeRewards'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nitroRewardsAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useSimulateNitroRewardsRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    functionName: 'revokeRole'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"EmergencyWithdrawalExecuted"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsEmergencyWithdrawalExecutedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'EmergencyWithdrawalExecuted'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'Initialized'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"RewardAdded"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsRewardAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'RewardAdded'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"RewardClaimed"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsRewardClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'RewardClaimed'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"RewardsAllocated"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsRewardsAllocatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'RewardsAllocated'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"RewardsRevoked"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsRewardsRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'RewardsRevoked'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'RoleAdminChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'RoleGranted'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nitroRewardsAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDD4A3199d49f9c91eEb9b9F3C7467f566fC436Bd)
 */
export const useWatchNitroRewardsRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nitroRewardsAbi,
    address: nitroRewardsAddress,
    eventName: 'RoleRevoked'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributor = /*#__PURE__*/ createUseReadContract({
  abi: rewardDistributorAbi,
  address: rewardDistributorAddress
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"facetAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorFacetAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'facetAddress'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"facetAddresses"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorFacetAddresses =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'facetAddresses'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"facetFunctionSelectors"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorFacetFunctionSelectors =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'facetFunctionSelectors'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"facets"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorFacets =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'facets'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'supportsInterface'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"nftActivityAssigner"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorNftActivityAssigner =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'nftActivityAssigner'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'owner'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"nftRewardsPerSecond"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorNftRewardsPerSecond =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'nftRewardsPerSecond'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"releasableUnrewardedTokens"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorReleasableUnrewardedTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'releasableUnrewardedTokens'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"rewardsStartTime"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorRewardsStartTime =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'rewardsStartTime'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalPendingRewards"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalPendingRewards =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalPendingRewards'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalRewarded"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalRewarded =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalRewarded'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalRewardsPerSecond"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalRewardsPerSecond =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalRewardsPerSecond'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalRewardsWeight"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalRewardsWeight =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalRewardsWeight'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalTreasuryWeight"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalTreasuryWeight =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalTreasuryWeight'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"treasury"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTreasury =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'treasury'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"areNftsActive"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorAreNftsActive =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'areNftsActive'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakedBalanceOf"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorStakedBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakedBalanceOf'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakedBalanceOfByType"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorStakedBalanceOfByType =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakedBalanceOfByType'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakedTokenOfOwnerByIndex"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorStakedTokenOfOwnerByIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakedTokenOfOwnerByIndex'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakedTokensOfOwner"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorStakedTokensOfOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakedTokensOfOwner'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakedTokensOfOwnerByType"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorStakedTokensOfOwnerByType =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakedTokensOfOwnerByType'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakedTokensOfOwnerSubset"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorStakedTokensOfOwnerSubset =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakedTokensOfOwnerSubset'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalActiveNfts"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalActiveNfts =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalActiveNfts'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalStakedNfts"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalStakedNfts =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalStakedNfts'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"totalTreasuryNfts"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorTotalTreasuryNfts =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'totalTreasuryNfts'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"collectAvailable"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorCollectAvailable =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'collectAvailable'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"feeAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorFeeAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'feeAddress'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"feeAmountUsd"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorFeeAmountUsd =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'feeAmountUsd'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"feeToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorFeeToken =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'feeToken'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"pendingRewards"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorPendingRewards =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'pendingRewards'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"priceFeed"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorPriceFeed =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'priceFeed'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"rewardsPerSecond"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorRewardsPerSecond =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'rewardsPerSecond'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"rewardsToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorRewardsToken =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'rewardsToken'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"rewardsWeight"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorRewardsWeight =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'rewardsWeight'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"lastIntervalBurnTime"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useReadRewardDistributorLastIntervalBurnTime =
  /*#__PURE__*/ createUseReadContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'lastIntervalBurnTime'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributor = /*#__PURE__*/ createUseWriteContract({
  abi: rewardDistributorAbi,
  address: rewardDistributorAddress
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"diamondCut"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorDiamondCut =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'diamondCut'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"transferNftActivityAssigner"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorTransferNftActivityAssigner =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'transferNftActivityAssigner'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'transferOwnership'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"releaseUnrewardedTokens"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorReleaseUnrewardedTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'releaseUnrewardedTokens'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setRewardsStartTime"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorSetRewardsStartTime =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setRewardsStartTime'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setTreasury"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorSetTreasury =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setTreasury'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"updatePool"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorUpdatePool =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'updatePool'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"bulkSetAreNftsActive"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorBulkSetAreNftsActive =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'bulkSetAreNftsActive'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorOnErc721Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'onERC721Received'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakeTokens"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorStakeTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakeTokens'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"unstakeTokens"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorUnstakeTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'unstakeTokens'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"collectRewards"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorCollectRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'collectRewards'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setFeeAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorSetFeeAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setFeeAddress'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setFeeAmountUsd"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorSetFeeAmountUsd =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setFeeAmountUsd'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setFeeToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorSetFeeToken =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setFeeToken'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setPriceFeed"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorSetPriceFeed =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setPriceFeed'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setRewardsToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorSetRewardsToken =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setRewardsToken'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"addExternalBurn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorAddExternalBurn =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'addExternalBurn'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"burn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorBurn =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'burn'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"burnMax"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorBurnMax =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'burnMax'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"intervalBurn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorIntervalBurn =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'intervalBurn'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"updateTotalRewardsPerSecond"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWriteRewardDistributorUpdateTotalRewardsPerSecond =
  /*#__PURE__*/ createUseWriteContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'updateTotalRewardsPerSecond'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"diamondCut"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorDiamondCut =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'diamondCut'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"transferNftActivityAssigner"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorTransferNftActivityAssigner =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'transferNftActivityAssigner'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'transferOwnership'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"releaseUnrewardedTokens"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorReleaseUnrewardedTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'releaseUnrewardedTokens'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setRewardsStartTime"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorSetRewardsStartTime =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setRewardsStartTime'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setTreasury"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorSetTreasury =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setTreasury'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"updatePool"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorUpdatePool =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'updatePool'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"bulkSetAreNftsActive"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorBulkSetAreNftsActive =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'bulkSetAreNftsActive'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorOnErc721Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'onERC721Received'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"stakeTokens"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorStakeTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'stakeTokens'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"unstakeTokens"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorUnstakeTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'unstakeTokens'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"collectRewards"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorCollectRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'collectRewards'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setFeeAddress"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorSetFeeAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setFeeAddress'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setFeeAmountUsd"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorSetFeeAmountUsd =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setFeeAmountUsd'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setFeeToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorSetFeeToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setFeeToken'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setPriceFeed"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorSetPriceFeed =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setPriceFeed'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"setRewardsToken"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorSetRewardsToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'setRewardsToken'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"addExternalBurn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorAddExternalBurn =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'addExternalBurn'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"burn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorBurn =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'burn'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"burnMax"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorBurnMax =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'burnMax'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"intervalBurn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorIntervalBurn =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'intervalBurn'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rewardDistributorAbi}__ and `functionName` set to `"updateTotalRewardsPerSecond"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useSimulateRewardDistributorUpdateTotalRewardsPerSecond =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    functionName: 'updateTotalRewardsPerSecond'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__ and `eventName` set to `"DiamondCut"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorDiamondCutEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    eventName: 'DiamondCut'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    eventName: 'OwnershipTransferred'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__ and `eventName` set to `"LogUpdatePool"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorLogUpdatePoolEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    eventName: 'LogUpdatePool'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__ and `eventName` set to `"NftsStaked"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorNftsStakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    eventName: 'NftsStaked'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__ and `eventName` set to `"NftsUnstaked"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorNftsUnstakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    eventName: 'NftsUnstaked'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__ and `eventName` set to `"RewardsCollected"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorRewardsCollectedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    eventName: 'RewardsCollected'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rewardDistributorAbi}__ and `eventName` set to `"IntervalBurn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x90327Ef98E4dE43d789C7f74B396f82438c2A052)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xea990E7E9B11886Ab50CcE6352dB3c011b6093d0)
 */
export const useWatchRewardDistributorIntervalBurnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rewardDistributorAbi,
    address: rewardDistributorAddress,
    eventName: 'IntervalBurn'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadToken = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenAllowance = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'allowance'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'balanceOf'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenDecimals = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'decimals'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"initialSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenInitialSupply = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'initialSupply'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"isExcludedFromIncomingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenIsExcludedFromIncomingFee =
  /*#__PURE__*/ createUseReadContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'isExcludedFromIncomingFee'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"isExcludedFromOutgoingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenIsExcludedFromOutgoingFee =
  /*#__PURE__*/ createUseReadContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'isExcludedFromOutgoingFee'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenName = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'name'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenOwner = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'owner'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"paused"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenPaused = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'paused'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenSymbol = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'symbol'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'totalSupply'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"transferFeePercentage"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useReadTokenTransferFeePercentage =
  /*#__PURE__*/ createUseReadContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'transferFeePercentage'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteToken = /*#__PURE__*/ createUseWriteContract({
  abi: tokenAbi,
  address: tokenAddress
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenApprove = /*#__PURE__*/ createUseWriteContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"burn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenBurn = /*#__PURE__*/ createUseWriteContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'burn'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"burnFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenBurnFrom = /*#__PURE__*/ createUseWriteContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'burnFrom'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"decreaseAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenDecreaseAllowance =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'decreaseAllowance'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"excludeFromIncomingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenExcludeFromIncomingFee =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'excludeFromIncomingFee'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"excludeFromOutgoingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenExcludeFromOutgoingFee =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'excludeFromOutgoingFee'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"includeInIncomingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenIncludeInIncomingFee =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'includeInIncomingFee'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"includeInOutgoingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenIncludeInOutgoingFee =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'includeInOutgoingFee'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"increaseAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenIncreaseAllowance =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'increaseAllowance'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'renounceOwnership'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'transfer'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'transferFrom'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWriteTokenTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'transferOwnership'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateToken = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenAbi,
  address: tokenAddress
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"burn"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenBurn = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenAbi,
  address: tokenAddress,
  functionName: 'burn'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"burnFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenBurnFrom = /*#__PURE__*/ createUseSimulateContract(
  { abi: tokenAbi, address: tokenAddress, functionName: 'burnFrom' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"decreaseAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenDecreaseAllowance =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'decreaseAllowance'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"excludeFromIncomingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenExcludeFromIncomingFee =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'excludeFromIncomingFee'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"excludeFromOutgoingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenExcludeFromOutgoingFee =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'excludeFromOutgoingFee'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"includeInIncomingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenIncludeInIncomingFee =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'includeInIncomingFee'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"includeInOutgoingFee"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenIncludeInOutgoingFee =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'includeInOutgoingFee'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"increaseAllowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenIncreaseAllowance =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'increaseAllowance'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'renounceOwnership'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenTransfer = /*#__PURE__*/ createUseSimulateContract(
  { abi: tokenAbi, address: tokenAddress, functionName: 'transfer' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'transferFrom'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useSimulateTokenTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenAbi,
    address: tokenAddress,
    functionName: 'transferOwnership'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWatchTokenEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: tokenAbi,
  address: tokenAddress
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWatchTokenApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenAbi,
    address: tokenAddress,
    eventName: 'Approval'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWatchTokenOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenAbi,
    address: tokenAddress,
    eventName: 'OwnershipTransferred'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenAbi}__ and `eventName` set to `"Paused"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWatchTokenPausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenAbi,
    address: tokenAddress,
    eventName: 'Paused'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWatchTokenTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenAbi,
    address: tokenAddress,
    eventName: 'Transfer'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenAbi}__ and `eventName` set to `"Unpaused"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x41bc9f2C4FC61Ae341AAf4637bb611Fe27ecCc3e)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0xDDe2462097790A0F1cDB2B53E1bBd0c820Ce8D25)
 */
export const useWatchTokenUnpausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenAbi,
    address: tokenAddress,
    eventName: 'Unpaused'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useReadUsdc = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useReadUsdcAllowance = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'allowance'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useReadUsdcBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'balanceOf'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useReadUsdcDecimals = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'decimals'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useReadUsdcName = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'name'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useReadUsdcSymbol = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'symbol'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useReadUsdcTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'totalSupply'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useWriteUsdc = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useWriteUsdcApprove = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useWriteUsdcTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useWriteUsdcTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useSimulateUsdc = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useSimulateUsdcApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useSimulateUsdcTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useSimulateUsdcTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: usdcAbi,
    address: usdcAddress,
    functionName: 'transferFrom'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useWatchUsdcEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useWatchUsdcApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: usdcAbi,
    address: usdcAddress,
    eventName: 'Approval'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x64544969ed7EBf5f083679233325356EbE738930)
 */
export const useWatchUsdcTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: usdcAbi,
    address: usdcAddress,
    eventName: 'Transfer'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdtAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useReadUsdt = /*#__PURE__*/ createUseReadContract({
  abi: usdtAbi,
  address: usdtAddress
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useReadUsdtAllowance = /*#__PURE__*/ createUseReadContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'allowance'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useReadUsdtBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'balanceOf'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useReadUsdtDecimals = /*#__PURE__*/ createUseReadContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'decimals'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useReadUsdtName = /*#__PURE__*/ createUseReadContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'name'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useReadUsdtSymbol = /*#__PURE__*/ createUseReadContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'symbol'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useReadUsdtTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'totalSupply'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdtAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useWriteUsdt = /*#__PURE__*/ createUseWriteContract({
  abi: usdtAbi,
  address: usdtAddress
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useWriteUsdtApprove = /*#__PURE__*/ createUseWriteContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useWriteUsdtTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'transfer'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useWriteUsdtTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'transferFrom'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdtAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useSimulateUsdt = /*#__PURE__*/ createUseSimulateContract({
  abi: usdtAbi,
  address: usdtAddress
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useSimulateUsdtApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'approve'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useSimulateUsdtTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: usdtAbi,
  address: usdtAddress,
  functionName: 'transfer'
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdtAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useSimulateUsdtTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: usdtAbi,
    address: usdtAddress,
    functionName: 'transferFrom'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdtAbi}__
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useWatchUsdtEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdtAbi,
  address: usdtAddress
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdtAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useWatchUsdtApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: usdtAbi,
    address: usdtAddress,
    eventName: 'Approval'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdtAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Bnb Smart Chain Bsc Scan__](https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955)
 * - [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
 */
export const useWatchUsdtTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: usdtAbi,
    address: usdtAddress,
    eventName: 'Transfer'
  })
