import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast({
        title: "ثبت‌نام موفق",
        description: "حساب شما با موفقیت ایجاد شد. لطفاً وارد شوید.",
      });
      navigate("/login");
    },
    onError: (error: any) => {
      toast({
        title: "ثبت‌نام ناموفق",
        description: error.response?.data?.message || "خطایی غیرمنتظره رخ داد.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({
        title: "خطای اعتبارسنجی",
        description: "لطفاً تمام اطلاعات خواسته‌شده را وارد کنید.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ name, email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] py-12">
      <Card className="mx-auto max-w-sm text-right">
        <CardHeader>
          <CardTitle className="text-xl">ایجاد حساب کاربری</CardTitle>
          <CardDescription>
            برای ساخت حساب، اطلاعات خود را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">نام</Label>
              <Input
                id="name"
                type="text"
                placeholder="مثلا: علی رضایی"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mutation.isPending}
                dir="ltr"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={mutation.isPending}
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "در حال ایجاد حساب..." : "ایجاد حساب"}
            </Button>
            <Button variant="outline" className="w-full" disabled={mutation.isPending}>
              ثبت‌نام با گوگل
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link to="/login" className="underline">
              وارد شوید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;