import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch current user on mount if token exists
      api
        .get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Request a password-reset email. Returns the raw payload so the caller can
  // surface the demo reset link when SMTP isn't configured.
  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  // Complete a reset with the emailed token; logs the user straight in.
  const resetPassword = async (token, password) => {
    const res = await api.post(`/auth/reset-password/${token}`, { password });
    const { token: authToken, user: u } = res.data;
    localStorage.setItem('token', authToken);
    setUser(u);
    return u;
  };

  // Merge fresh fields into the cached user (e.g. after selfie verification)
  const patchUser = (fields) => setUser((prev) => ({ ...prev, ...fields }));

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        patchUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
