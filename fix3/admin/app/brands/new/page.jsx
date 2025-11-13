"use client";

import BrandForm from "@/components/forms/BrandForm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewBrandPage() {
  return (
    <div className="space-y-4 rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">افزودن برند جدید</h1>
        <Link href="/brands"><Button variant="ghost">بازگشت</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فرم برند</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandForm />
        </CardContent>
      </Card>
    </div>
  );
}

