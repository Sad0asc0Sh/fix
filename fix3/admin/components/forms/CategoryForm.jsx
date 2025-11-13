"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function CategoryForm({ initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [parent, setParent] = useState(initialData?.parent?._id || initialData?.parent || "");
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/api/categories");
        setCategories(res?.data || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, parent: parent || null };
      if (initialData?._id) {
        await apiPut(`/api/categories/${initialData._id}`, payload);
      } else {
        await apiPost(`/api/categories`, payload);
      }
      toast.success("با موفقیت ذخیره شد");
      if (!initialData?._id) {
        setName("");
        setParent("");
      }
    } catch (err) {
      toast.error(err.message || "خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rtl">
      <div className="grid gap-2">
        <Label htmlFor="name">نام دسته‌بندی</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label>دسته‌بندی والد (اختیاری)</Label>
        <Select value={parent || ""} onValueChange={setParent}>
          <SelectTrigger>
            <SelectValue placeholder="بدون والد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">بدون والد</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </Button>
      </div>
    </form>
  );
}

