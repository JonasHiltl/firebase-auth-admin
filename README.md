# Cloudflare Firebase Auth Admin SDK

Firebase Authentication Admin SDK for the Cloudflare Worker environment.

# Supported operations:

- [x] createUser()
- [x] getUser()
- [x] signInWithCustomToken()
- [x] signInWithIdp()
- [x] signInWithPassword()
- [x] verifyIdToken()
- [x] createCustomToken()

# Installation
Not yet published on npm.

# Usage
**Initialize Firebase Auth**
```typescript
const auth = initializeAuth(
    new ServiceAccount(
        env.FIREBASE_PROJECT_ID,
        env.FIREBASE_PRIVATE_KEY_ID,
        env.FIREBASE_PRIVATE_KEY,
        env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
    ),
);
```
**Create a User**
```typescript
const user = await auth.createUser({
    userID: "mycustomid",
    email: "jon@example.com",
    password: "devpassword",
    displayName: "Jon Doe",
});
```
**Cache Google Token & Certificates**  
Requests to the Google api to get required certificates can be cached by passing a `Cache` implementation to the `initializeAuth` function.  
This libarary already offers a Cache based on Cloudflare KV:
```typescript
const auth = initializeAuth(
    ...,
    new CloudflareKv(env.KV_NAMESPACE),
);
```
# Tests
We use `vitest` for testing but currently only few tests are written.  
Run `yarn test` to run all available tests.
