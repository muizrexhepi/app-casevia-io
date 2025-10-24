"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  Trash2,
  Mail,
  User as UserIcon,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  // Fetch linked accounts
  const fetchAccounts = async () => {
    try {
      const { data } = await authClient.listAccounts();
      setAccounts(data || []);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  };

  useState(() => {
    if (user) {
      fetchAccounts();
    }
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Update profile information
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await authClient.updateUser({
        name,
        image: user.image,
      });

      alert("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Change email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await authClient.changeEmail({
        newEmail,
        callbackURL: "/settings/account",
      });

      alert(
        "Verification email sent to your current email address. Please verify to complete the change."
      );
      setNewEmail("");
    } catch (error) {
      console.error("Failed to change email:", error);
      alert("Failed to change email. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setIsUpdating(true);

    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      alert("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password. Please check your current password.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      await authClient.deleteUser({
        password: deletePassword,
        callbackURL: "/",
      });

      // If email verification is enabled, show message
      alert(
        "Account deletion request submitted. Please check your email to confirm."
      );
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  // Send verification email
  const handleSendVerification = async () => {
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/settings/account",
      });
      alert("Verification email sent! Please check your inbox.");
    } catch (error) {
      console.error("Failed to send verification:", error);
      alert("Failed to send verification email.");
    }
  };

  // Link social account
  const handleLinkSocial = async (provider: string) => {
    try {
      await authClient.linkSocial({
        provider,
        callbackURL: "/settings/account",
      });
    } catch (error) {
      console.error("Failed to link account:", error);
      alert(`Failed to link ${provider} account.`);
    }
  };

  const handleUnlinkAccount = async (providerId: string, accountId: string) => {
    if (!confirm("Are you sure you want to unlink this account?")) return;

    try {
      await authClient.unlinkAccount({
        providerId,
        accountId,
      });

      alert("Account unlinked successfully");
      fetchAccounts();
    } catch (error) {
      console.error("Failed to unlink account:", error);
      alert(
        "Failed to unlink account. You must have at least one login method."
      );
    }
  };

  // Check if password account exists
  const hasPasswordAccount = accounts.some(
    (acc) => acc.providerId === "credential"
  );

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Picture Section */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || ""} alt={user.name} />
            <AvatarFallback className="text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button variant={"default"}>
              <Camera className="w-4 h-4" />
              Upload new picture
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Current Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-muted text-sm cursor-not-allowed"
              />
            </div>
            {!user.emailVerified && (
              <div className="flex items-center justify-between p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-600 dark:text-yellow-500">
                  Your email is not verified
                </p>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  className="text-xs font-medium text-yellow-600 dark:text-yellow-500 hover:underline"
                >
                  Send verification email
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdating || name === user.name}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Email Section */}
      {user.emailVerified && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Change Email Address</h2>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-email" className="text-sm font-medium">
                New Email Address
              </label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full h-10 px-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter new email address"
              />
              <p className="text-xs text-muted-foreground">
                You'll receive a verification email to your current address to
                approve this change.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating || !newEmail}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                Request Email Change
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Linked Accounts</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect multiple sign-in methods to your account for easier access.
        </p>

        <div className="space-y-3">
          {/* Password Account */}
          <div className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Email & Password</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {hasPasswordAccount ? (
              <span className="text-xs text-green-600 dark:text-green-500 font-medium">
                Connected
              </span>
            ) : (
              <button
                onClick={() =>
                  alert(
                    "Use 'Change Password' section to set up password authentication"
                  )
                }
                className="text-xs font-medium text-primary hover:underline"
              >
                Set up password
              </button>
            )}
          </div>

          {/* Social Accounts */}
          {["google", "github"].map((provider) => {
            const account = accounts.find((acc) => acc.providerId === provider);
            return (
              <div
                key={provider}
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{provider}</p>
                    <p className="text-xs text-muted-foreground">
                      {account ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {account ? (
                  <button
                    onClick={() =>
                      handleUnlinkAccount(provider, account.accountId)
                    }
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkSocial(provider)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Password Section */}
      {hasPasswordAccount && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium">
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 px-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  isUpdating ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/50 bg-card p-6">
        <h2 className="text-lg font-semibold text-destructive mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. All your data
          will be permanently removed.
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant={"destructive"}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive mb-2">
                Are you absolutely sure?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                This action cannot be undone. This will permanently delete your
                account and remove all associated data.
              </p>

              {hasPasswordAccount && (
                <div className="space-y-2">
                  <label
                    htmlFor="delete-password"
                    className="text-xs font-medium"
                  >
                    Enter your password to confirm
                  </label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter password"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant={"destructive"}
                onClick={handleDeleteAccount}
                disabled={isDeleting || (hasPasswordAccount && !deletePassword)}
                // className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, delete my account
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                }}
                variant={"outline"}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
