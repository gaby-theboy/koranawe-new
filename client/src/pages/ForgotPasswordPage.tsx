import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center pt-8 pb-6">
          <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-3 shadow-lg">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold">Reset Password</h2>
          <p className="text-base text-muted-foreground">
            {isSubmitted 
              ? "Check your email for reset instructions"
              : "Enter your email to receive reset instructions"
            }
          </p>
        </CardHeader>

        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" data-testid="button-reset-submit">
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center space-y-4">
              <p className="text-sm leading-relaxed">
                We've sent password reset instructions to <strong>{email}</strong>. 
                Please check your inbox and follow the link to reset your password.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full" data-testid="button-back-login">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Link href="/login">
            <Button variant="ghost" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
