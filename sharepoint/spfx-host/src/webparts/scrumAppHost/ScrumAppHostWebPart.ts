import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration
} from '@microsoft/sp-webpart-base';
import {
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';

import * as strings from 'ScrumAppHostWebPartStrings';

declare global {
  interface Window {
    __SCRUM_APP_CONFIG__?: {
      apiBaseUrl: string;
      routerMode: 'browser' | 'hash';
      routerBasename: string;
      tokenStorageKey: string;
      userStorageKey: string;
      assetBasePath: string;
      isSharePointHost: boolean;
    };
  }
}

export interface IScrumAppHostWebPartProps {
  appBaseUrl: string;
  apiBaseUrl: string;
  tokenStorageKey: string;
  userStorageKey: string;
  useHashRouting: boolean;
}

interface IFrontendAssetManifest {
  entrypoints?: string[];
}

export default class ScrumAppHostWebPart extends BaseClientSideWebPart<IScrumAppHostWebPartProps> {
  private _injectedAssetElements: HTMLElement[] = [];
  private _renderSequence: number = 0;

  public async render(): Promise<void> {
    const renderId = ++this._renderSequence;
    this._clearInjectedAssets();

    const appBaseUrl = this._normalizeBaseUrl(this.properties.appBaseUrl);

    if (!appBaseUrl) {
      this.domElement.innerHTML = `<div style="padding:16px;">${strings.MissingConfigurationMessage}</div>`;
      return;
    }

    this.domElement.innerHTML = `<div style="padding:16px;">${strings.LoadingMessage}</div>`;

    try {
      const manifest = await this._loadAssetManifest(appBaseUrl);

      if (renderId !== this._renderSequence) {
        return;
      }

      this._setRuntimeConfig(appBaseUrl);

      this.domElement.innerHTML = '';
      const rootElement = document.createElement('div');
      rootElement.id = 'root';
      this.domElement.appendChild(rootElement);

      const entrypoints = (manifest.entrypoints || []).filter(Boolean);
      await this._loadEntrypoints(appBaseUrl, entrypoints);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.domElement.innerHTML = `<div style="padding:16px;color:#a4262c;">Failed to load Scrum application: ${this._escapeHtml(message)}</div>`;
    }
  }

  protected onDispose(): void {
    this._clearInjectedAssets();
    if (this.domElement) {
      this.domElement.innerHTML = '';
    }
  }

  protected get disableReactivePropertyChanges(): boolean {
    return true;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('appBaseUrl', {
                  label: strings.AppBaseUrlFieldLabel
                }),
                PropertyPaneTextField('apiBaseUrl', {
                  label: strings.ApiBaseUrlFieldLabel
                }),
                PropertyPaneTextField('tokenStorageKey', {
                  label: strings.TokenStorageKeyFieldLabel
                }),
                PropertyPaneTextField('userStorageKey', {
                  label: strings.UserStorageKeyFieldLabel
                }),
                PropertyPaneToggle('useHashRouting', {
                  label: strings.UseHashRoutingFieldLabel,
                  onText: 'Hash',
                  offText: 'Browser'
                })
              ]
            }
          ]
        }
      ]
    };
  }

  private async _loadAssetManifest(appBaseUrl: string): Promise<IFrontendAssetManifest> {
    const response = await fetch(`${appBaseUrl}/asset-manifest.json`, {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`asset-manifest.json returned HTTP ${response.status}`);
    }

    return response.json() as Promise<IFrontendAssetManifest>;
  }

  private async _loadEntrypoints(appBaseUrl: string, entrypoints: string[]): Promise<void> {
    for (const entrypoint of entrypoints) {
      const assetUrl = this._toAbsoluteUrl(appBaseUrl, entrypoint);

      if (this._hasSuffix(entrypoint, '.css')) {
        await this._loadStylesheet(assetUrl);
      } else if (this._hasSuffix(entrypoint, '.js')) {
        await this._loadScript(assetUrl);
      }
    }
  }

  private async _loadStylesheet(url: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = url;
      linkElement.onload = () => resolve();
      linkElement.onerror = () => reject(new Error(`Could not load stylesheet ${url}`));
      document.head.appendChild(linkElement);
      this._injectedAssetElements.push(linkElement);
    });
  }

  private async _loadScript(url: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.src = url;
      scriptElement.async = false;
      scriptElement.onload = () => resolve();
      scriptElement.onerror = () => reject(new Error(`Could not load script ${url}`));
      document.body.appendChild(scriptElement);
      this._injectedAssetElements.push(scriptElement);
    });
  }

  private _setRuntimeConfig(appBaseUrl: string): void {
    window.__SCRUM_APP_CONFIG__ = {
      apiBaseUrl: this._resolveApiBaseUrl(),
      routerMode: this.properties.useHashRouting ? 'hash' : 'browser',
      routerBasename: '/',
      tokenStorageKey: this.properties.tokenStorageKey || 'scrum-app.sharepoint.token',
      userStorageKey: this.properties.userStorageKey || 'scrum-app.sharepoint.user',
      assetBasePath: appBaseUrl,
      isSharePointHost: true
    };
  }

  private _resolveApiBaseUrl(): string {
    const explicitUrl = this._normalizeBaseUrl(this.properties.apiBaseUrl);

    if (explicitUrl) {
      return explicitUrl;
    }

    return `${window.location.origin}/api`;
  }

  private _normalizeBaseUrl(value: string | undefined): string {
    if (!value) {
      return '';
    }

    return value.trim().replace(/\/+$/, '');
  }

  private _toAbsoluteUrl(baseUrl: string, assetPath: string): string {
    const normalizedAssetPath = assetPath.replace(/^\/+/, '');
    return `${baseUrl}/${normalizedAssetPath}`;
  }

  private _hasSuffix(value: string, suffix: string): boolean {
    return value.slice(-suffix.length) === suffix;
  }

  private _clearInjectedAssets(): void {
    for (const element of this._injectedAssetElements) {
      element.remove();
    }

    this._injectedAssetElements = [];
  }

  private _escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
