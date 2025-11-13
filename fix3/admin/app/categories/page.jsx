"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet, apiDelete } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet("/api/categories");
      const data = res?.data || [];
      setRows(
        data.map((c) => ({
          _id: c._id,
          name: c.name,
          parentName: c.parent?.name || "-",
        }))
      );
    } catch (e) {
      setError(e.message || "خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("حذف این دسته‌بندی انجام شود؟")) return;
    try {
      await apiDelete(`/api/categories/${id}`);
      toast.success("حذف شد");
      load();
    } catch (e) {
      toast.error(e.message || "خطا در حذف");
    }
  };

  return (
    <div className="space-y-4 rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">مدیریت دسته‌بندی‌ها</h1>
        <Link href="/categories/new"><Button>افزودن دسته‌بندی جدید</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فهرست دسته‌بندی‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>در حال بارگذاری...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>دسته‌بندی والد</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.parentName}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/categories/edit/${cat._id}`}><Button variant="secondary">ویرایش</Button></Link>
                        <Button variant="destructive" onClick={() => handleDelete(cat._id)}>حذف</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

