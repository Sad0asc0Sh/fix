import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/api"; // This function needs to be created

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast({
        title: "خطا",
        description: "لینک بازنشانی نامعتبر یا ناقص است.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [token, navigate, toast]);

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.",
      });
      navigate("/login");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در بازنشانی",
        description: error.response?.data?.message || "لینک نامعتبر یا منقضی شده است.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "خطای اعتبارسنجی",
        description: "رمزهای عبور وارد شده یکسان نیستند.",
        variant: "destructive",
      });
      return;
    }
    if (!password) {
      toast({
        title: "خطای اعتبارسنجی",
        description: "لطفاً رمز عبور جدید را وارد کنید.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ token, password });
  };

  if (!token) {
    return null; // Or a loading/error state while redirecting
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] py-12">
      <Card className="mx-auto max-w-sm text-right">
        <CardHeader>
          <CardTitle className="text-2xl">بازنشانی رمز عبور</CardTitle>
          <CardDescription>
            رمز عبور جدید خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">رمز عبور جدید</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={mutation.isPending}
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "در حال ذخیره..." : "ذخیره رمز عبور جدید"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
