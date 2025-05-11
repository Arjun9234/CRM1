
"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Mail, Edit3, Save, Building, CalendarDays } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.image || `https://picsum.photos/seed/${user.email || 'default'}/100/100`);
      // Mock other details for now, as they aren't in the basic User type
      setBio(user.bio || "Passionate about customer engagement and building great products.");
      setCompany(user.company || "EngageSphere Inc.");
    }
  }, [user]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, you would update the user data via an API call here
    // and potentially update the AuthContext or refetch user data.
    // For example: await updateUserProfile({ fullName, bio, company, avatarUrl });
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center">
            <UserCircle className="mr-3 h-8 w-8 text-primary" />
            My Profile
          </h1>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>

        <Card className="shadow-xl">
          <form onSubmit={handleSaveChanges}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar className="h-24 w-24 text-3xl">
                  <AvatarImage src={avatarUrl} alt={fullName} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <CardTitle className="text-2xl">{fullName || "User Name"}</CardTitle>
                  <CardDescription className="flex items-center justify-center sm:justify-start mt-1">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {email || "user.email@example.com"}
                  </CardDescription>
                  {isEditing && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setAvatarUrl(`https://picsum.photos/seed/${Date.now()}/100/100`)}>
                      Change Photo (Simulated)
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  disabled={!isEditing || isSaving}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} disabled />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
              </div>

              <div>
                <Label htmlFor="company">Company / Organization</Label>
                <Input 
                  id="company" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)} 
                  placeholder="Your Company Inc."
                  disabled={!isEditing || isSaving} 
                />
              </div>

              <div>
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea 
                  id="bio" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Tell us a bit about yourself..." 
                  rows={3} 
                  disabled={!isEditing || isSaving}
                />
              </div>

              {!isEditing && user && (
                <div className="space-y-3 text-sm text-muted-foreground pt-4 border-t">
                    <div className="flex items-center">
                        <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                        <span>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</span>
                    </div>
                     <div className="flex items-center">
                        <Building className="mr-2 h-4 w-4 text-primary" />
                        <span>Works at: {company || "Not specified"}</span>
                    </div>
                </div>
              )}

            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => {
                    setIsEditing(false);
                    // Reset fields to original user data if needed
                    if(user) {
                        setFullName(user.name || '');
                        setBio(user.bio || "Passionate about customer engagement and building great products.");
                        setCompany(user.company || "EngageSphere Inc.");
                    }
                }} 
                disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <><Save className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
              </CardFooter>
            )}
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
