import { NextResponse } from "next/server";

export async function POST() {
  // Clear the cookie by setting maxAge to 0
  const response = NextResponse.json({ message: "خروج با موفقیت انجام شد." });
  response.cookies.set("admin-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
