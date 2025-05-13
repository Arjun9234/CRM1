
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChromeIcon, Loader2 } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const { login, signInWithGoogle, isLoading: authIsLoading } = useAuth(); 
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    setIsEmailLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: `Welcome back!`,
      });
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Email login failed", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Google Sign-In Successful",
        description: "You are now logged in.",
      });
       router.replace('/dashboard');
    } catch (error: any) {
      console.error("Google Sign-In failed", error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "An error occurred. Please ensure pop-ups are allowed and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const overallLoading = isEmailLoading || isGoogleLoading || authIsLoading;

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">EngageSphere</CardTitle>
        <CardDescription>Sign in to access your EngageSphere dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="your.email@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={overallLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Your Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={overallLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={overallLoading}>
            {isEmailLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </Button>
        </form>
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-muted"></div>
          <span className="mx-4 text-xs uppercase text-muted-foreground">Or</span>
          <div className="flex-grow border-t border-muted"></div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={overallLoading}>
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChromeIcon className="mr-2 h-5 w-5" /> }
          {isGoogleLoading ? 'Processing Google Sign-In...' : 'Sign In with Google'}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
        <p>
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

