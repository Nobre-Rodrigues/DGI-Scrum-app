# SPFx Host Wrapper

This project is a real SharePoint Framework host for the Scrum frontend.

## Why this wrapper exists

The frontend currently uses React 19 and its own toolchain, while SharePoint Framework has its own supported runtime matrix. To avoid a brittle direct import into SPFx, this wrapper loads the published frontend build as static assets from SharePoint or another trusted host.

That gives you:

- a genuine SPFx deployment model
- support for `SharePointFullPage`
- runtime configuration passed into the app through `window.__SCRUM_APP_CONFIG__`
- a clean path to publish the frontend build into `Site Assets` or a CDN

## How it works

1. Build the frontend in `frontend/`.
2. Publish the contents of `frontend/build/` to a SharePoint document library or CDN.
3. Set the SPFx web part `appBaseUrl` property to that folder URL.
4. The SPFx web part fetches `asset-manifest.json`, loads the listed CSS/JS files, sets runtime config, and lets the frontend bootstrap itself.

## Recommended frontend publish target

For an intranet scenario, publish the frontend build to a SharePoint library such as:

`https://tenant.sharepoint.com/sites/intranet/SiteAssets/scrum-app`

In that folder, `asset-manifest.json` must be directly available.

## Local setup

```bash
cd sharepoint/spfx-host
npm install
npm run serve
```

## Packaging

```bash
cd sharepoint/spfx-host
npm install
npm run package-solution
```

The generated package is written to:

`sharepoint/spfx-host/sharepoint/solution/scrum-app-spfx-host.sppkg`

## Full-page app support

The manifest includes `SharePointFullPage` in `supportedHosts`, so once the package is installed in the app catalog the web part can be used in a Single Part App Page.

Reference:

- https://learn.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/single-part-app-pages

