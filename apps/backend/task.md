# Task: [Backend] GitHub App Registration & OAuth Implementation

**Description:**
To enable users to install MergePulse and log in, we need to register a **GitHub App** (not an OAuth App) to leverage fine-grained permissions and installation events.

On the backend, we need to implement an authentication flow that exchanges the GitHub code for a token, verifies the installation, syncs the user/organization data to our PostgreSQL database (via Prisma), and issues a session JWT for the frontend.

**Technical Stack Decisions:**

* **Strategy:** `passport-github2` (wrapped in NestJS `AuthGuard`) or manual HTTP calls if using GitHub App specific flows (recommended to keep it simple with standard OAuth for login).
* **Session Management:** JWT (JSON Web Tokens).
* **Database:** Prisma `upsert` operations to handle "Login" vs "Sign Up" automatically.

**Acceptance Criteria:**

* [x] **GitHub App Registration:**
  * [x] Register a new GitHub App in the Developer Portal.
  * [x] **Permissions:**
    * `Repository > Pull Requests`: **Read-only** (To fetch PR stats).
    * `Repository > Contents`: **Read-only** (To read the `.diff` for AI).
    * `Repository > Metadata`: **Read-only** (To get repo names/owner).
  * [x] **Callback URL:** Set to `http://localhost:3001/auth/github/callback` (for dev).
  * [x] Generate a **Private Key** and **Client Secret**.

* [ ] **Backend Implementation (`apps/api`):**
  * [x] Install dependencies: `@nestjs/passport`, `passport`, `passport-github2`, `@nestjs/jwt`, `passport-jwt`.
  * [x] Create `AuthModule`, `AuthController`, and `AuthService`.
  * [ ] **Endpoint:** `GET /auth/github/login` -> Redirects user to GitHub installation/login page.
  * [ ] **Endpoint:** `GET /auth/github/callback` ->
          1. Receives `code` from GitHub.
          2. Exchanges `code` for `access_token`.
          3. Fetches User Profile (`GET /user`) and User Installations.
          4. **DB Sync:** Uses Prisma to `upsert` the `User` and `Organization` (if the installation ID is present).
          5. Returns a signed **JWT** containing `{ userId, orgId, role }`.

* [ ] **Security:**
  * [ ] Create a `JwtAuthGuard` to protect future private routes.
  * [ ] Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `JWT_SECRET`, and `GITHUB_APP_PRIVATE_KEY` to `.env`.

---

### **Implementation Note: The Data Sync Logic**

When a user logs in, we must ensure their Organization exists. The flow inside `AuthService` should look roughly like this (pseudocode):

```typescript
async validateUser(profile: GitHubProfile, accessToken: string) {
  // 1. Get the installation ID for this user (if available)
  const installations = await githubApi.getUserInstallations(accessToken);
  
  // 2. Sync Organization
  let orgId = null;
  if (installations.length > 0) {
     const orgData = installations[0].account; // Assuming single-tenant focus for MVP
     const org = await prisma.organization.upsert({
       where: { github_installation_id: String(installations[0].id) },
       create: { name: orgData.login, ... },
       update: { ... }
     });
     orgId = org.id;
  }

  // 3. Sync User
  const user = await prisma.user.upsert({
    where: { github_username: profile.username },
    create: { 
      github_username: profile.username, 
      organizationId: orgId, // specific logic if org doesn't exist yet
      role: 'ADMIN' 
    },
    update: { organizationId: orgId } // Update org if they installed it recently
  });

  return this.generateJwt(user);
}

```
