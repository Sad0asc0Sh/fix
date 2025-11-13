"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiPost, apiPut } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function BrandForm({ initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, description, logoUrl };
      if (initialData?._id) {
        await apiPut(`/api/admin/brands/${initialData._id}`, payload);
      } else {
        await apiPost(`/api/admin/brands`, payload);
      }
      toast.success("با موفقیت ذخیره شد");
    } catch (e) {
      toast.error(e.message || "خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rtl">
      <div className="grid gap-2">
        <Label htmlFor="name">نام برند</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">توضیحات (اختیاری)</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="logo">URL لوگو (اختیاری)</Label>
        <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      </div>
      <div>
        <Button type="submit" disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره"}</Button>
      </div>
    </form>
  );
}

