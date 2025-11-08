import { NextResponse } from "next/server";

// Backend base URL (falls back to local dev server)
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Proxy credentials to the backend admin login endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    let payload = null;
    try {
      payload = await backendResponse.json();
    } catch {
      payload = null;
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message || "Authentication failed." },
        { status: backendResponse.status }
      );
    }

    // Extract the access token + user payload from backend response
    // (authController.js returns it as `accessToken`)
    const { accessToken, data } = payload || {};
    const user = data?.user;

    if (!accessToken) {
      console.error("No token in response from backend:", payload);
      return NextResponse.json(
        { message: "Login succeeded but no token was returned from backend." },
        { status: 502 }
      );
    }

    // Return the token JSON for the login page and set cookies so layout/localStorage stay in sync
    const parsedMaxAge = parseInt(process.env.NEXT_PUBLIC_ADMIN_TOKEN_MAX_AGE ?? "3600", 10);
    const tokenMaxAge = Number.isNaN(parsedMaxAge) ? 3600 : parsedMaxAge;

    const response = NextResponse.json({
      user,
      token: accessToken,
    });

    response.cookies.set("admin-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenMaxAge,
    });

    // Client-readable cookie so layout/auth helpers can detect session without waiting for localStorage
    response.cookies.set("admin-token-client", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenMaxAge,
    });

    return response;
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
