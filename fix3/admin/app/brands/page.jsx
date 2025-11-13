"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet, apiDelete } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function BrandsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet("/api/admin/brands");
      setRows(res?.data || []);
    } catch (e) {
      setError(e.message || "خطا در دریافت برندها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("حذف این برند انجام شود؟")) return;
    try {
      await apiDelete(`/api/admin/brands/${id}`);
      toast.success("حذف شد");
      load();
    } catch (e) {
      toast.error(e.message || "خطا در حذف");
    }
  };

  return (
    <div className="space-y-4 rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">مدیریت برندها</h1>
        <Link href="/brands/new"><Button>افزودن برند جدید</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فهرست برندها</CardTitle>
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
                  <TableHead>URL لوگو</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="truncate max-w-[300px]">{b.logoUrl || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/brands/edit/${b._id}`}><Button variant="secondary">ویرایش</Button></Link>
                        <Button variant="destructive" onClick={() => handleDelete(b._id)}>حذف</Button>
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

