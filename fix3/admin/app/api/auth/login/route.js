import { NextResponse } from "next/server";

// آدرس بک‌اند شما
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

    // ۱. تماس با بک‌اند واقعی
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

    // ۲. دریافت توکن و کاربر از پاسخ بک‌اند
    // (بر اساس authController.js، بک‌اند 'accessToken' را برمی‌گرداند)
    const { accessToken, data } = payload || {};
    const user = data?.user;

    if (!accessToken) {
      console.error("No token in response from backend:", payload);
      return NextResponse.json(
        { message: "Login succeeded but no token was returned from backend." },
        { status: 502 }
      );
    }

    // 🎯 تغییر اصلی اینجاست:
    // ما توکن را مستقیماً در JSON به صفحه لاگین برمی‌گردانیم.
    // این کار باعث می‌شود layout.js که از localStorage می‌خواند، به درستی کار کند.
    return NextResponse.json({
      user: user,
      token: accessToken // <-- نام آن را 'token' می‌گذاریم تا با کد صفحه لاگین هماهنگ باشد
    });

    /*
    // --- کد قبلی (و اشتباه) که کوکی httpOnly ست می‌کرد حذف شد ---
    const response = NextResponse.json({ user });
    response.cookies.set("admin-token", accessToken, {
      httpOnly: true,
      ...
    });
    return response;
    */
    
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}