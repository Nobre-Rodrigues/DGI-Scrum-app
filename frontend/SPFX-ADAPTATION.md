# SPFx Full-Page Preparation

This frontend was adapted so it can keep running standalone today and be mounted later inside a SharePoint Framework full-page experience.

## What changed

- API access no longer depends on hardcoded `http://localhost:5000` URLs.
- Routing is runtime-configurable and supports `browser` or `hash` mode.
- Auth session storage keys are configurable, which avoids collisions inside SharePoint-hosted pages.
- The React app can now be mounted into any DOM element through `src/bootstrap/mountApp.js`, which is useful for a future SPFx wrapper web part or full-page host.
- Public assets now resolve through a helper so the host can provide a custom asset base path.

## Runtime configuration

The app reads configuration from either CRA environment variables or `window.__SCRUM_APP_CONFIG__`.

Supported keys:

- `apiBaseUrl`
- `routerMode`
- `routerBasename`
- `tokenStorageKey`
- `userStorageKey`
- `assetBasePath`
- `isSharePointHost`

Example:

```html
<script>
  window.__SCRUM_APP_CONFIG__ = {
    apiBaseUrl: "https://api.contoso.com/api",
    routerMode: "hash",
    tokenStorageKey: "scrum-app.sharepoint.token",
    userStorageKey: "scrum-app.sharepoint.user",
    assetBasePath: "https://contoso.sharepoint.com/sites/intranet/SiteAssets/scrum-app",
    isSharePointHost: true
  };
</script>
```

## Why `hash` routing is recommended for SharePoint

For a SharePoint full-page app, `hash` routing is the safest default because SharePoint owns the page URL and refresh behavior. Internal routes stay after the `#` and do not require SharePoint page rewrites.

## Recommended next step for the actual SPFx layer

Use the wrapper project at [../sharepoint/spfx-host/README.md](/workspaces/dotnet-node-mssql/sharepoint/spfx-host/README.md).

That SPFx host:

1. Runs as a real SPFx web part.
2. Supports `SharePointFullPage`.
3. Loads `asset-manifest.json` from the published frontend build.
4. Injects `window.__SCRUM_APP_CONFIG__` before loading the frontend bundle.

This approach was chosen because the current frontend uses React 19, while SPFx has its own supported client runtime matrix. Hosting the built frontend as static assets keeps the integration robust and avoids forcing an immediate UI rewrite.

## Standalone local development

Use the normal React flow, optionally with SharePoint-like settings:

```bash
cp .env.sharepoint.example .env.local
npm start
```
