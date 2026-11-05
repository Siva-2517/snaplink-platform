# ⚛️ React Concepts Used in SnapLink — Interview Reference

> **Temporary Study File** — Based on analysis of the actual SnapLink project codebase.
> All concepts below are backed by real code in this project.

---

## 🪝 1. Hooks

### `useState` — Used in Every File
The most heavily used hook across all pages and contexts.

| File | State Variables |
|---|---|
| `App.jsx` | `publicStatsCode`, `currentView`, `urls`, `urlsLoading`, `sidebarCollapsed`, `profileDropdownOpen`, `searchQuery`, `activeSection` |
| `AuthContext.jsx` | `user`, `token`, `loading` |
| `ThemeContext.jsx` | `theme` |
| `Dashboard.jsx` | `longUrl`, `customAlias`, `toasts`, `editingUrl`, `bulkResults`, etc. (14+ states) |
| `LoginPage.jsx` | `email`, `password`, `errorMessage`, `submitting`, `showVerifyLink` |
| `SignupPage.jsx` | `username`, `email`, `password`, `errorMessage`, `submitting` |

```jsx
// Example from AuthContext.jsx
const [user, setUser] = useState(null);
const [token, setToken] = useState(null);
const [loading, setLoading] = useState(true);
```

---

### `useEffect` — 9+ Instances

| File | What it does |
|---|---|
| `App.jsx` | Fetch URLs on auth, hash routing, dropdown outside-click, scrollspy |
| `AuthContext.jsx` | Restore session from `localStorage` on app mount |
| `ThemeContext.jsx` | Apply dark/light class to DOM; listen to OS theme changes |
| `LoginPage.jsx` | Auto-focus email input; redirect if already logged in |
| `SignupPage.jsx` | Auto-focus username input; redirect if authenticated |
| `VerifyOtpPage.jsx` | OTP resend countdown timer |

```jsx
// Example from App.jsx — cleanup pattern
useEffect(() => {
  const handleOutsideClick = (e) => {
    if (profileDropdownOpen && !e.target.closest('.profile-dropdown-container')) {
      setProfileDropdownOpen(false);
    }
  };
  document.addEventListener('click', handleOutsideClick);
  return () => document.removeEventListener('click', handleOutsideClick); // cleanup
}, [profileDropdownOpen]);
```

---

### `useCallback` — Performance Optimization

Used in **2 places** to memoize functions:

```jsx
// App.jsx — fetchUrls won't re-create on every render
const fetchUrls = useCallback(async () => {
  if (!token) return;
  const response = await fetch(`${API_BASE}/urls`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (data.success) setUrls(data.urls);
}, [token]); // only recreates when token changes

// Dashboard.jsx — stable toast handler
const addToast = useCallback((message, type = 'info') => {
  const id = Date.now();
  setToasts(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, 4000);
}, []); // no dependencies = created once
```

---

### `useRef` — DOM Access Without Re-render

```jsx
// LoginPage.jsx — auto-focus input on mount
const emailRef = useRef(null);
useEffect(() => {
  if (emailRef.current) {
    emailRef.current.focus(); // directly access the DOM element
  }
}, []);

// JSX
<input ref={emailRef} type="email" ... />
```

Used in: `LoginPage.jsx` (emailRef), `SignupPage.jsx` (usernameRef), `VerifyOtpPage.jsx` (otpRef)

---

### `useContext` — Global State Consumption

Used via **custom hook wrappers** (best practice):

```jsx
// Consuming AuthContext
const { isAuthenticated, loading, token, logout, user } = useAuth();

// Consuming ThemeContext
const { theme, toggleTheme } = useTheme();
```

---

## 🧩 2. Context API (Full Pattern)

Complete `createContext → Provider → useContext` pattern implemented twice:

### AuthContext — `client/src/context/AuthContext.jsx`
```jsx
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // ...login, signup, logout, verifyOtp, loginWithGoogle...

  return (
    <AuthContext.Provider value={{ user, token, login, logout, ... }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook (prevents wrong usage)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
```

### ThemeContext — `client/src/context/ThemeContext.jsx`
```jsx
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  // ...apply dark/light class to DOM via useEffect...

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Provider Nesting in `App.jsx`
```jsx
function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />   {/* Can access both useAuth() and useTheme() */}
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}
```

---

## 🔀 3. React Router v6

### Full Usage in `App.jsx`

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// All 7 routes defined
<Routes>
  <Route path="/"                element={<PublicLayout><Landing /></PublicLayout>} />
  <Route path="/login"           element={<PublicLayout><LoginPage /></PublicLayout>} />
  <Route path="/signup"          element={<PublicLayout><SignupPage /></PublicLayout>} />
  <Route path="/verify-otp"      element={<PublicLayout><VerifyOtpPage /></PublicLayout>} />
  <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
  <Route path="/reset-password"  element={<PublicLayout><ResetPasswordPage /></PublicLayout>} />
  <Route path="/dashboard"       element={<ProtectedRoute><DashboardShell /></ProtectedRoute>} />
  <Route path="*"                element={<Navigate to="/" replace />} />  {/* Fallback */}
</Routes>
```

### Router Hooks Used

| Hook | Used In | Purpose |
|---|---|---|
| `useNavigate` | LoginPage, SignupPage, VerifyOtpPage, ForgotPasswordPage, ResetPasswordPage | Programmatic navigation after form submit |
| `useLocation` | App.jsx (PublicLayout), VerifyOtpPage, ResetPasswordPage | Read current path / pass email state between pages |
| `Navigate` component | ProtectedRoute, fallback `*` route | Declarative redirect |
| `Link` component | Navbar, all auth pages | Declarative anchor navigation |

```jsx
// useNavigate example — navigate after login
const navigate = useNavigate();
const res = await login(email, password);
if (res.success) {
  setTimeout(() => navigate('/dashboard'), 1000);
}

// useLocation example — read state passed from previous page
const location = useLocation();
const stateEmail = location.state?.email || '';
```

---

## 🛡️ 4. Protected Route (Custom Pattern)

```jsx
// App.jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="loader-spinner"></div></div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
```
> Guards the `/dashboard` route — unauthenticated users are redirected to `/login`.

---

## 📋 5. Controlled Components (Forms)

Every form input is **fully controlled** — state manages the input value:

```jsx
// LoginPage.jsx — controlled input
const [email, setEmail] = useState('');

<input
  type="email"
  value={email}                            // state → input
  onChange={(e) => setEmail(e.target.value)} // input → state
  disabled={submitting}
  required
/>
```

Forms: Login, Signup, OTP Verify, Reset Password, URL Shortener, Bulk CSV Upload

---

## 🔄 6. Conditional Rendering

Three patterns used throughout:

```jsx
// Pattern 1: && short-circuit — show dropdown only if open
{profileDropdownOpen && (
  <div className="profile-glass-dropdown">...</div>
)}

// Pattern 2: Ternary — submitting spinner vs button text
{submitting ? (
  <span><span className="loader-spinner" /> Processing...</span>
) : (
  'Access Dashboard'
)}

// Pattern 3: Multi-branch ternary for view routing
{currentView === 'profile' ? (
  <Profile />
) : currentView === 'analytics' ? (
  <Analytics />
) : (
  <Dashboard />
)}
```

---

## 📋 7. List Rendering with `key`

```jsx
// Dashboard.jsx — render URL cards
{filteredUrls.map(url => (
  <div key={url._id} className="link-card">   {/* key = unique MongoDB _id */}
    ...
  </div>
))}

// Toast notifications
{toasts.map(toast => (
  <div key={toast.id} className={`toast toast-${toast.type}`}>
    {toast.message}
  </div>
))}
```

---

## 📤 8. State Lifting & Props Drilling

State is **lifted to `AppContent`** in `App.jsx` and passed down via props:

```jsx
// App.jsx → DashboardShell → Dashboard / Analytics / Profile
<DashboardShell
  urls={urls}               // lifted state
  urlsLoading={urlsLoading}
  setUrls={setUrls}         // setter passed as prop (callback pattern)
  fetchUrls={fetchUrls}
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  ...
/>
```

---

## 🧱 9. Component Composition (children prop)

```jsx
// Layout wrapper using children prop
const PublicLayout = ({ children }) => {
  return (
    <div className="app-container">
      <nav>...</nav>
      <div>{children}</div>   {/* render whatever is passed inside */}
    </div>
  );
};

// Usage
<PublicLayout>
  <LoginPage />
</PublicLayout>
```

Also used in: `AuthProvider`, `ThemeProvider`, `GoogleOAuthProvider`, `ProtectedRoute`

---

## ⚡ 10. React 18 Entry Point

```jsx
// main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'  // React 18 API

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

| Feature | Details |
|---|---|
| `createRoot` | React 18 Concurrent Mode — replaces old `ReactDOM.render()` |
| `StrictMode` | Highlights potential problems, runs effects twice in dev |

---

## 📦 11. Third-Party Integration (React Ecosystem)

| Library | Usage |
|---|---|
| `react-router-dom v6` | Client-side routing, navigation |
| `@react-oauth/google` | Google OAuth login (`GoogleLogin`, `GoogleOAuthProvider`) |

```jsx
// Google OAuth integration
<GoogleLogin
  key={theme}
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  theme={theme === 'dark' ? 'filled_black' : 'outline'}
  shape="pill"
/>
```

---

## ✅ Quick Summary — All Concepts Checklist

| React Concept | ✅ Used | Where |
|---|---|---|
| Functional Components | ✅ | All files |
| JSX | ✅ | Throughout |
| `useState` | ✅ | Every component |
| `useEffect` | ✅ | 9+ instances |
| `useCallback` | ✅ | App.jsx, Dashboard.jsx |
| `useRef` | ✅ | LoginPage, SignupPage, VerifyOtpPage |
| `useContext` | ✅ | Via `useAuth()`, `useTheme()` |
| Custom Hooks | ✅ | `useAuth`, `useTheme` |
| Context API | ✅ | AuthContext, ThemeContext |
| Provider Pattern | ✅ | Nested in App.jsx |
| Protected Route | ✅ | ProtectedRoute component |
| Controlled Components | ✅ | All form inputs |
| Conditional Rendering | ✅ | Everywhere |
| List Rendering + `key` | ✅ | Dashboard, Analytics |
| State Lifting | ✅ | App.jsx → children |
| Props (callback pattern) | ✅ | setUrls, fetchUrls passed as props |
| Children Prop / Composition | ✅ | PublicLayout, Providers |
| `BrowserRouter` + `Routes` + `Route` | ✅ | App.jsx |
| `useNavigate` | ✅ | 5 auth pages |
| `useLocation` | ✅ | 3 files |
| `Navigate` component | ✅ | Redirect + fallback |
| `Link` component | ✅ | Navbar, auth forms |
| `StrictMode` | ✅ | main.jsx |
| `createRoot` (React 18) | ✅ | main.jsx |
| `useMemo` | ❌ | Not used |
| `useReducer` | ❌ | Not used |
| Lazy Loading / Suspense | ❌ | Not used |
| Error Boundaries | ❌ | Not used |

---

> 💡 **Interview Tip**: Every concept marked ✅ above can be explained using **real examples from this project**.
> You built these — own them in the interview!
