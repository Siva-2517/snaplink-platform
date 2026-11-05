# 🖥️ Backend (Node.js / Express) Concepts Used in SnapLink — Interview Reference

> **Temporary Study File** — Based on analysis of the actual SnapLink backend codebase.
> All concepts below are backed by real code in `server/src/`.

---

## 📁 Project Architecture (MVC Pattern)

```
server/src/
├── app.js              ← Express App Bootstrap (Entry Point)
├── config/
│   └── db.js           ← MongoDB Connection
├── models/             ← Mongoose Data Models (M in MVC)
│   ├── User.js
│   ├── ShortURL.js
│   └── Visit.js
├── controllers/        ← Business Logic (C in MVC)
│   ├── authController.js
│   ├── urlController.js
│   ├── analyticsController.js
│   ├── bulkController.js
│   └── publicController.js
├── routes/             ← Route Definitions (V in MVC)
│   ├── authRoutes.js
│   ├── urlRoutes.js
│   ├── redirectRoutes.js
│   └── publicRoutes.js
├── middleware/         ← Custom Middleware
│   ├── auth.js         ← JWT Protection
│   ├── rateLimiter.js  ← Rate Limiting
│   └── validate.js     ← Input Validation
├── services/
│   └── emailService.js ← Nodemailer Email Service
└── utils/
    ├── cache.js        ← Redis + In-Memory Cache Manager
    ├── buffer.js       ← Analytics Write Buffer
    └── ua.js           ← User-Agent Parser
```

---

## 1️⃣ Node.js Core Concepts

### `require` / `module.exports` (CommonJS Modules)
```js
// Exporting
module.exports = { protect };
module.exports = connectDB;
module.exports = new CacheManager(); // singleton export

// Importing
const { protect } = require('../middleware/auth');
const connectDB = require('./config/db');
```

### `process.env` — Environment Variables
```js
// app.js / authController.js
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'developer-glowing-secret-key-for-local-use';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/url_shortener';
```

### `process.on` — Graceful Shutdown
```js
// app.js
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

const handleShutdown = async (signal) => {
  await analyticsBuffer.shutdown(); // flush pending analytics
  server.close(() => process.exit(0));
};
```

### `setInterval` / `clearInterval` — Background Jobs
```js
// utils/buffer.js
startInterval() {
  this.intervalId = setInterval(() => this.flush(), this.flushIntervalMs); // every 5s
}

async shutdown() {
  clearInterval(this.intervalId); // stop background job
  await this.flush();             // final flush
}
```

---

## 2️⃣ Express.js

### Application Setup (`app.js`)
```js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '2mb' }));     // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### Routing
```js
// Mount route groups
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/urls', apiLimiter, urlRoutes);
app.use('/api/public', apiLimiter, publicRoutes);
app.use('/', redirectRoutes);
```

### `express.Router()`
```js
// authRoutes.js
const express = require('express');
const router = express.Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/update-username', protect, validateUpdateUsernameInput, updateUsername);

module.exports = router;
```

### HTTP Methods Used

| Method | Route | Action |
|---|---|---|
| `GET` | `/api/auth/me` | Get logged-in user profile |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/urls` | Create short URL |
| `GET` | `/api/urls` | Get all user URLs |
| `PUT` | `/api/urls/:id` | Edit URL |
| `DELETE` | `/api/urls/:id` | Soft delete URL |
| `GET` | `/:shortCode` | Redirect visitor |

### Route Parameters & Query
```js
// req.params — URL segment
router.get('/:id/analytics', getURLAnalytics);
const urlId = req.params.id;

// req.body — POST body
const { email, password } = req.body;

// req.headers — reading Authorization header
const token = req.headers.authorization.split(' ')[1]; // "Bearer <token>"
```

---

## 3️⃣ Middleware (Custom)

### What is Middleware?
A function with signature `(req, res, next)` that sits between the request and response.

### JWT Authentication Middleware (`middleware/auth.js`)
```js
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password'); // attach user to request
      return next(); // pass to next middleware/controller
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};
```

### Input Validation Middleware (`middleware/validate.js`)
```js
const validateURLInput = (req, res, next) => {
  const { longUrl, customAlias, expiresAt } = req.body;

  if (!longUrl) return res.status(400).json({ success: false, message: 'Long URL is required.' });
  if (!/^https?:\/\//i.test(longUrl)) return res.status(400).json({ ... }); // protocol check
  if (RESERVED_WORDS.has(customAlias?.toLowerCase())) return res.status(400).json({ ... });

  next(); // validation passed — proceed
};
```

### Rate Limiter Middleware (`middleware/rateLimiter.js`)
```js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 100,                  // max 100 requests per window per IP
  message: { success: false, message: 'Too many requests...' }
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }); // stricter for login
const urlLimiter  = rateLimit({ windowMs: 60 * 1000, max: 20 });       // per minute for shortener
```

### Logging Middleware (Custom)
```js
// app.js — custom request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
```

### Middleware Chain (Multiple in sequence)
```js
// authRoutes.js — chain: authLimiter → validateVerifyOtpInput → verifyOtp
router.post('/verify-otp', authLimiter, validateVerifyOtpInput, verifyOtp);

// urlRoutes.js — chain: protect → urlLimiter → validateURLInput → shortenURL
router.post('/', urlLimiter, validateURLInput, shortenURL);
```

### `router.use()` — Apply Middleware to All Routes in a Router
```js
// urlRoutes.js — all URL routes require authentication
router.use(protect);
router.get('/', getUserURLs);       // automatically protected
router.post('/', shortenURL);       // automatically protected
```

---

## 4️⃣ MongoDB & Mongoose (ODM)

### Connecting to MongoDB (`config/db.js`)
```js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 MongoDB Connected Successfully');
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // crash fast if DB is unavailable
  }
};
```

### Schema Definition

#### User Model (`models/User.js`)
```js
const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:       { type: String, required: true, unique: true, lowercase: true, match: /regex/ },
  password:    { type: String, required: function() { return this.provider === 'local'; } },
  isVerified:  { type: Boolean, default: false },
  provider:    { type: String, enum: ['local', 'google'], default: 'local' },
  role:        { type: String, enum: ['user', 'admin'], default: 'user' },
  otp:         String,
  otpExpires:  Date,
  // ...
});
```

#### ShortURL Model (`models/ShortURL.js`)
```js
const shortUrlSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  longUrl:   { type: String, required: true },
  shortCode: { type: String, required: true, unique: true, index: true },
  clicks:    { type: Number, default: 0, index: true },
  isDeleted: { type: Boolean, default: false, index: true },  // soft delete flag
  expiresAt: { type: Date, index: true },
  // ...
});
```

#### Visit Model (`models/Visit.js`) — Compound Index
```js
const visitSchema = new mongoose.Schema({
  shortUrl:  { type: mongoose.Schema.Types.ObjectId, ref: 'ShortURL', required: true },
  timestamp: { type: Date, default: Date.now },
  browser:   String,
  device:    String,
  country:   String,
  // ...
});

// Compound Index for fast time-series queries
visitSchema.index({ shortUrl: 1, timestamp: -1 });
```

### Mongoose Pre-Save Hook
```js
// User.js — auto-hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next(); // skip if unchanged

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

### Mongoose Instance Method
```js
// User.js — custom method on user document
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Usage in controller
const isMatch = await user.comparePassword(password);
```

### CRUD Operations

```js
// CREATE
const user = await User.create({ username, email, password });
const url  = await ShortURL.create({ user: userId, longUrl, shortCode });

// READ
const user = await User.findOne({ email: email.toLowerCase() });
const url  = await ShortURL.findById(req.params.id);
const urls = await ShortURL.find({ user: req.user._id, isDeleted: false }).sort({ createdAt: -1 });

// UPDATE
url.longUrl = newLongUrl;
await url.save(); // triggers pre-save hook

// SOFT DELETE (not real delete)
url.isDeleted = true;
await url.save();

// BULK WRITE
await ShortURL.bulkWrite(bulkOps); // efficient batch updates

// BULK INSERT
await Visit.insertMany(batch); // insert many visits at once
```

### Population / Reference (ObjectId)
```js
// ShortURL references User via ObjectId
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
```

### MongoDB Query Operators
```js
// $or — find by shortCode OR customAlias
ShortURL.findOne({ $or: [{ shortCode }, { customAlias: shortCode }], isDeleted: false })

// $inc — increment clicks
$inc: { clicks: clickAggregates[urlId] }

// $set — update timestamp
$set: { lastVisitedAt: latestVisits[urlId] }
```

---

## 5️⃣ JWT Authentication (jsonwebtoken)

```js
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (id) => {
  return jwt.sign(
    { id },                    // payload
    process.env.JWT_SECRET,    // secret
    { expiresIn: '7d' }        // options
  );
};

// Verify Token (in middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id).select('-password');
```

**Flow:** `signup` → `verifyOtp` → `generateToken` → frontend stores token → every protected request sends `Authorization: Bearer <token>` → `protect` middleware validates.

---

## 6️⃣ Password Hashing (bcryptjs)

```js
const bcrypt = require('bcryptjs');

// Hash password (in pre-save hook)
const salt = await bcrypt.genSalt(10);      // 10 rounds (cost factor)
this.password = await bcrypt.hash(this.password, salt);

// Verify password (login)
const isMatch = await bcrypt.compare(candidatePassword, this.password);
```

---

## 7️⃣ OTP & Crypto (Node crypto module)

```js
const crypto = require('crypto');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Hash OTP using SHA-256 before database storage
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// Compare during verification
const hashedIncoming = hashOTP(otp);
if (user.otp !== hashedIncoming) {
  return res.status(400).json({ success: false, message: 'Invalid verification code.' });
}
```

---

## 8️⃣ OOP — Class Pattern (Singleton)

### `AnalyticsBuffer` class (`utils/buffer.js`)
```js
class AnalyticsBuffer {
  constructor() {
    this.queue = [];
    this.flushIntervalMs = 5000;
    this.startInterval(); // start background job on instantiation
  }

  push(visitData) { ... }     // add to queue
  async flush() { ... }       // bulk write to DB
  async shutdown() { ... }    // graceful shutdown
}

// Singleton — one instance shared across the app
module.exports = new AnalyticsBuffer();
```

### `CacheManager` class (`utils/cache.js`)
```js
class CacheManager {
  constructor() {
    this.redisClient = null;
    this.isRedisConnected = false;
    this.localCache = new Map();      // fallback in-memory cache
    this.initRedis();
  }

  async get(key) { ... }             // Redis → fallback to Map
  async set(key, value, ttl) { ... } // Redis → fallback to Map
  async del(key) { ... }             // Redis → fallback to Map
}

module.exports = new CacheManager(); // Singleton
```

---

## 9️⃣ Caching Strategy (Redis + In-Memory Fallback)

### Two-Tier Cache
```js
// cache.js — tries Redis first, falls back to JS Map
async get(key) {
  if (this.isRedisConnected && this.redisClient) {
    const val = await this.redisClient.get(key);
    return val ? JSON.parse(val) : null; // Redis hit
  }

  // In-Memory fallback
  if (this.localCache.has(key)) {
    const expiry = this.localCacheTTLs.get(key);
    if (expiry && expiry < Date.now()) {
      this.localCache.delete(key); // TTL expired
      return null;
    }
    return this.localCache.get(key); // Map hit
  }
  return null;
}
```

### Cache-Aside Pattern in Redirect Route
```js
// redirectRoutes.js
let urlData = null;

// 1. Check cache first (fast O(1))
const cached = await cacheManager.get(`url:${shortCode}`);
if (cached) {
  urlData = cached;
} else {
  // 2. Cache miss → hit MongoDB
  const url = await ShortURL.findOne({ shortCode, isDeleted: false });
  if (url) {
    urlData = { id: url._id, longUrl: url.longUrl, ... };
    await cacheManager.set(`url:${shortCode}`, urlData, 3600); // prime cache for 1 hour
  }
}
```

---

## 🔟 Async / Await & Error Handling

### Async Controller Pattern
```js
const login = async (req, res) => {
  try {
    const user = await User.findOne({ email });
    const isMatch = await user.comparePassword(password);
    const token = generateToken(user._id);
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};
```

### Fire-and-Forget Async Pattern
```js
// Send email without blocking the response
emailService.sendVerificationOTP(user.email, rawOtp)
  .catch(err => console.error('Failed to send OTP email:', err));

// Redirect is instant, analytics logged after
res.redirect(urlData.longUrl);         // ← immediate response to visitor
analyticsBuffer.push(visitRecord);     // ← background, non-blocking
```

---

## 1️⃣1️⃣ CORS Configuration

```js
// app.js — custom + library CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(204); // Preflight
  next();
});
```

---

## 1️⃣2️⃣ Google OAuth (google-auth-library)

```js
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google ID token sent from frontend
const ticket = await googleClient.verifyIdToken({
  idToken: token,
  audience: process.env.GOOGLE_CLIENT_ID
});
const { email, name, sub } = ticket.getPayload(); // extract user info
```

---

## 1️⃣3️⃣ Environment Variables (dotenv)

```js
// app.js — load .env on startup
require('dotenv').config();

// server/.env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/url_shortener
JWT_SECRET=developer-glowing-secret-key-for-local-use
REDIS_URL=redis://127.0.0.1:6379
GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 1️⃣4️⃣ HTTP Status Codes Used

| Code | Meaning | Where Used |
|---|---|---|
| `200` | OK | GET requests success |
| `201` | Created | New user/URL created |
| `204` | No Content | CORS Preflight OPTIONS |
| `302` | Found (Redirect) | Short URL redirect |
| `400` | Bad Request | Validation errors |
| `401` | Unauthorized | No/invalid JWT token |
| `403` | Forbidden | Unverified email, wrong provider |
| `404` | Not Found | URL/user not found |
| `410` | Gone | Expired link |
| `429` | Too Many Requests | Rate limit hit |
| `500` | Server Error | Unexpected backend crash |

---

## 1️⃣5️⃣ Security Best Practices Implemented

| Security | Implementation | File |
|---|---|---|
| **Password Hashing** | bcryptjs with 10 salt rounds | `User.js` pre-save hook |
| **JWT Tokens** | Signed, 7-day expiry, Bearer scheme | `authController.js`, `auth.js` |
| **OTP Hashing** | SHA-256 hashed before DB storage | `authController.js` |
| **Rate Limiting** | 3 different limiters (API, Auth, URL) | `rateLimiter.js` |
| **URL Protocol Guard** | Blocks `javascript:`, relative URLs | `validate.js` |
| **Reserved Keywords** | Blocks `api`, `dashboard`, `admin` as aliases | `validate.js` |
| **User Enumeration Prevention** | Generic "if email exists" message on forgot-password | `authController.js` |
| **Soft Deletion** | `isDeleted` flag — analytics preserved | `ShortURL.js`, `urlController.js` |
| **CORS Whitelist** | Only allows configured `CLIENT_URL` origin | `app.js` |
| **select('-password')** | Never returns password hash in responses | `auth.js` middleware |

---

## 1️⃣6️⃣ Performance Optimizations

| Optimization | How | File |
|---|---|---|
| **Async Redirect Logging** | `res.redirect()` first, then `analyticsBuffer.push()` | `redirectRoutes.js` |
| **Write Buffer** | `Visit.insertMany()` in batches every 5s | `utils/buffer.js` |
| **Bulk Write** | `ShortURL.bulkWrite()` aggregated click updates | `utils/buffer.js` |
| **Redis Cache** | Hot URL data cached for 1 hour | `utils/cache.js` |
| **In-Memory Fallback** | JS `Map` if Redis is unavailable | `utils/cache.js` |
| **DB Indexes** | On `shortCode`, `user`, `clicks`, `isDeleted`, compound `shortUrl+timestamp` | All models |
| **Cache Priming** | Cache filled immediately on URL creation | `urlController.js` |

---

## ✅ Complete Concepts Checklist

| Concept | ✅ Used | Where |
|---|---|---|
| Node.js (`require`/`module.exports`) | ✅ | All files |
| `process.env` | ✅ | app.js, all controllers |
| `process.on` (Graceful Shutdown) | ✅ | app.js |
| `setInterval` / `clearInterval` | ✅ | utils/buffer.js |
| Express.js Setup | ✅ | app.js |
| `express.Router()` | ✅ | All route files |
| Middleware (`req`, `res`, `next`) | ✅ | auth.js, validate.js, rateLimiter.js |
| Middleware Chaining | ✅ | authRoutes.js, urlRoutes.js |
| `router.use()` — Group Middleware | ✅ | urlRoutes.js |
| REST API Methods (GET/POST/PUT/DELETE) | ✅ | All routes |
| `req.body`, `req.params`, `req.headers` | ✅ | All controllers |
| HTTP Status Codes | ✅ | All controllers |
| MongoDB + Mongoose | ✅ | models/, config/db.js |
| Mongoose Schema & Model | ✅ | User.js, ShortURL.js, Visit.js |
| Schema Validation (built-in) | ✅ | All models |
| Pre-Save Hook | ✅ | User.js |
| Instance Methods | ✅ | User.js (`comparePassword`) |
| Mongoose CRUD | ✅ | All controllers |
| `bulkWrite` / `insertMany` | ✅ | utils/buffer.js |
| MongoDB Operators (`$or`, `$inc`, `$set`) | ✅ | redirectRoutes.js, buffer.js |
| MongoDB Indexes | ✅ | All models |
| Soft Delete Pattern | ✅ | ShortURL.js, urlController.js |
| JWT (Sign & Verify) | ✅ | authController.js, auth.js |
| bcryptjs (Hash & Compare) | ✅ | User.js pre-save, authController.js |
| OTP + crypto (SHA-256) | ✅ | authController.js |
| Google OAuth | ✅ | authController.js |
| dotenv | ✅ | app.js |
| CORS | ✅ | app.js |
| Rate Limiting | ✅ | middleware/rateLimiter.js |
| Input Validation Middleware | ✅ | middleware/validate.js |
| OOP / Class Pattern | ✅ | CacheManager, AnalyticsBuffer |
| Singleton Pattern | ✅ | cache.js, buffer.js |
| Redis (Cache) | ✅ | utils/cache.js |
| In-Memory Fallback (Map) | ✅ | utils/cache.js |
| Cache-Aside Pattern | ✅ | redirectRoutes.js, urlController.js |
| Async/Await | ✅ | All controllers |
| try/catch Error Handling | ✅ | All controllers |
| Fire-and-Forget Async | ✅ | Email sending, analytics logging |
| Background Interval Job | ✅ | utils/buffer.js |
| `async/await` with `Promise.catch()` | ✅ | Email fire-and-forget |
| Regex for Input Validation | ✅ | validate.js, authController.js |
| `new URL()` (Node URL API) | ✅ | validate.js, urlController.js |
| QR Code Generation | ✅ | urlController.js (qrcode library) |
| User-Agent Parsing | ✅ | utils/ua.js |
| 404 / Error Handler | ✅ | app.js |

---

> 💡 **Interview Tip**: In interviews, always link backend concepts back to **why** you used them:
> - JWT → "stateless auth, no server-side sessions"
> - bcrypt → "one-way hash, can't be reversed even if DB is leaked"
> - Buffer + bulkWrite → "reduces DB write locks under high traffic"
> - Redis + fallback → "resilient caching — works even without Redis in dev"
