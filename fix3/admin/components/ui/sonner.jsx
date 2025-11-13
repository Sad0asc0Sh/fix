"use client";

import { Toaster as Sonner, toast } from "sonner";

export function Toaster(props) {
  return <Sonner dir="rtl" position="top-left" richColors {...props} />;
}

export { toast };

