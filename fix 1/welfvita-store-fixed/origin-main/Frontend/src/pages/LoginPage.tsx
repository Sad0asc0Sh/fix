import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.token, data.user);
      toast({
        title: "ورود موفق",
        description: `${data.user.name}، خوش آمدید!`,
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "ورود ناموفق",
        description: error.message || "خطایی غیرمنتظره رخ داد.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "خطای اعتبارسنجی",
        description: "لطفا ایمیل و رمز عبور را وارد کنید.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] py-12">
      <Card className="mx-auto max-w-sm text-right">
        <CardHeader>
          <CardTitle className="text-2xl">ورود به حساب کاربری</CardTitle>
          <CardDescription>
            برای ورود به حساب خود، ایمیل و رمز عبور را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
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
              <div className="flex items-center">
                <Label htmlFor="password">رمز عبور</Label>
                <Link to="/forgot-password" className="mr-auto inline-block text-sm underline">
                  فراموشی رمز عبور؟
                </Link>
              </div>
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
              {mutation.isPending ? "در حال ورود..." : "ورود"}
            </Button>
            <Button variant="outline" className="w-full" disabled={mutation.isPending}>
              ورود با گوگل
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            حساب کاربری ندارید؟{" "}
            <Link to="/register" className="underline">
              ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;