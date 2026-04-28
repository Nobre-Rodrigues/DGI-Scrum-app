import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
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
export default class ScrumAppHostWebPart extends BaseClientSideWebPart<IScrumAppHostWebPartProps> {
    private _injectedAssetElements;
    private _renderSequence;
    render(): Promise<void>;
    protected onDispose(): void;
    protected get disableReactivePropertyChanges(): boolean;
    protected get dataVersion(): Version;
    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration;
    private _loadAssetManifest;
    private _loadEntrypoints;
    private _loadStylesheet;
    private _loadScript;
    private _setRuntimeConfig;
    private _resolveApiBaseUrl;
    private _normalizeBaseUrl;
    private _toAbsoluteUrl;
    private _hasSuffix;
    private _clearInjectedAssets;
    private _escapeHtml;
}
//# sourceMappingURL=ScrumAppHostWebPart.d.ts.map