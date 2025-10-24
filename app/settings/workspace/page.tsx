"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Save,
  Trash2,
  AlertTriangle,
  Loader2,
  Globe,
  Info,
  X,
} from "lucide-react";
import { authClient, useActiveOrganization } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WorkspaceSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const { data: activeOrg, isPending } = useActiveOrganization();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo: "",
  });

  useEffect(() => {
    if (activeOrg) {
      setFormData({
        name: activeOrg.name || "",
        slug: activeOrg.slug || "",
        logo: activeOrg.logo || "",
      });
    }
  }, [activeOrg]);

  const handleSave = async () => {
    if (!activeOrg?.id || !formData.name.trim() || !formData.slug.trim()) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.organization.update({
        organizationId: activeOrg.id,
        data: {
          name: formData.name.trim(),
          slug: formData.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          logo: formData.logo.trim() || undefined,
        },
      });

      if (error) {
        alert(error.message || "Failed to update organization");
      } else {
        alert("Organization updated successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== activeOrg?.name) {
      alert("Please type the organization name exactly to confirm");
      return;
    }

    setDeleting(true);
    try {
      const { error } = await authClient.organization.delete({
        organizationId: activeOrg?.id!,
      });

      if (error) {
        alert(error.message || "Failed to delete organization");
      } else {
        window.location.href = "/onboarding";
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete organization");
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasChanges =
    formData.name !== activeOrg?.name ||
    formData.slug !== activeOrg?.slug ||
    formData.logo !== activeOrg?.logo;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization's information and preferences
        </p>
      </div>

      {/* General Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your organization's basic details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Logo */}
          <div className="space-y-3">
            <Label>Organization Logo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={formData.logo} alt={formData.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(formData.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Input
                  type="url"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Enter a URL to your logo. Recommended size: 400x400px
                </p>
              </div>
              {formData.logo && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFormData({ ...formData, logo: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Acme Inc."
            />
            <p className="text-xs text-muted-foreground">
              This is your organization's display name
            </p>
          </div>

          {/* Organization Slug */}
          <div className="space-y-2">
            <Label htmlFor="org-slug">Organization URL</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span>casevia.io/</span>
              </div>
              <Input
                id="org-slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                placeholder="acme-inc"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Use lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !formData.name.trim() ||
                !formData.slug.trim() ||
                !hasChanges
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Delete Organization</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Once you delete your organization, there is no going back. This
                will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  All case studies and content
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  All team members and invitations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  All settings and configurations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Your organization URL
                </li>
              </ul>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              Delete Organization
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              organization and all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive mb-2">
                ⚠️ Warning: This will permanently delete
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  All case studies and content
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  All team members
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  All settings and data
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>
                Type{" "}
                <span className="font-bold text-foreground">
                  {activeOrg?.name}
                </span>{" "}
                to confirm
              </Label>
              <Input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={activeOrg?.name}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== activeOrg?.name || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Forever
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
