"use client";

import CategoryForm from "@/components/forms/CategoryForm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewCategoryPage() {
  return (
    <div className="space-y-4 rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">افزودن دسته‌بندی جدید</h1>
        <Link href="/categories"><Button variant="ghost">بازگشت</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فرم دسته‌بندی</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}

