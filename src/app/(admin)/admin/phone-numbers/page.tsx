"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Phone, Users, UserCheck, Loader2, Search, RefreshCw, CheckCircle2 } from "lucide-react";

interface AdminPhoneNumber {
  id: string;
  phoneNumber: string;
  countryCode: string;
  type: string;
  status: string;
  agentId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  purchasedAt?: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminPhoneNumbersPage() {
  const [numbers, setNumbers] = useState<AdminPhoneNumber[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Reassignment Modal State
  const [reassignTargetNum, setReassignTargetNum] = useState<AdminPhoneNumber | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reassigning, setReassigning] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [numRes, userRes] = await Promise.all([
        fetch("/api/admin/phone-numbers"),
        fetch("/api/admin/users"),
      ]);

      if (numRes.ok) {
        const numData = await numRes.json();
        setNumbers(Array.isArray(numData) ? numData : []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : []);
      }
    } catch (e) {
      console.error("[Admin Phone Numbers Fetch Error]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReassign = async () => {
    if (!reassignTargetNum || !selectedUserId) return;

    setReassigning(true);
    try {
      const res = await fetch("/api/admin/phone-numbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: reassignTargetNum.id,
          targetUserId: selectedUserId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to reassign phone number");
      }

      setReassignTargetNum(null);
      setSelectedUserId("");
      fetchData();
    } catch (err: any) {
      alert(`Reassignment Error: ${err.message}`);
    } finally {
      setReassigning(false);
    }
  };

  const filteredNumbers = numbers.filter(
    (n) =>
      n.phoneNumber.includes(search) ||
      n.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      n.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Phone Numbers Management"
        description="Inspect all purchased Telnyx numbers across all platform accounts and reassign numbers between users as required."
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--subtle-text)]" />
          <input
            type="text"
            placeholder="Search by phone number, owner email, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="premium-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Country</th>
              <th>Type</th>
              <th>Owner User</th>
              <th>Assigned Agent</th>
              <th>Status</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)] mx-auto" />
                </td>
              </tr>
            ) : filteredNumbers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[var(--muted-text)] text-sm">
                  No phone numbers found.
                </td>
              </tr>
            ) : (
              filteredNumbers.map((num) => (
                <tr key={num.id}>
                  <td className="font-bold text-[var(--foreground)]">{num.phoneNumber}</td>
                  <td>{num.countryCode}</td>
                  <td className="capitalize">{num.type}</td>
                  <td>
                    <div>
                      <div className="font-semibold text-xs text-[var(--foreground)]">{num.userName}</div>
                      <div className="text-[11px] text-[var(--subtle-text)]">{num.userEmail}</div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-[var(--muted-text)]">
                      {num.agentId || "None"}
                    </span>
                  </td>
                  <td>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {num.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setReassignTargetNum(num);
                        setSelectedUserId(num.userId);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--brand-500)] text-[var(--brand-btn-text)] text-xs font-semibold hover:opacity-90 cursor-pointer flex items-center gap-1"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Reassign User
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REASSIGN USER MODAL */}
      {reassignTargetNum && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl max-w-md w-full space-y-5">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Reassign Phone Number</h3>
            <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-1 text-sm">
              <div className="text-[var(--subtle-text)] text-xs">Target Number:</div>
              <div className="font-bold text-base text-[var(--foreground)]">{reassignTargetNum.phoneNumber}</div>
              <div className="text-xs text-[var(--muted-text)]">Current Owner: {reassignTargetNum.userEmail}</div>
            </div>

            <div>
              <label className="form-label">Select New User Account</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Choose Target User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReassignTargetNum(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={reassigning || !selectedUserId}
                className="flex-1 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {reassigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
