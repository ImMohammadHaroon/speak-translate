import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

const VerifyOTP = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ email });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setStep("otp");
    toast({ title: "OTP sent", description: `Check your email at ${email}` });
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    setLoading(false);

    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Verified!", description: "You're now logged in." });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/owl-favicon.png" alt="Devowl" className="mx-auto mb-2 h-12 w-12" />
          <CardTitle>{step === "email" ? "Sign in with OTP" : "Enter verification code"}</CardTitle>
          <CardDescription>
            {step === "email"
              ? "We'll send a one-time code to your email"
              : `Enter the 6-digit code sent to ${email}`}
          </CardDescription>
        </CardHeader>

        {step === "email" ? (
          <form onSubmit={handleSendOTP}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
              <Link to="/login" className="text-sm text-primary hover:underline">
                Back to login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
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
              <button type="button" onClick={() => { setStep("email"); setOtp(""); }} className="text-xs text-muted-foreground hover:underline">
                Didn't get a code? Send again
              </button>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default VerifyOTP;
