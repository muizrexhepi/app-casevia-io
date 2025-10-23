"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Save,
  Trash2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Globe,
  Info,
  Upload,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";

export default function WorkspaceSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");

  const { data: organizations, isPending } = authClient.useListOrganizations();
  const activeOrg = organizations?.[0];

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
      setLogoPreview(activeOrg.logo || "");
    }
  }, [activeOrg]);

  const handleSave = async () => {
    if (!activeOrg?.id || !formData.name.trim() || !formData.slug.trim()) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.organization.update({
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

  const handleLogoChange = (url: string) => {
    setFormData({ ...formData, logo: url });
    setLogoPreview(url);
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: "" });
    setLogoPreview("");
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization's information and preferences
        </p>
      </div>

      {/* General Information Card */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">General Information</h2>
              <p className="text-sm text-muted-foreground">
                Update your organization's basic details
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Acme Inc."
              className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
            <p className="text-xs text-muted-foreground">
              This is your organization's display name
            </p>
          </div>

          {/* Organization URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization URL</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-input rounded-lg text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                casevia.io/
              </div>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                placeholder="acme-inc"
                className="flex-1 px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                This is your organization's unique URL identifier. Use lowercase
                letters, numbers, and hyphens only.
              </span>
            </div>
          </div>

          {/* Organization Logo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Logo</label>
            <div className="flex items-start gap-4">
              {logoPreview && (
                <div className="relative group">
                  <div className="w-20 h-20 rounded-lg border-2 border-border overflow-hidden bg-muted">
                    <img
                      src={logoPreview}
                      alt="Organization logo"
                      className="w-full h-full object-cover"
                      onError={() => setLogoPreview("")}
                    />
                  </div>
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => handleLogoChange(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Enter a URL to your organization's logo image. Recommended
                    size: 400x400px
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={
                saving || !formData.name.trim() || !formData.slug.trim()
              }
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-lg border-2 border-destructive/20 shadow-sm">
        <div className="p-6 border-b border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-destructive">
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground">
                Irreversible and destructive actions
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">Delete Organization</h3>
              <p className="text-sm text-muted-foreground">
                Once you delete your organization, there is no going back. This
                will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5 mt-3">
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
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all font-medium shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Delete Organization
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full border border-border animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Delete Organization</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
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
                      {activeOrg?.members?.length || 0} team members
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      All settings and data
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Type{" "}
                    <span className="font-bold text-foreground">
                      {activeOrg?.name}
                    </span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={activeOrg?.name}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-destructive focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation("");
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-input rounded-lg hover:bg-accent transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmation !== activeOrg?.name || deleting}
                  className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
