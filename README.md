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
| `NEXT_PUBLIC_LEMON_LOANS_ADDRESS` | When 1006 is in supported chains | Loans contract address on LemonChain mainnet |
| `NEXT_PUBLIC_CITRON_LOANS_ADDRESS` | When 1005 is in supported chains | Loans contract address on Citron testnet |
| `NEXT_PUBLIC_BSC_LOANS_ADDRESS` | When 56 is in supported chains | Loans contract address on BNB Smart Chain mainnet |
| `NEXT_PUBLIC_SUPPORTED_CHAINS` | No | Comma-separated chain ids (e.g. `1006,56`). First entry is the default. Defaults to LemonChain mainnet (`1006`) when unset. Known ids: `1006` LemonChain mainnet, `1005` Citron testnet, `56` BNB Smart Chain mainnet. |
| `NEXT_PUBLIC_HIDE_LOANS_PAGE` | No | Set to `true` to hide the loans page — the nav item is removed and `/` redirects to `/liquidity`. Any other value (or unset) leaves loans visible. |
| `NEXT_PUBLIC_CITRON_REFERRAL_ROUTER_ADDRESS` | No | `ReferralDepositRouter` on Citron testnet. **Setting this makes the chain referral-only** — see Referrals below. Unset or zero address disables all referral behaviour and restores the plain deposit flow. |
| `NEXT_PUBLIC_LEMON_REFERRAL_ROUTER_ADDRESS` | No | `ReferralDepositRouter` on LemonChain mainnet. |
| `NEXT_PUBLIC_BSC_REFERRAL_ROUTER_ADDRESS` | No | `ReferralDepositRouter` on BNB Smart Chain mainnet. |

The commissions contract is deliberately **not** an environment variable — it is per-company and travels in the referral link, so a single build serves every partner.

Only the Loans contract address is required per chain. The rest of the protocol contracts (`CollateralManager`, `LiquidityPool`, `SwapManager`) are discovered on-chain at app load via `Loans.collateralManager()`, `Loans.liquidityPool()`, and `LiquidityPool.swapManager()`.

Copy `.env.example` to `.env` and fill in the values. Never commit `.env` — it is gitignored.

### Referrals

A referral link carries **two** halves, and both are required:

```
https://<app>/liquidity?affiliate=0xAFFILIATE&commissions=0xCOMMISSIONS
```

- `?affiliate=` (or `?ref=`) — the affiliate's wallet, credited with the commission.
- `?commissions=` — the **per-company** commissions contract, which must appear in the
  router's `allowedCommissionsList()`. This is why it travels in the link rather than in
  build config: one build serves every partner.

The pair is remembered in `sessionStorage` for the visit, so it survives navigation and the
wallet-connect round-trip. The URL always wins over storage, and a broken link clears
storage rather than silently falling back to an earlier company's contract.

**On a chain with a router configured, deposits are referral-only.** A visitor with no
link, a half-built link, a malformed address, a commissions contract the router does not
allowlist, an affiliate that `isRegistered()` reports as false, or a link pointing at their
own wallet, cannot deposit. They are shown the reason and told to contact the person who
referred them.

Leave `NEXT_PUBLIC_<CHAIN>_REFERRAL_ROUTER_ADDRESS` unset (or at the zero address) and the
referral layer is **inert** on that chain: no referral UI, no referral RPC calls, and
deposits behave exactly as they did before. That is the kill switch — use it to take a
chain out of referral-only mode.

Three details worth knowing when operating this:

- On the referral path the token approval targets the **router**, not the pool — the router
  pulls tokens with `transferFrom`. The UI switches the spender automatically.
- Commission settlement is a gas-capped self-call inside the router. It can fail while the
  deposit itself succeeds; the router then emits `ReferralSkipped` and the success toast
  reports "commission was skipped". That is an expected outcome, not an error.
- `royal-citadel-affiliate-dapp` currently generates `?affiliate=` only. It must be updated
  to append `&commissions=` before its links will work against a referral-only chain.

### Cloudflare Pages Secrets

For Cloudflare Pages deployments, secrets must be set via the Wrangler CLI rather than the dashboard. Dashboard-configured secrets are runtime-only and are not available during the build step (where `wagmi generate` and `next build` run), so contract addresses and the WalletConnect project ID must be set as Wrangler secrets:

```bash
npx wrangler pages secret put NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID --project-name=loans-dapp
npx wrangler pages secret put NEXT_PUBLIC_LEMON_LOANS_ADDRESS --project-name=loans-dapp
npx wrangler pages secret put NEXT_PUBLIC_BSC_LOANS_ADDRESS --project-name=loans-dapp
# Plus NEXT_PUBLIC_CITRON_LOANS_ADDRESS for builds that include the Citron testnet.

# Referral layer + loans-page visibility. Both are NEXT_PUBLIC_*, so they are inlined at
# BUILD time — changing either requires a rebuild, not just a redeploy.
npx wrangler pages secret put NEXT_PUBLIC_HIDE_LOANS_PAGE --project-name=loans-dapp
npx wrangler pages secret put NEXT_PUBLIC_CITRON_REFERRAL_ROUTER_ADDRESS --project-name=loans-dapp
# Plus the NEXT_PUBLIC_LEMON_* / NEXT_PUBLIC_BSC_* equivalents once those chains have a router.
# There is no commissions secret — that address travels in the referral link.
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
