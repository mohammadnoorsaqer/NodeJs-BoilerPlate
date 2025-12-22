# 🔐 Authentication & Authorization Guide

This guide explains how authentication and authorization work in this application. Think of it like a security guard checking IDs at different doors!

---

## 📚 Table of Contents

1. [What is Authentication?](#what-is-authentication)
2. [Authentication Flow](#authentication-flow)
3. [How to Use Auth Middleware](#how-to-use-auth-middleware)
4. [Role-Based Access Control](#role-based-access-control)
5. [Public Routes with authPublic](#public-routes-with-authpublic)
6. [Token Management](#token-management)

---

## 🎯 What is Authentication?

**Authentication** = "Who are you?"  
**Authorization** = "What can you do?"

Think of it like this:
- **Authentication** is like showing your ID card to prove who you are
- **Authorization** is like checking if your ID card says you're allowed to enter a VIP area

---

## 🔄 Authentication Flow

### Step 1: Register (Create Account)

When someone wants to use your app, they first need to create an account.

```javascript
POST /v1/auth/register
Body: {
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "john_doe",
  "role": "user"
}
```

**What happens:**
1. User sends their information
2. Password gets encrypted (like putting it in a safe)
3. User account is created in database
4. User gets **two special keys** (tokens):
   - **Access Token** (short-lived, like a day pass)
   - **Refresh Token** (long-lived, like a monthly pass)

**Response:**
```json
{
  "access": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires": 1234567890
  },
  "refresh": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires": 1234567890
  }
}
```

---

### Step 2: Login (Get Your Keys)

If a user already has an account, they can login to get new keys.

```javascript
POST /v1/auth/login
Body: {
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**What happens:**
1. System checks if email and password match
2. System checks if user is active (not deleted or blocked)
3. System gives user new access and refresh tokens
4. Updates "last login" time

---

### Step 3: Using Protected Routes (Show Your ID)

When a user wants to access protected routes, they need to show their access token.

```javascript
GET /v1/users/profile
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What happens:**
1. User sends request with access token in header
2. System checks if token is valid
3. System checks if token matches user's current `token_version` (prevents old tokens from working)
4. System checks if user is active
5. If everything is OK, user gets access!

---

### Step 4: Refresh Token (Get New Keys When Old Ones Expire)

Access tokens expire quickly (like 30 minutes). When they expire, use refresh token to get new ones.

```javascript
POST /v1/auth/refresh-token
Body: {
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What happens:**
1. System checks if refresh token is valid
2. System checks if token version matches (prevents revoked tokens)
3. System gives user NEW access and refresh tokens

---

### Step 5: Logout (Return Your Keys)

When user wants to log out, they return their keys and all keys become invalid.

```javascript
POST /v1/auth/logout
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What happens:**
1. System increments user's `token_version` (like changing the lock on a door)
2. All old tokens become invalid (even if they haven't expired yet!)
3. Current access token gets blacklisted in Redis
4. User is logged out

**Important:** User must have a valid access token to logout. If token is expired, user is already effectively logged out.

---

## 🛡️ How to Use Auth Middleware

### Basic Authentication (Must Be Logged In)

Use `auth()` when you want to protect a route - user MUST be logged in.

```javascript
const auth = require('../middlewares/auth');
const router = require('express').Router();

// This route requires user to be logged in
router.get('/profile', auth(), userController.getProfile);

// This route also requires login, but no specific role needed
router.post('/posts', auth(), postController.createPost);
```

**What happens:**
- ✅ If user has valid token → Request continues
- ❌ If user has no token → Error: "Please authenticate"
- ❌ If token is expired → Error: "Please authenticate"
- ❌ If token was revoked (logout) → Error: "Please authenticate"

---

### Role-Based Authentication (Must Be Logged In + Specific Role)

Use `auth('role1', 'role2')` when you want to check both login AND role.

```javascript
// Only admins can access this
router.delete('/users/:id', auth('admin'), userController.deleteUser);

// Only admins OR superadmins can access this
router.get('/admin/dashboard', auth('admin', 'superadmin'), adminController.getDashboard);

// Only superadmins can access this
router.post('/system/settings', auth('superadmin'), systemController.updateSettings);
```

**Available Roles:**
- `'user'` - Regular user
- `'admin'` - Administrator
- `'superadmin'` - Super Administrator

**What happens:**
- ✅ If user has valid token AND correct role → Request continues
- ❌ If user has valid token BUT wrong role → Error: "Insufficient permissions"
- ❌ If user has no token → Error: "Please authenticate"

**Example:**
```javascript
// User with role 'user' tries to access admin route
GET /admin/dashboard
Headers: { "Authorization": "Bearer <user_token>" }
// Result: ❌ Error: "Insufficient permissions"

// Admin with role 'admin' tries to access admin route
GET /admin/dashboard
Headers: { "Authorization": "Bearer <admin_token>" }
// Result: ✅ Success!
```

---

## 👥 Role-Based Access Control (Fine-Grained Permissions)

Use `grantAccess()` when you need more detailed permissions (like "can read own posts but not others").

```javascript
const { grantAccess } = require('../middlewares/validateAccessControl');

// User can only read their own profile
router.get('/users/:userId', 
  auth(), 
  grantAccess('readAny', 'User'), 
  userController.getUser
);

// User can only update their own posts
router.put('/posts/:id', 
  auth(), 
  grantAccess('updateAny', 'Post'), 
  postController.updatePost
);
```

**How it works:**
- `grantAccess('readAny', 'User')` means "can read any user"
- But if `req.params.userId` matches `req.user.id`, it automatically changes to `readOwn`
- So users can read their own profile, but not others (unless they're admin)

**Available Actions:**
- `createAny` / `createOwn` - Create resources
- `readAny` / `readOwn` - Read resources
- `updateAny` / `updateOwn` - Update resources
- `deleteAny` / `deleteOwn` - Delete resources

**Example:**
```javascript
// Regular user tries to read their own profile
GET /users/123
Headers: { "Authorization": "Bearer <token_for_user_123>" }
// Result: ✅ Success! (readOwn permission)

// Regular user tries to read someone else's profile
GET /users/456
Headers: { "Authorization": "Bearer <token_for_user_123>" }
// Result: ❌ Error: "You are not authorized" (can't readAny)

// Admin tries to read any profile
GET /users/456
Headers: { "Authorization": "Bearer <admin_token>" }
// Result: ✅ Success! (admin has readAny permission)
```

---

## 🌍 Public Routes with authPublic

Use `authPublic` when a route is public BUT you want to know if user is logged in (optional authentication).

```javascript
const authPublic = require('../middlewares/authPublic');

// This route is public, but if user is logged in, we can show personalized content
router.get('/posts', authPublic, postController.getPosts);

// This route is public, but logged-in users see different content
router.get('/homepage', authPublic, homeController.getHomepage);
```

**What happens:**
- ✅ If user has valid token → `req.user` is set, request continues
- ✅ If user has no token → `req.user` is undefined, request continues
- ✅ If token is invalid → `req.user` is undefined, request continues

**Key Difference:**
- `auth()` → **MUST** be logged in (throws error if not)
- `authPublic` → **OPTIONAL** login (never throws error, just sets `req.user` if token exists)

**Example Usage:**
```javascript
// In your controller
async function getPosts(req, res) {
  const posts = await Post.findAll();
  
  // If user is logged in, show personalized posts
  if (req.user) {
    // User is logged in - show their favorite posts first
    const personalizedPosts = await personalizePosts(posts, req.user.id);
    return res.json(personalizedPosts);
  }
  
  // User is not logged in - show public posts
  return res.json(posts);
}
```

**When to use authPublic:**
- ✅ Public blog posts (but logged-in users see "liked" status)
- ✅ Public product listings (but logged-in users see "in cart" status)
- ✅ Public search (but logged-in users see personalized results)
- ✅ Public homepage (but logged-in users see "Welcome back, John!")

---

## 🔑 Token Management

### Token Versioning (Token Revocation)

Every user has a `token_version` number in the database. When you logout:
1. `token_version` gets incremented (0 → 1 → 2 → 3...)
2. All tokens with old `token_version` become invalid
3. This means even if someone stole your token, they can't use it after you logout!

**How it works:**
```javascript
// User logs in - gets token with tokenVersion: 0
POST /v1/auth/login
// Token payload: { userId: 123, tokenVersion: 0, ... }

// User logs out - token_version increments to 1
POST /v1/auth/logout
// Database: user.token_version = 1

// Someone tries to use old token
GET /v1/users/profile
Headers: { "Authorization": "Bearer <old_token_with_version_0>" }
// Result: ❌ Error! Token version doesn't match (0 ≠ 1)
```

### Token Types

**Access Token:**
- Short-lived (default: 30 minutes)
- Used for API requests
- Sent in `Authorization: Bearer <token>` header
- Expires quickly for security

**Refresh Token:**
- Long-lived (default: 1 day)
- Used to get new access tokens
- Sent in request body
- Expires slowly so user doesn't need to login often

---

## 📝 Complete Examples

### Example 1: Public Blog Post with Optional Login

```javascript
// Route
router.get('/blog/:id', authPublic, blogController.getPost);

// Controller
async function getPost(req, res) {
  const post = await Post.findByPk(req.params.id);
  
  // If logged in, check if user liked this post
  if (req.user) {
    const liked = await Like.findOne({
      where: { userId: req.user.id, postId: post.id }
    });
    post.dataValues.liked = !!liked;
  }
  
  return res.json(post);
}
```

### Example 2: Admin-Only Route

```javascript
// Route
router.delete('/users/:id', auth('admin', 'superadmin'), userController.deleteUser);

// Controller
async function deleteUser(req, res) {
  // We know user is admin because auth() middleware checked
  await User.destroy({ where: { id: req.params.id } });
  return res.json({ message: 'User deleted' });
}
```

### Example 3: User Can Only Update Own Profile

```javascript
// Route
router.put('/users/:userId', 
  auth(), 
  grantAccess('updateAny', 'User'), 
  userController.updateUser
);

// Controller
async function updateUser(req, res) {
  // grantAccess already checked permissions
  // If userId in URL matches req.user.id, user can update
  // If userId doesn't match, only admins can update
  const user = await User.update(
    req.body,
    { where: { id: req.params.userId } }
  );
  return res.json(user);
}
```

### Example 4: Public Search with Personalized Results

```javascript
// Route
router.get('/search', authPublic, searchController.search);

// Controller
async function search(req, res) {
  const query = req.query.q;
  const results = await Search.find(query);
  
  if (req.user) {
    // Logged-in user: personalize results based on their history
    const personalized = await personalizeResults(results, req.user.id);
    return res.json(personalized);
  }
  
  // Not logged in: return basic results
  return res.json(results);
}
```

---

## 🎓 Quick Reference

| Middleware | When to Use | Requires Login? | Throws Error if No Token? |
|------------|-------------|-----------------|---------------------------|
| `auth()` | Protected routes | ✅ Yes | ✅ Yes |
| `auth('admin')` | Admin-only routes | ✅ Yes | ✅ Yes |
| `authPublic` | Public routes with optional login | ❌ No | ❌ No |
| `grantAccess()` | Fine-grained permissions | ✅ Yes | ✅ Yes |

---

## 🚨 Common Mistakes

### ❌ Wrong: Using auth() for public routes
```javascript
// DON'T DO THIS - users can't access without login
router.get('/public/posts', auth(), postController.getPosts);
```

### ✅ Correct: Using authPublic for public routes
```javascript
// DO THIS - anyone can access, but logged-in users get extra features
router.get('/public/posts', authPublic, postController.getPosts);
```

### ❌ Wrong: Not checking req.user exists
```javascript
// DON'T DO THIS - might crash if user not logged in
async function getProfile(req, res) {
  const profile = await Profile.findOne({ where: { userId: req.user.id } });
  // ❌ Error if req.user is undefined!
}
```

### ✅ Correct: Checking req.user exists
```javascript
// DO THIS - safe check
async function getProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please login' });
  }
  const profile = await Profile.findOne({ where: { userId: req.user.id } });
}
```

---

## 🔍 Debugging Tips

### Check if user is authenticated:
```javascript
console.log('User:', req.user); // undefined = not logged in
console.log('User ID:', req.user?.id); // Safe access
```

### Check user role:
```javascript
console.log('Role:', req.user?.role); // 'user', 'admin', or 'superadmin'
```

### Check token in request:
```javascript
const token = req.headers.authorization?.split(' ')[1];
console.log('Token:', token);
```

---

## 📚 Summary

1. **Register/Login** → Get access token and refresh token
2. **Use `auth()`** → Protect routes (must be logged in)
3. **Use `auth('role')`** → Protect routes with role check
4. **Use `authPublic`** → Public routes with optional login
5. **Use `grantAccess()`** → Fine-grained permissions
6. **Logout** → Invalidates all tokens via `token_version`

Remember: **Authentication** = "Who are you?", **Authorization** = "What can you do?"

---

Happy coding! 🚀

