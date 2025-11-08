// utils/auth.js - Authentication utilities for admin panel

/**
 * Check if admin is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('adminToken') || 
                localStorage.getItem('admin-token');
  const cookieToken = getCookie('admin-token');
  
  return !!(token || cookieToken);
};

/**
 * Get admin token
 * @returns {string|null}
 */
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('adminToken') || 
         localStorage.getItem('admin-token') || 
         getCookie('admin-token');
};

/**
 * Get admin user info
 * @returns {object|null}
 */
export const getAdminUser = () => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('adminUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Save auth data after successful login
 * @param {string} token
 * @param {object} user
 */
export const saveAuthData = (token, user) => {
  if (typeof window === 'undefined') return;
  
  if (token) {
    // Store in both locations for compatibility
    localStorage.setItem('adminToken', token);
    localStorage.setItem('admin-token', token);
  }
  
  if (user) {
    localStorage.setItem('adminUser', JSON.stringify(user));
  }
};

/**
 * Clear auth data on logout
 */
export const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin-token');
  localStorage.removeItem('adminUser');
  
  // Also clear cookies
  document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

/**
 * Get cookie value by name
 * @param {string} name
 * @returns {string|null}
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  
  return null;
}

/**
 * Check if user has admin role
 * @returns {boolean}
 */
export const isAdmin = () => {
  const user = getAdminUser();
  return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin';
};

/**
 * Check if user has specific role
 * @param {string} role
 * @returns {boolean}
 */
export const hasRole = (role) => {
  const user = getAdminUser();
  return user?.role === role;
};

/**
 * Redirect to login if not authenticated
 * @param {object} router - Next.js router instance
 */
export const requireAuth = (router) => {
  if (!isAuthenticated()) {
    router.push('/login');
    return false;
  }
  return true;
};

export default {
  isAuthenticated,
  getToken,
  getAdminUser,
  saveAuthData,
  clearAuthData,
  isAdmin,
  hasRole,
  requireAuth
};
