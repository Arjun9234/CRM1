
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
  const { login, isLoading: authIsLoading } = useAuth(); 
  const router = useRouter();
  const [email, setEmail] = useState('');
  // const [name, setName] = useState(''); // Name not needed for JWT login, typically just email/password
  const [password, setPassword] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Keep for UI, actual logic TBD
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { // Changed from name to password
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    setIsEmailLoading(true);
    try {
      await login(email, password); // Use email and password for login
      toast({
        title: "Login Successful",
        description: `Welcome back!`, // Name will come from user object in context if needed
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
    toast({
      title: "Google Sign-In",
      description: "Google Sign-In with the new backend is not yet fully implemented.",
      variant: "default",
    });
    // try {
    //   await signInWithGoogle(); // This function needs to be implemented in AuthProvider for Node.js backend
    //   toast({
    //     title: "Signing in with Google...",
    //     description: "Please wait while we authenticate you.",
    //   });
    // } catch (error: any) {
    //   console.error("Google Sign-In failed", error);
    //   toast({
    //     title: "Google Sign-In Failed",
    //     description: error.message || "An error occurred. Please try again.",
    //     variant: "destructive",
    //   });
    // } finally {
    //   setIsGoogleLoading(false);
    // }
    setIsGoogleLoading(false); // Remove this line when implemented
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
          {/* Name field removed for standard email/password login */}
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
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={true || overallLoading}> {/* Disabled until implemented */}
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChromeIcon className="mr-2 h-5 w-5" /> }
          {isGoogleLoading ? 'Processing Google Sign-In...' : 'Sign In with Google (Coming Soon)'}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
        {/* <p>Email login is simulated. Google Sign-In uses Firebase.</p> */}
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
