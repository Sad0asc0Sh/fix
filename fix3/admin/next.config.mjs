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
    // Content Security Policy configuration
    // Using 'self' for connect-src since baseURL is /proxy-api
    const cspRaw = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data:;
      media-src 'none';
      connect-src 'self';
      font-src 'self';
    `;
    
    // Clean up CSP string: remove extra whitespace and join properly
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
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;