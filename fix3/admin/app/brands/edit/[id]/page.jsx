"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BrandForm from "@/components/forms/BrandForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";

export default function EditBrandPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiGet(`/api/admin/brands/${id}`);
        setData(res?.data || null);
      } catch (e) {
        setError(e.message || "خطا در دریافت برند");
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
        <h1 className="text-2xl font-semibold">ویرایش برند</h1>
        <Link href="/brands"><Button variant="ghost">بازگشت</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فرم برند</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandForm initialData={data} />
        </CardContent>
      </Card>
    </div>
  );
}

