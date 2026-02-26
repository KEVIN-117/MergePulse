export interface GithubAuthUser {
  githubId: string;
  username: string;
  displayName?: string | null;
  accessToken: string;
  email?: string | null;
  avatar?: string | null;
  url?: string | null;
  htmlUrl?: string | null;
}
