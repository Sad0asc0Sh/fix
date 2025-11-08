/** @type {import('next').NextConfig} */

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/proxy-api/:path*",
        
        // ❗️ این تغییر کلیدی برای حل "Network Error" است
        // ما از 127.0.0.1 به جای localhost یا host.docker.internal استفاده می‌کنیم
        destination: "http://127.0.0.1:5000/api/:path*", 
      },
    ];
  },
  
  async headers() {
    // ❗️ این تنظیم CSP کاملاً درست است
    // چون baseURL ما /proxy-api ('self') است، دیگر نیازی به افزودن URL بک‌اند در اینجا نیست
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data:;
      media-src 'none';
      connect-src 'self'; 
      font-src 'self';
    `;

    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy.replace(/\n/g, ''),
      },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;