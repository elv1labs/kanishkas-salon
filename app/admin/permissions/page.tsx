"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, Users, ChevronDown, Check, X, RotateCcw, Save, Search, AlertCircle, CheckCircle } from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type UserRole = "ADMIN" | "OWNER" | "RECEPTIONIST" | "CLIENT";
type OverrideState = "inherit" | "grant" | "revoke";

interface UserStub {
  id: string; name: string; email: string; role: UserRole; isActive: boolean;
}
interface RoleData {
  allPermissions: readonly string[];
  rolePermissions: Record<UserRole, string[]>;
}
interface UserPermsData {
  user: UserStub;
  allPermissions: readonly string[];
  rolePermissions: string[];
  overrides: Record<string, boolean>;
  effectivePermissions: string[];
}

// ─────────────────────────────────────────────
// PERMISSION LABELS
// ─────────────────────────────────────────────
const PERM_META: Record<string, { label: string; group: string; desc: string }> = {
  manageUsers:       { label: "Manage Users",        group: "System",      desc: "Create, edit, deactivate user accounts" },
  manageSettings:    { label: "Manage Settings",     group: "System",      desc: "Edit business info & platform config" },
  viewAnalytics:     { label: "View Analytics",      group: "Business",    desc: "Access revenue reports & dashboards" },
  manageProducts:    { label: "Manage Products",     group: "Business",    desc: "Add, edit, remove shop products" },
  manageOrders:      { label: "Manage Orders",       group: "Business",    desc: "View & process shop orders" },
  manageContent:     { label: "Manage Content",      group: "Business",    desc: "Edit CMS pages & site content" },
  manageAppointments:{ label: "Manage Appointments", group: "Operations",  desc: "Book, edit, cancel any appointment" },
  manageClients:     { label: "Manage Clients",      group: "Operations",  desc: "View & manage client profiles" },
  manageBlog:        { label: "Manage Blog",         group: "Content",     desc: "Edit & publish all blog posts" },
  createBlog:        { label: "Create Blog Posts",   group: "Content",     desc: "Author and draft blog posts" },
  manageGallery:     { label: "Manage Gallery",      group: "Content",     desc: "Upload & manage gallery images" },
  createGallery:     { label: "Upload Gallery",      group: "Content",     desc: "Upload images to gallery" },
  bookAppointments:  { label: "Book Appointments",   group: "Client",      desc: "Reserve appointments for self" },
  placeOrders:       { label: "Place Orders",        group: "Client",      desc: "Buy products from shop" },
  viewOwnData:       { label: "View Own Data",       group: "Client",      desc: "Access own profile, loyalty & orders" },
};

const GROUPS = ["System", "Business", "Operations", "Content", "Client"];

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string; dot: string }> = {
  ADMIN:       { bg: "#7C3AED20", text: "#7C3AED", border: "#7C3AED40", dot: "#7C3AED" },
  OWNER:       { bg: "#D9770020", text: "#D97700", border: "#D9770040", dot: "#D97700" },
  RECEPTIONIST:{ bg: "#0369A120", text: "#0369A1", border: "#0369A140", dot: "#0369A1" },
  CLIENT:      { bg: "#05966920", text: "#059669", border: "#05966940", dot: "#059669" },
};

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 18px", borderRadius: 10,
      background: type === "success" ? "#ECFDF5" : "#FEF2F2",
      border: `1px solid ${type === "success" ? "#10B981" : "#EF4444"}`,
      color: type === "success" ? "#065F46" : "#991B1B",
      fontSize: 13, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 4, color: "inherit", display: "flex" }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOGGLE CHIP
// ─────────────────────────────────────────────
function PermToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 99,
        border: "none", cursor: "pointer",
        background: on ? "#10B981" : "#E5E7EB",
        position: "relative", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────
// ROLE PERMISSIONS PANEL
// ─────────────────────────────────────────────
function RolePermissionsPanel() {
  const ROLES: UserRole[] = ["ADMIN", "OWNER", "RECEPTIONIST", "CLIENT"];
  const [selectedRole, setSelectedRole] = useState<UserRole>("ADMIN");
  const [data, setData] = useState<RoleData | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/permissions/roles");
    if (res.ok) {
      const d: RoleData = await res.json();
      setData(d);
      setDraft(d.rolePermissions[selectedRole] ?? []);
    }
  }, [selectedRole]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (data) setDraft(data.rolePermissions[selectedRole] ?? []);
  }, [selectedRole, data]);

  const togglePerm = (perm: string) => {
    setDraft((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/permissions/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, permissions: draft }),
      });
      if (res.ok) {
        await load();
        setToast({ message: `${selectedRole} permissions saved.`, type: "success" });
      } else {
        setToast({ message: "Failed to save.", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { if (data) setDraft(data.rolePermissions[selectedRole] ?? []); };
  const isDirty = data ? JSON.stringify([...draft].sort()) !== JSON.stringify([...(data.rolePermissions[selectedRole] ?? [])].sort()) : false;
  const col = selectedRole ? ROLE_COLORS[selectedRole] : ROLE_COLORS.ADMIN;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Role selector tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {ROLES.map((role) => {
          const c = ROLE_COLORS[role];
          const active = role === selectedRole;
          return (
            <button key={role} onClick={() => setSelectedRole(role)} style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              letterSpacing: "0.04em",
              border: `1.5px solid ${active ? c.border : "rgba(0,0,0,0.1)"}`,
              background: active ? c.bg : "#fff",
              color: active ? c.text : "#6B7280",
              cursor: "pointer", transition: "all 0.18s",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? c.dot : "#D1D5DB" }} />
              {role}
            </button>
          );
        })}
      </div>

      {/* Permission groups */}
      {!data ? (
        <div style={{ color: "#9CA3AF", fontSize: 14, padding: "32px 0", textAlign: "center" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {GROUPS.map((group) => {
            const perms = (data.allPermissions as string[]).filter((p) => PERM_META[p]?.group === group);
            if (!perms.length) return null;
            return (
              <div key={group}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>
                  {group}
                </p>
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  {perms.map((perm, i) => {
                    const meta = PERM_META[perm];
                    const on = draft.includes(perm);
                    return (
                      <div key={perm} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "13px 18px",
                        borderBottom: i < perms.length - 1 ? "1px solid #F3F4F6" : "none",
                        background: on ? `${col.bg}60` : "#fff",
                        transition: "background 0.15s",
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: on ? col.text : "#374151" }}>
                            {meta?.label ?? perm}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#9CA3AF" }}>{meta?.desc}</p>
                        </div>
                        <PermToggle on={on} onChange={() => togglePerm(perm)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            {isDirty && (
              <button onClick={reset} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 8, fontSize: 13,
                border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280",
                cursor: "pointer",
              }}>
                <RotateCcw size={13} /> Discard
              </button>
            )}
            <button onClick={save} disabled={!isDirty || saving} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "none",
              background: isDirty ? col.text : "#E5E7EB",
              color: isDirty ? "#fff" : "#9CA3AF",
              cursor: isDirty ? "pointer" : "not-allowed",
              transition: "all 0.18s",
            }}>
              <Save size={13} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// USER PERMISSIONS PANEL
// ─────────────────────────────────────────────
function UserPermissionsPanel() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserStub[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserStub | null>(null);
  const [userPerms, setUserPerms] = useState<UserPermsData | null>(null);
  const [draft, setDraft] = useState<Record<string, OverrideState>>({});
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Search users
  useEffect(() => {
    if (!search.trim()) { setUsers([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/users?search=${encodeURIComponent(search)}&limit=8`);
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users ?? d.data?.users ?? []);
        setShowDropdown(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const selectUser = async (user: UserStub) => {
    setSelectedUser(user);
    setSearch(user.name);
    setShowDropdown(false);
    const res = await fetch(`/api/admin/permissions/users/${user.id}`);
    if (res.ok) {
      const d: UserPermsData = await res.json();
      setUserPerms(d);
      // Build draft from existing overrides
      const initial: Record<string, OverrideState> = {};
      for (const perm of d.allPermissions) {
        if (d.overrides[perm] === true)  initial[perm] = "grant";
        else if (d.overrides[perm] === false) initial[perm] = "revoke";
        else initial[perm] = "inherit";
      }
      setDraft(initial);
    }
  };

  const setOverride = (perm: string, state: OverrideState) => {
    setDraft((prev) => ({ ...prev, [perm]: state }));
  };

  const getEffective = (perm: string): boolean => {
    if (!userPerms) return false;
    const override = draft[perm];
    if (override === "grant") return true;
    if (override === "revoke") return false;
    return userPerms.rolePermissions.includes(perm);
  };

  const save = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const overrides = Object.entries(draft)
        .filter(([, state]) => state !== "inherit")
        .map(([permission, state]) => ({ permission, granted: state === "grant" }));
      const res = await fetch(`/api/admin/permissions/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (res.ok) {
        const d = await res.json();
        if (userPerms) {
          setUserPerms({ ...userPerms, effectivePermissions: d.effectivePermissions });
        }
        setToast({ message: `Overrides saved for ${selectedUser.name}.`, type: "success" });
      } else {
        setToast({ message: "Failed to save overrides.", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!userPerms) return;
    const initial: Record<string, OverrideState> = {};
    for (const perm of userPerms.allPermissions) {
      if (userPerms.overrides[perm] === true) initial[perm] = "grant";
      else if (userPerms.overrides[perm] === false) initial[perm] = "revoke";
      else initial[perm] = "inherit";
    }
    setDraft(initial);
  };

  const isDirty = userPerms !== null && Object.entries(draft).some(([perm, state]) => {
    const existing = userPerms.overrides[perm];
    if (state === "grant") return existing !== true;
    if (state === "revoke") return existing !== false;
    return existing !== undefined;
  });

  const col = selectedUser ? ROLE_COLORS[selectedUser.role] : ROLE_COLORS.CLIENT;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* User search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px",
          background: "#fff",
        }}>
          <Search size={15} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search && setShowDropdown(true)}
            placeholder="Search user by name or email…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, color: "#111827", background: "transparent" }}
          />
          {search && <button onClick={() => { setSearch(""); setSelectedUser(null); setUserPerms(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={14} /></button>}
        </div>

        {showDropdown && users.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
            background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)", overflow: "hidden",
          }}>
            {users.map((u) => {
              const c = ROLE_COLORS[u.role];
              return (
                <button key={u.id} onClick={() => selectUser(u)} style={{
                  width: "100%", padding: "11px 16px", border: "none", background: "#fff",
                  textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  borderBottom: "1px solid #F9FAFB", transition: "background 0.12s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: c.bg,
                    border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: c.text, flexShrink: 0,
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                  </div>
                  <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{u.role}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Permissions grid */}
      {!selectedUser && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
          <Users size={36} style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 14 }}>Search for a user to manage their permissions</p>
        </div>
      )}

      {selectedUser && userPerms && (
        <div>
          {/* User badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
            background: col.bg, border: `1px solid ${col.border}`, borderRadius: 10, marginBottom: 20,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", border: `1.5px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: col.text }}>
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{selectedUser.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>{selectedUser.email}</p>
            </div>
            <span style={{ marginLeft: "auto", padding: "3px 11px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#fff", color: col.text, border: `1px solid ${col.border}` }}>{selectedUser.role}</span>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "Inherit role default", color: "#9CA3AF" },
              { label: "Override: Grant", color: "#10B981" },
              { label: "Override: Revoke", color: "#EF4444" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#6B7280" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Groups */}
          {GROUPS.map((group) => {
            const perms = (userPerms.allPermissions as string[]).filter((p) => PERM_META[p]?.group === group);
            if (!perms.length) return null;
            return (
              <div key={group} style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>{group}</p>
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  {perms.map((perm, i) => {
                    const meta = PERM_META[perm];
                    const override = draft[perm] ?? "inherit";
                    const effective = getEffective(perm);
                    const fromRole = userPerms.rolePermissions.includes(perm);
                    return (
                      <div key={perm} style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "12px 18px",
                        borderBottom: i < perms.length - 1 ? "1px solid #F3F4F6" : "none",
                        background: override !== "inherit" ? (override === "grant" ? "#F0FDF4" : "#FEF2F2") : "#fff",
                      }}>
                        {/* Status dot */}
                        <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: effective ? "#10B981" : "#E5E7EB" }} />

                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "#374151" }}>{meta?.label ?? perm}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#9CA3AF" }}>
                            {meta?.desc} &nbsp;·&nbsp;
                            <span style={{ color: fromRole ? "#10B981" : "#9CA3AF" }}>
                              {fromRole ? "In role" : "Not in role"}
                            </span>
                          </p>
                        </div>

                        {/* Override pills */}
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {(["inherit", "grant", "revoke"] as OverrideState[]).map((state) => {
                            const active = override === state;
                            const colors: Record<OverrideState, string> = { inherit: "#6B7280", grant: "#10B981", revoke: "#EF4444" };
                            return (
                              <button key={state} onClick={() => setOverride(perm, state)} style={{
                                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                                border: `1.5px solid ${active ? colors[state] : "#E5E7EB"}`,
                                background: active ? `${colors[state]}18` : "transparent",
                                color: active ? colors[state] : "#9CA3AF",
                                cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                              }}>
                                {state === "inherit" ? <RotateCcw size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> : state === "grant" ? <Check size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> : <X size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />}
                                {state}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            {isDirty && (
              <button onClick={reset} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 8, fontSize: 13,
                border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", cursor: "pointer",
              }}>
                <RotateCcw size={13} /> Discard
              </button>
            )}
            <button onClick={save} disabled={!isDirty || saving} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "none",
              background: isDirty ? col.text : "#E5E7EB",
              color: isDirty ? "#fff" : "#9CA3AF",
              cursor: isDirty ? "pointer" : "not-allowed", transition: "all 0.18s",
            }}>
              <Save size={13} /> {saving ? "Saving…" : "Save Overrides"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function PermissionsPage() {
  const [tab, setTab] = useState<"roles" | "users">("roles");

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#7C3AED18", border: "1px solid #7C3AED30", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={18} color="#7C3AED" />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#111827", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Permission Manager
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: "#6B7280" }}>
          Manage role-wide permissions and set individual user overrides.
          Changes take effect within 60 seconds across all sessions.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 28, background: "#F3F4F6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { key: "roles", icon: <Shield size={14} />, label: "Role Permissions" },
          { key: "users", icon: <Users size={14} />, label: "User Overrides" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as "roles" | "users")} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 18px", borderRadius: 7, fontSize: 13, fontWeight: 500,
            border: "none", cursor: "pointer",
            background: tab === t.key ? "#fff" : "transparent",
            color: tab === t.key ? "#111827" : "#6B7280",
            boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.18s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: "#FAFAFA", borderRadius: 14, border: "1px solid #E5E7EB", padding: "24px 28px" }}>
        {tab === "roles" ? <RolePermissionsPanel /> : <UserPermissionsPanel />}
      </div>
    </div>
  );
}
