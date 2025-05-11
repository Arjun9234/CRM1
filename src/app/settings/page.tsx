
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, UserCircle, Bell, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        </div>

        {/* Profile Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserCircle className="h-6 w-6 text-primary" />
              Profile Settings
            </CardTitle>
            <CardDescription>Manage your personal information and account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="https://picsum.photos/seed/settingsuser/100/100" data-ai-hint="profile avatar" alt="User Name" />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline">Change Photo</Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue="Demo User" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="demo.user@example.com" disabled />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Short Bio</Label>
              <Input id="bio" placeholder="Tell us a little about yourself" />
            </div>
            <Button>Save Profile Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-6 w-6 text-primary" />
              Notification Settings
            </CardTitle>
            <CardDescription>Choose how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates and alerts via email.</p>
              </div>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="pushNotifications" className="font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Get real-time alerts on your device.</p>
              </div>
              <Switch id="pushNotifications" />
            </div>
             <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="campaignSummary" className="font-medium">Campaign Summaries</Label>
                <p className="text-xs text-muted-foreground">Weekly email digest of campaign performance.</p>
              </div>
              <Switch id="campaignSummary" defaultChecked />
            </div>
            <Button>Save Notification Preferences</Button>
          </CardContent>
        </Card>
        
        {/* Appearance Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Palette className="h-6 w-6 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="theme" className="font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground">Choose between light, dark, or system default.</p>
              </div>
               <p className="text-sm text-muted-foreground">Theme toggle is in the header.</p>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="fontSize" className="font-medium">Font Size (Coming Soon)</Label>
                <p className="text-xs text-muted-foreground">Adjust the text size for better readability.</p>
              </div>
              <Button variant="outline" disabled>Default</Button>
            </div>
          </CardContent>
        </Card>


        {/* Security Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-primary" />
              Security & Privacy
            </CardTitle>
            <CardDescription>Manage your account security and privacy settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full sm:w-auto">Change Password (Simulated)</Button>
            <div className="flex items-center justify-between p-3 border rounded-md">
               <div>
                <Label htmlFor="twoFactorAuth" className="font-medium">Two-Factor Authentication (2FA)</Label>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Switch id="twoFactorAuth" disabled />
            </div>
            <p className="text-sm text-muted-foreground">
              More security options and privacy controls will be available here soon.
            </p>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
