import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

const VerifySignup = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    setLoading(false);

    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Account verified!", description: "Welcome to Devowl Transcriptor." });
    navigate("/");
  };

  const handleResend = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Code resent", description: `Check your email at ${email}` });
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/owl-favicon.png" alt="Devowl" className="mx-auto mb-2 h-12 w-12" />
            <CardTitle>No email provided</CardTitle>
            <CardDescription>Please sign up first to receive a verification code.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/signup" className="text-sm text-primary hover:underline">Go to Sign Up</Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/owl-favicon.png" alt="Devowl" className="mx-auto mb-2 h-12 w-12" />
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="flex flex-col items-center space-y-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <button type="button" onClick={handleResend} className="text-xs text-muted-foreground hover:underline">
              Didn't get a code? Resend
            </button>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
            <Link to="/signup" className="text-sm text-primary hover:underline">
              Back to sign up
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default VerifySignup;
