# LemLoans DApp

Decentralized loan management application for LemonChain. Built with Next.js 14, wagmi v2, and RainbowKit.

## Prerequisites

- Node.js 18+
- npm 9+
- A [WalletConnect Cloud](https://cloud.walletconnect.com/) project ID

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and populate it (see Environment Variables below)
cp .env.example .env

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

All variables must be prefixed `NEXT_PUBLIC_` to be available in the browser.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Yes | WalletConnect Cloud project ID |
| `NEXT_PUBLIC_LEMON_LOANS_ADDRESS` | Yes | Loans contract address on LemonChain mainnet |
| `NEXT_PUBLIC_CITRON_LOANS_ADDRESS` | Testnet only | Loans contract address on Citron testnet |
| `NEXT_PUBLIC_INCLUDE_TESTNET` | No | Set to `true` to include Citron testnet in the wallet network list |

Only the Loans contract address is required per chain. The rest of the protocol contracts (`CollateralManager`, `LiquidityPool`, `SwapManager`) are discovered on-chain at app load via `Loans.collateralManager()`, `Loans.liquidityPool()`, and `LiquidityPool.swapManager()`.

Copy `.env.example` to `.env` and fill in the values. Never commit `.env` — it is gitignored.

### Cloudflare Pages Secrets

For Cloudflare Pages deployments, secrets must be set via the Wrangler CLI rather than the dashboard. Dashboard-configured secrets are runtime-only and are not available during the build step (where `wagmi generate` and `next build` run), so contract addresses and the WalletConnect project ID must be set as Wrangler secrets:

```bash
npx wrangler pages secret put NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID --project-name=loans-dapp
npx wrangler pages secret put NEXT_PUBLIC_LEMON_LOANS_ADDRESS --project-name=loans-dapp
# And, for testnet builds, NEXT_PUBLIC_CITRON_LOANS_ADDRESS
```

Non-sensitive public variables can alternatively be set in `wrangler.toml` under `[vars]`.

## Build

```bash
npm run build
```

The build pipeline runs in sequence:
1. `scripts/generate-robots-txt.js` — generates `public/robots.txt` based on `NODE_ENV`
2. `wagmi generate` — regenerates `src/generated.ts` from ABIs and contract addresses in `.env`
3. `prettier` — formats the generated file
4. `next build` — compiles the application

> `src/generated.ts` is gitignored and always regenerated at build time. If you change an ABI or contract address, the next build will pick it up automatically.

## Deployment

This project deploys to [Cloudflare Pages](https://pages.cloudflare.com/).

```bash
# Build for Cloudflare Pages
npm run pages:build

# Deploy
npm run deploy
```

For a fresh deployment, complete the contract setup steps in [docs/mainnet-setup.md](docs/mainnet-setup.md) before going live.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS, Radix UI |
| Web3 | wagmi v2, viem, RainbowKit |
| Network | LemonChain (mainnet id: 1006), Citron testnet (id: 1005) |
| Deployment | Cloudflare Pages |
