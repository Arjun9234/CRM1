
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added Link import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChromeIcon, Loader2 } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";


export function LoginForm() {
  const { login, signInWithGoogle, isLoading: authIsLoading } = useAuth(); // Renamed isLoading to authIsLoading
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: "Missing fields",
        description: "Please enter both name and email.",
        variant: "destructive",
      });
      return;
    }
    setIsEmailLoading(true);
    try {
      await login(name, email); // Mock login
      toast({
        title: "Login Successful",
        description: `Welcome back, ${name}!`,
      });
      router.replace('/dashboard');
    } catch (error) {
      console.error("Email login failed", error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
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
        title: "Signing in with Google...",
        description: "Please wait while we authenticate you.",
      });
      // router.replace('/dashboard') will be handled by AuthProvider or page.tsx effect
    } catch (error: any) {
      console.error("Google Sign-In failed", error);
      let errorMessage = "An error occurred during Google Sign-In. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Google Sign-In was cancelled.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error during Google Sign-In. Please check your connection.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google Sign-In. Please check Firebase console.";
      }
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
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
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Your Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              disabled={overallLoading}
            />
          </div>
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
          <Button type="submit" className="w-full" disabled={overallLoading}>
            {isEmailLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In with Email'}
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
        <p>Email login is simulated. Google Sign-In uses Firebase.</p>
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

