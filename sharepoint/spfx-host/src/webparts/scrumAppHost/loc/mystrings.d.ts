declare interface IScrumAppHostWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  AppBaseUrlFieldLabel: string;
  ApiBaseUrlFieldLabel: string;
  TokenStorageKeyFieldLabel: string;
  UserStorageKeyFieldLabel: string;
  UseHashRoutingFieldLabel: string;
  LoadingMessage: string;
  MissingConfigurationMessage: string;
}

declare module 'ScrumAppHostWebPartStrings' {
  const strings: IScrumAppHostWebPartStrings;
  export = strings;
}

