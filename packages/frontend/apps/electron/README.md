# AFFiNE Electron App

## Development

To run AFFiNE Desktop Client Application locally, run the following commands:

```sh
# in repo root
yarn install
yarn workspace @affine/native build
yarn dev

# in packages/frontend/apps/electron
yarn generate-assets
yarn dev # or yarn prod for production build
```

## Troubleshooting

If you have trouble building electron during `yarn install`, try setting mirror environment variable:

```sh
export ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
```

## Credits

Most of the boilerplate code is generously borrowed from the following

- [vite-electron-builder](https://github.com/cawa-93/vite-electron-builder)
- [Turborepo basic example](https://github.com/vercel/turborepo/tree/main/examples/basic)
- [yerba](https://github.com/t3dotgg/yerba)
