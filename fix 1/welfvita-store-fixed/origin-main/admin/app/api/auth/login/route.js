import { NextResponse } from "next/server";

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

    const backendResponse = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });

    let payload = null;
    try {
      payload = await backendResponse.json();
    } catch (_) {
      payload = null;
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message || "Authentication failed." },
        { status: backendResponse.status }
      );
    }

    const { token, user } = payload || {};

    if (!token) {
      return NextResponse.json(
        { message: "Login succeeded but no token was returned." },
        { status: 502 }
      );
    }

    const response = NextResponse.json({ user });
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
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
