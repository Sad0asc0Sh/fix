import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/api"; // This function needs to be created

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast({
        title: "درخواست موفق",
        description: "اگر ایمیل شما در سیستم موجود باشد، لینک بازنشانی برایتان ارسال خواهد شد.",
      });
      navigate("/login");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ارسال درخواست",
        description: error.response?.data?.message || "خطایی غیرمنتظره رخ داد.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "خطای اعتبارسنجی",
        description: "لطفاً ایمیل خود را وارد کنید.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ email });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] py-12">
      <Card className="mx-auto max-w-sm text-right">
        <CardHeader>
          <CardTitle className="text-2xl">فراموشی رمز عبور</CardTitle>
          <CardDescription>
            ایمیل خود را وارد کنید تا لینک بازنشانی را برایتان ارسال کنیم.
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
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "در حال ارسال..." : "ارسال لینک بازنشانی"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="underline">
              بازگشت به صفحه ورود
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
