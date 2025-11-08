// utils/debug.js - Debug utility for authentication issues

export const debugAuth = () => {
  if (typeof window === 'undefined') {
    console.log('Debug: Running on server side');
    return;
  }

  console.group('🔍 Authentication Debug Info');
  
  // Check localStorage
  console.log('📦 LocalStorage:');
  console.log('  adminToken:', localStorage.getItem('adminToken'));
  console.log('  admin-token:', localStorage.getItem('admin-token'));
  console.log('  adminUser:', localStorage.getItem('adminUser'));
  
  // Check cookies
  console.log('🍪 Cookies:');
  console.log('  All cookies:', document.cookie);
  console.log('  Has admin-token cookie:', document.cookie.includes('admin-token'));
  
  // Parse admin user
  const userStr = localStorage.getItem('adminUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('👤 Admin User:');
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  ID:', user._id || user.id);
    } catch (e) {
      console.error('❌ Failed to parse admin user:', e);
    }
  } else {
    console.log('👤 No admin user data found');
  }
  
  // Check authentication functions
  if (typeof window.isAuthenticated === 'function') {
    console.log('✅ isAuthenticated:', window.isAuthenticated());
  }
  
  // Check current page
  console.log('📍 Current Location:');
  console.log('  Pathname:', window.location.pathname);
  console.log('  URL:', window.location.href);
  
  console.groupEnd();
};

// Auto-debug on load if query param is present
if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
  setTimeout(debugAuth, 1000);
}

// Make it available globally for easy access
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
}

export default debugAuth;
