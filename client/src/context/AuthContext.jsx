/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Derived base URL for redirection links (strips out the '/api' suffix)
export const BACKEND_BASE = API_BASE.endsWith('/api') 
  ? API_BASE.slice(0, -4) 
  : API_BASE;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for active token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          const data = await response.json();

          if (data.success) {
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token is invalid/expired
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to restore authentication session:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, message: data.message || 'Logged in!' };
      } else {
        return { 
          success: false, 
          message: data.message || 'Invalid credentials', 
          isVerified: data.isVerified, 
          email: data.email 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network connection failed. Is the server running?' };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();

      if (data.success) {
        // Sign up succeeds but requires OTP verification. We do NOT log the user in yet.
        return { success: true, message: data.message || 'Account created! Please verify your email.' };
      } else {
        return { success: false, message: data.message || 'Sign up failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network connection failed. Is the server running?' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, message: data.message || 'Verification successful!' };
      } else {
        return { success: false, message: data.message || 'Verification failed.' };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, message: 'Network connection failed.' };
    }
  };

  const resendOtp = async (email) => {
    try {
      const response = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, message: 'Network connection failed.' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Network connection failed.' };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Network connection failed.' };
    }
  };

  const updateUsername = async (newUsername) => {
    try {
      const response = await fetch(`${API_BASE}/auth/update-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername })
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to update username.' };
    } catch (error) {
      console.error('Update username error:', error);
      return { success: false, message: 'Network connection failed.' };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/auth/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, message: 'Network connection failed.' };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const response = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: googleToken })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, message: data.message || 'Logged in with Google!' };
      } else {
        return { success: false, message: data.message || 'Google Login failed.' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: 'Network connection failed.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      isAuthenticated: !!user, 
      login, 
      signup, 
      verifyOtp, 
      resendOtp, 
      forgotPassword, 
      resetPassword, 
      logout,
      updateUsername,
      updatePassword,
      loginWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
