"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  Shield,
  User,
  MoreVertical,
  Trash2,
  X,
  Check,
  Clock,
  Search,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";

type Role = "owner" | "admin" | "member";

interface FullOrg {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  members: any[];
  invitations?: any[];
}

export default function TeamMembersPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "all">("all");
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [fullOrg, setFullOrg] = useState<FullOrg | null>(null);
  const [loading, setLoading] = useState(true);

  // Better Auth hooks
  const { data: activeOrg } = authClient.useActiveOrganization();

  // Fetch full organization data
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!activeOrg?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } =
          await authClient.organization.getFullOrganization({
            query: {
              organizationId: activeOrg.id,
            },
          });

        if (error) {
          console.error("Failed to fetch organization:", error);
        } else if (data) {
          setFullOrg(data);
        }
      } catch (err) {
        console.error("Error fetching organization:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [activeOrg?.id]);

  const members = fullOrg?.members || [];
  const pendingInvitations =
    fullOrg?.invitations?.filter((inv: any) => inv.status === "pending") || [];

  const handleInviteMember = async () => {
    if (!inviteEmail || !activeOrg?.id) return;

    setInviting(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
        organizationId: activeOrg.id,
      });

      if (error) {
        alert(error.message || "Failed to send invitation");
      } else {
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteRole("member");

        // Refresh org data
        const { data } = await authClient.organization.getFullOrganization({
          query: { organizationId: activeOrg.id },
        });
        if (data) setFullOrg(data);
      }
    } catch (err: any) {
      alert(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrg?.id,
      });

      if (error) {
        alert(error.message || "Failed to remove member");
      } else {
        // Refresh org data
        if (activeOrg?.id) {
          const { data } = await authClient.organization.getFullOrganization({
            query: { organizationId: activeOrg.id },
          });
          if (data) setFullOrg(data);
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: Role) => {
    try {
      await authClient.organization.updateMemberRole({
        role: newRole,
        memberId,
        organizationId: activeOrg?.id,
      });
      setShowRoleMenu(null);

      // Refresh org data
      if (activeOrg?.id) {
        const { data } = await authClient.organization.getFullOrganization({
          query: { organizationId: activeOrg.id },
        });
        if (data) setFullOrg(data);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      await authClient.organization.cancelInvitation({
        invitationId,
      });

      // Refresh org data
      if (activeOrg?.id) {
        const { data } = await authClient.organization.getFullOrganization({
          query: { organizationId: activeOrg.id },
        });
        if (data) setFullOrg(data);
      }
    } catch (err: any) {
      alert(err.message || "Failed to cancel invitation");
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-amber-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "member":
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case "owner":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20";
      case "admin":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "member":
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredMembers = members.filter((member: any) => {
    const matchesSearch =
      member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Team Members
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your organization's team members and invitations
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as Role | "all")}
              className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Active Members
                </h2>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {filteredMembers.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredMembers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No members found</p>
                </div>
              ) : (
                filteredMembers.map((member: any) => (
                  <div
                    key={member.id}
                    className="p-6 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                          {member.user?.image ? (
                            <img
                              src={member.user.image}
                              alt={member.user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            getInitials(
                              member.user?.name || member.user?.email || ""
                            )
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {member.user?.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.user?.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              Joined{" "}
                              {new Date(member.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div
                          className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${getRoleBadgeClass(
                            member.role
                          )}`}
                        >
                          {getRoleIcon(member.role)}
                          <span className="text-sm font-medium capitalize">
                            {member.role}
                          </span>
                        </div>

                        {member.role !== "owner" && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowRoleMenu(
                                  showRoleMenu === member.id ? null : member.id
                                )
                              }
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </button>

                            {showRoleMenu === member.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowRoleMenu(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-20">
                                  <button
                                    onClick={() =>
                                      handleUpdateRole(member.id, "admin")
                                    }
                                    disabled={member.role === "admin"}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Shield className="w-4 h-4" />
                                    Make Admin
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateRole(member.id, "member")
                                    }
                                    disabled={member.role === "member"}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <User className="w-4 h-4" />
                                    Make Member
                                  </button>
                                  <hr className="my-1 border-border" />
                                  <button
                                    onClick={() =>
                                      handleRemoveMember(member.id)
                                    }
                                    className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remove Member
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Invitations */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Pending
                </h2>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full text-sm font-medium">
                  {pendingInvitations.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {pendingInvitations.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No pending invitations
                  </p>
                </div>
              ) : (
                pendingInvitations.map((invitation: any) => (
                  <div key={invitation.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {invitation.email}
                        </p>
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1 ${getRoleBadgeClass(
                            invitation.role as Role
                          )}`}
                        >
                          {getRoleIcon(invitation.role as Role)}
                          {invitation.role}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Expires{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-lg p-6 border border-primary/20">
            <h3 className="font-semibold text-foreground mb-4">
              Team Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Members
                </span>
                <span className="font-semibold text-foreground">
                  {members.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admins</span>
                <span className="font-semibold text-foreground">
                  {members.filter((m: any) => m.role === "admin").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pending Invites
                </span>
                <span className="font-semibold text-foreground">
                  {pendingInvitations.length}
                </span>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-500/10 dark:bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Team Permissions
                </p>
                <p className="text-xs text-muted-foreground">
                  Owners have full control. Admins can manage members and
                  settings. Members can view and create content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full border border-border animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-card-foreground">
                  Invite Team Member
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Role
                  </label>
                  <div className="space-y-2">
                    {(["member", "admin"] as Role[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => setInviteRole(role)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          inviteRole === role
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80 bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getRoleIcon(role)}
                            <div>
                              <p className="font-semibold text-foreground capitalize">
                                {role}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {role === "admin"
                                  ? "Can manage members and settings"
                                  : "Can view and create content"}
                              </p>
                            </div>
                          </div>
                          {inviteRole === role && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviting}
                  className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground border border-input rounded-lg hover:bg-accent transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail || inviting}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
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
