var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import * as strings from 'ScrumAppHostWebPartStrings';
var ScrumAppHostWebPart = /** @class */ (function (_super) {
    __extends(ScrumAppHostWebPart, _super);
    function ScrumAppHostWebPart() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._injectedAssetElements = [];
        _this._renderSequence = 0;
        return _this;
    }
    ScrumAppHostWebPart.prototype.render = function () {
        return __awaiter(this, void 0, void 0, function () {
            var renderId, appBaseUrl, manifest, rootElement, entrypoints, error_1, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        renderId = ++this._renderSequence;
                        this._clearInjectedAssets();
                        appBaseUrl = this._normalizeBaseUrl(this.properties.appBaseUrl);
                        if (!appBaseUrl) {
                            this.domElement.innerHTML = "<div style=\"padding:16px;\">".concat(strings.MissingConfigurationMessage, "</div>");
                            return [2 /*return*/];
                        }
                        this.domElement.innerHTML = "<div style=\"padding:16px;\">".concat(strings.LoadingMessage, "</div>");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this._loadAssetManifest(appBaseUrl)];
                    case 2:
                        manifest = _a.sent();
                        if (renderId !== this._renderSequence) {
                            return [2 /*return*/];
                        }
                        this._setRuntimeConfig(appBaseUrl);
                        this.domElement.innerHTML = '';
                        rootElement = document.createElement('div');
                        rootElement.id = 'root';
                        this.domElement.appendChild(rootElement);
                        entrypoints = (manifest.entrypoints || []).filter(Boolean);
                        return [4 /*yield*/, this._loadEntrypoints(appBaseUrl, entrypoints)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        message = error_1 instanceof Error ? error_1.message : String(error_1);
                        this.domElement.innerHTML = "<div style=\"padding:16px;color:#a4262c;\">Failed to load Scrum application: ".concat(this._escapeHtml(message), "</div>");
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ScrumAppHostWebPart.prototype.onDispose = function () {
        this._clearInjectedAssets();
        if (this.domElement) {
            this.domElement.innerHTML = '';
        }
    };
    Object.defineProperty(ScrumAppHostWebPart.prototype, "disableReactivePropertyChanges", {
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrumAppHostWebPart.prototype, "dataVersion", {
        get: function () {
            return Version.parse('1.0');
        },
        enumerable: false,
        configurable: true
    });
    ScrumAppHostWebPart.prototype.getPropertyPaneConfiguration = function () {
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
    };
    ScrumAppHostWebPart.prototype._loadAssetManifest = function (appBaseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(appBaseUrl, "/asset-manifest.json"), {
                            credentials: 'same-origin'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("asset-manifest.json returned HTTP ".concat(response.status));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    ScrumAppHostWebPart.prototype._loadEntrypoints = function (appBaseUrl, entrypoints) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, entrypoints_1, entrypoint, assetUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, entrypoints_1 = entrypoints;
                        _a.label = 1;
                    case 1:
                        if (!(_i < entrypoints_1.length)) return [3 /*break*/, 6];
                        entrypoint = entrypoints_1[_i];
                        assetUrl = this._toAbsoluteUrl(appBaseUrl, entrypoint);
                        if (!this._hasSuffix(entrypoint, '.css')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._loadStylesheet(assetUrl)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        if (!this._hasSuffix(entrypoint, '.js')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this._loadScript(assetUrl)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ScrumAppHostWebPart.prototype._loadStylesheet = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var linkElement = document.createElement('link');
                            linkElement.rel = 'stylesheet';
                            linkElement.href = url;
                            linkElement.onload = function () { return resolve(); };
                            linkElement.onerror = function () { return reject(new Error("Could not load stylesheet ".concat(url))); };
                            document.head.appendChild(linkElement);
                            _this._injectedAssetElements.push(linkElement);
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ScrumAppHostWebPart.prototype._loadScript = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var scriptElement = document.createElement('script');
                            scriptElement.src = url;
                            scriptElement.async = false;
                            scriptElement.onload = function () { return resolve(); };
                            scriptElement.onerror = function () { return reject(new Error("Could not load script ".concat(url))); };
                            document.body.appendChild(scriptElement);
                            _this._injectedAssetElements.push(scriptElement);
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ScrumAppHostWebPart.prototype._setRuntimeConfig = function (appBaseUrl) {
        window.__SCRUM_APP_CONFIG__ = {
            apiBaseUrl: this._resolveApiBaseUrl(),
            routerMode: this.properties.useHashRouting ? 'hash' : 'browser',
            routerBasename: '/',
            tokenStorageKey: this.properties.tokenStorageKey || 'scrum-app.sharepoint.token',
            userStorageKey: this.properties.userStorageKey || 'scrum-app.sharepoint.user',
            assetBasePath: appBaseUrl,
            isSharePointHost: true
        };
    };
    ScrumAppHostWebPart.prototype._resolveApiBaseUrl = function () {
        var explicitUrl = this._normalizeBaseUrl(this.properties.apiBaseUrl);
        if (explicitUrl) {
            return explicitUrl;
        }
        return "".concat(window.location.origin, "/api");
    };
    ScrumAppHostWebPart.prototype._normalizeBaseUrl = function (value) {
        if (!value) {
            return '';
        }
        return value.trim().replace(/\/+$/, '');
    };
    ScrumAppHostWebPart.prototype._toAbsoluteUrl = function (baseUrl, assetPath) {
        var normalizedAssetPath = assetPath.replace(/^\/+/, '');
        return "".concat(baseUrl, "/").concat(normalizedAssetPath);
    };
    ScrumAppHostWebPart.prototype._hasSuffix = function (value, suffix) {
        return value.slice(-suffix.length) === suffix;
    };
    ScrumAppHostWebPart.prototype._clearInjectedAssets = function () {
        for (var _i = 0, _a = this._injectedAssetElements; _i < _a.length; _i++) {
            var element = _a[_i];
            element.remove();
        }
        this._injectedAssetElements = [];
    };
    ScrumAppHostWebPart.prototype._escapeHtml = function (value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    return ScrumAppHostWebPart;
}(BaseClientSideWebPart));
export default ScrumAppHostWebPart;
//# sourceMappingURL=ScrumAppHostWebPart.js.map