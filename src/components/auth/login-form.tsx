
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChromeIcon } from 'lucide-react'; // Using ChromeIcon as a stand-in for Google G
import { useToast } from "@/hooks/use-toast";


export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: "Missing fields",
        description: "Please enter both name and email.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await login(name, email); // Mock login
      toast({
        title: "Login Successful",
        description: `Welcome back, ${name}!`,
      });
      router.replace('/dashboard');
    } catch (error) {
      console.error("Login failed", error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Miniature Genius</CardTitle>
        <CardDescription>Sign in to access your CRM dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Your Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In with Email'}
          </Button>
        </form>
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-muted"></div>
          <span className="mx-4 text-xs uppercase text-muted-foreground">Or</span>
          <div className="flex-grow border-t border-muted"></div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleSubmit} disabled={isLoading}>
          <ChromeIcon className="mr-2 h-5 w-5" /> 
          Sign In with Google (Simulated)
        </Button>
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        <p>This is a simulated login. No actual Google OAuth is performed.</p>
      </CardFooter>
    </Card>
  );
}