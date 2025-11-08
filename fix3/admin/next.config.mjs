/** @type {import('next').NextConfig} */

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/proxy-api/:path*",
        destination: "http://127.0.0.1:5000/api/:path*", 
      },
    ];
  },
  
  async headers() {
    // 🎯 رفع مشکل: ما هدر CSP را فقط به صفحات اعمال می‌کنیم، نه به API
    
    const cspRaw = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data:;
      media-src 'none';
      connect-src 'self';
      font-src 'self';
    `;
    
    const ContentSecurityPolicy = cspRaw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');

    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy,
      },
    ];

    return [
      {
        // 🎯 این source تغییر کرده است تا فقط شامل صفحات شود
        // و مسیرهای api, _next, image و favicon را نادیده بگیرد
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;