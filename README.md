# Loans DApp

A decentralized loan management application built with Next.js, wagmi, and RainbowKit.

## Features

- Connect wallet using RainbowKit
- View loan management dashboard
- Create and manage loans
- Lend and borrow funds
- Built with modern web3 technologies

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cloudflare integration

Besides the `dev` script mentioned above `c3` has added a few extra scripts that
allow you to integrate the application with the
[Cloudflare Pages](https://pages.cloudflare.com/) environment, these are:

- `pages:build` to build the application for Pages using the
  [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) CLI
- `preview` to locally preview your Pages application using the
  [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI
- `deploy` to deploy your Pages application using the
  [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI

> **Note:** while the `dev` script is optimal for local development you should
> preview your Pages application as well (periodically or before deployments) in
> order to make sure that it can properly work in the Pages environment (for
> more details see the
> [`@cloudflare/next-on-pages` recommended workflow](https://github.com/cloudflare/next-on-pages/blob/main/internal-packages/next-dev/README.md#recommended-development-workflow))

### Bindings

Cloudflare
[Bindings](https://developers.cloudflare.com/pages/functions/bindings/) are what
allows you to interact with resources available in the Cloudflare Platform.

You can use bindings during development, when previewing locally your
application and of course in the deployed application:

- To use bindings in dev mode you need to define them in the `next.config.js`
  file under `setupDevBindings`, this mode uses the `next-dev`
  `@cloudflare/next-on-pages` submodule. For more details see its
  [documentation](https://github.com/cloudflare/next-on-pages/blob/05b6256/internal-packages/next-dev/README.md).

- To use bindings in the preview mode you need to add them to the
  `pages:preview` script accordingly to the `wrangler pages dev` command. For
  more details see its
  [documentation](https://developers.cloudflare.com/workers/wrangler/commands/#dev-1)
  or the
  [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

- To use bindings in the deployed application you will need to configure them in
  the Cloudflare [dashboard](https://dash.cloudflare.com/). For more details see
  the
  [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

#### KV Example

`c3` has added for you an example showing how you can use a KV binding.

In order to enable the example:

- Search for javascript/typescript lines containing the following comment:
  ```ts
  // KV Example:
  ```
  and uncomment the commented lines below it.
- Do the same in the `wrangler.toml` file, where the comment is:
  ```
  # KV Example:
  ```
- If you're using TypeScript run the `cf-typegen` script to update the
  `env.d.ts` file:
  ```bash
  npm run cf-typegen
  # or
  yarn cf-typegen
  # or
  pnpm cf-typegen
  # or
  bun cf-typegen
  ```

After doing this you can run the `dev` or `preview` script and visit the
`/api/hello` route to see the example in action.

Finally, if you also want to see the example work in the deployed application
make sure to add a `MY_KV_NAMESPACE` binding to your Pages application in its
[dashboard kv bindings settings section](https://dash.cloudflare.com/?to=/:account/pages/view/:pages-project/settings/functions#kv_namespace_bindings_section).
After having configured it make sure to re-deploy your application.

## Environment Variables & Secrets

This project uses Cloudflare Pages for deployment. Environment variables are configured as follows:

### Public Variables (wrangler.toml)
Non-sensitive configuration that's safe to expose in code:
```toml
[vars]
NEXT_PUBLIC_BSC_TESTNET_LOANS_ADDRESS = "0x..."
```

### Secrets (Wrangler CLI)
Sensitive data like API keys and project IDs:
```bash
npx wrangler pages secret put NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID --project-name=loans-dapp
```

**Note:** Cloudflare docs suck and say a lot of stuff that sound good but in my experience aren't true.
Wrangler CLI secrets are available during both build time and runtime, while Cloudflare dashboard secrets are runtime-only for this project configuration.
Apparently- Their docs say otherwise but my experience was different.

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Web3:** wagmi, viem, RainbowKit
- **UI Components:** Radix UI
- **Deployment:** Cloudflare Pages
