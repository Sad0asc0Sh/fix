"use client";

import { useEffect, useState } from "react";
import { isAuthenticated, getAdminUser, getToken } from "../../utils/auth";
import debugAuth from "../../utils/debug";

export default function AuthTestPage() {
  const [authState, setAuthState] = useState({
    isAuth: false,
    user: null,
    token: null,
    adminToken: null,
    adminToken2: null,
    cookies: null
  });

  useEffect(() => {
    // Run debug on mount
    debugAuth();

    // Get all auth data
    const checkAuth = () => {
      setAuthState({
        isAuth: isAuthenticated(),
        user: getAdminUser(),
        token: getToken(),
        adminToken: localStorage.getItem('adminToken'),
        adminToken2: localStorage.getItem('admin-token'),
        cookies: document.cookie
      });
    };

    checkAuth();
    
    // Check again after a delay
    const timer = setTimeout(checkAuth, 1000);
    return () => clearTimeout(timer);
  }, []);

  const clearAll = () => {
    localStorage.clear();
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.reload();
  };

  const setTestToken = () => {
    localStorage.setItem('adminToken', 'test-token-123');
    localStorage.setItem('admin-token', 'test-token-123');
    localStorage.setItem('adminUser', JSON.stringify({
      name: 'Test Admin',
      email: 'test@example.com',
      role: 'admin',
      _id: '123'
    }));
    window.location.reload();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Authentication Status</h2>
          <p className={authState.isAuth ? "text-green-600" : "text-red-600"}>
            {authState.isAuth ? "✅ Authenticated" : "❌ Not Authenticated"}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Tokens</h2>
          <div className="space-y-1 text-sm">
            <p>adminToken: <code className="bg-gray-100 px-1">{authState.adminToken || 'null'}</code></p>
            <p>admin-token: <code className="bg-gray-100 px-1">{authState.adminToken2 || 'null'}</code></p>
            <p>getToken(): <code className="bg-gray-100 px-1">{authState.token || 'null'}</code></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">User Info</h2>
          {authState.user ? (
            <div className="space-y-1 text-sm">
              <p>Name: {authState.user.name}</p>
              <p>Email: {authState.user.email}</p>
              <p>Role: {authState.user.role}</p>
              <p>ID: {authState.user._id || authState.user.id}</p>
            </div>
          ) : (
            <p className="text-gray-500">No user data</p>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Cookies</h2>
          <p className="text-sm font-mono break-all">{authState.cookies || 'No cookies'}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Actions</h2>
          <div className="space-x-2">
            <button
              onClick={() => debugAuth()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Run Debug
            </button>
            <button
              onClick={setTestToken}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Set Test Token
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh Page
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <h2 className="font-semibold mb-2 text-yellow-800">Instructions</h2>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>If you see "Not Authenticated", try logging in again</li>
            <li>Check browser console (F12) for debug information</li>
            <li>Use "Set Test Token" to simulate authentication</li>
            <li>Use "Clear All" to reset authentication state</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
