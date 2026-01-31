# Lifecycle Insights (Web)

A web app for parsing exported Lifecycle app data and showing more insights.

## Recreating this project

```sh
# recreate this project
bun x sv create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:typography,forms" devtools-json sveltekit-adapter="adapter:static" mcp="ide:vscode+setup:local" --install bun lifecycle-web
```

## Developing

Once you've created a project and installed dependencies with `bun install`, start a development server:

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

To create a production version of your app:

```sh
bun run build
```

You can preview the production build with `bun run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
