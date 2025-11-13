"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CategoryForm from "@/components/forms/CategoryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";

export default function EditCategoryPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiGet(`/api/categories/${id}`);
        setData(res?.data || null);
      } catch (e) {
        setError(e.message || "خطا در دریافت دسته‌بندی");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-4">در حال بارگذاری...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4 rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ویرایش دسته‌بندی</h1>
        <Link href="/categories"><Button variant="ghost">بازگشت</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فرم دسته‌بندی</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm initialData={data} />
        </CardContent>
      </Card>
    </div>
  );
}

