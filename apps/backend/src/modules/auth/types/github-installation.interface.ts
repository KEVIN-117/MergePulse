export interface GithubInstallation {
  id: number;
  account?: {
    login?: string;
  };
}

export interface GithubInstallationsResponse {
  installations: GithubInstallation[];
}
