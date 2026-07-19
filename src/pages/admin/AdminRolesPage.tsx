import React, { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { Shield, Search, UserCheck, UserX, Trash2, AlertTriangle, CheckCircle2, Loader2, Crown } from 'lucide-react';
import type { UserRole } from '../../types';

interface AdminUserRow {
  uid: string;
  email?: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isAdminRoleDoc: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export const AdminRolesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Account Deletion Confirmation
  const [userToDelete, setUserToDelete] = useState<AdminUserRow | null>(null);

  const fetchUsers = useCallback(async (query = '') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const searchFn = httpsCallable<{ query: string }, { users: AdminUserRow[] }>(functions, 'adminSearchUsers');
      const res = await searchFn({ query });
      if (res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('[ADMIN ROLES] Fetch users error:', err);
      setErrorMsg(err.message || 'Eroare la preluarea listei de utilizatori din sistemul executive.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers('');
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handlePromote = async (targetUser: AdminUserRow) => {
    setActionLoadingUid(targetUser.uid);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const promoteFn = httpsCallable<{ targetUid: string }, { success: boolean; message: string }>(functions, 'adminPromoteUser');
      await promoteFn({ targetUid: targetUser.uid });
      setSuccessMsg(`Utilizatorul ${targetUser.fullName} a fost promovat ca Administrator Executive cu succes.`);
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: 'admin', isAdminRoleDoc: true } : u))
      );
    } catch (err: any) {
      console.error('[ADMIN ROLES] Promote error:', err);
      setErrorMsg(err.message || `Eroare la promovarea utilizatorului ${targetUser.fullName}.`);
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleRevoke = async (targetUser: AdminUserRow) => {
    setActionLoadingUid(targetUser.uid);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const revokeFn = httpsCallable<{ targetUid: string }, { success: boolean; message: string }>(functions, 'adminRevokeUserRole');
      await revokeFn({ targetUid: targetUser.uid });
      setSuccessMsg(`Privilegiile de administrator au fost revocate pentru ${targetUser.fullName}.`);
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: 'client', isAdminRoleDoc: false } : u))
      );
    } catch (err: any) {
      console.error('[ADMIN ROLES] Revoke error:', err);
      setErrorMsg(err.message || `Eroare la revocarea privilegiilor pentru ${targetUser.fullName}.`);
    } finally {
      setActionLoadingUid(null);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!userToDelete) return;
    const targetUid = userToDelete.uid;
    const targetName = userToDelete.fullName;

    setActionLoadingUid(targetUid);
    setUserToDelete(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const deleteFn = httpsCallable<{ targetUid: string }, { success: boolean; message: string }>(functions, 'adminDeleteAccount');
      await deleteFn({ targetUid });
      setSuccessMsg(`Contul utilizatorului ${targetName} a fost șters instantaneu din sistem.`);
      setUsers((prev) => prev.filter((u) => u.uid !== targetUid));
    } catch (err: any) {
      console.error('[ADMIN ROLES] Delete error:', err);
      setErrorMsg(err.message || `Eroare la ștergerea contului ${targetName}.`);
    } finally {
      setActionLoadingUid(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in bg-[#0A0B0E] text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        {/* Header Section */}
        <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-semibold tracking-widest uppercase">Secret Executive Protocol</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              Administrare Roluri Executive
            </h1>
          </div>
          <div className="text-xs text-[#94A3B8] bg-[#12141C] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-time onSnapshot Active</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută utilizatori după nume, email sau număr de telefon..."
              className="w-full pl-12 pr-28 py-3.5 bg-[#12141C] border border-white/10 rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#0A0B0E] font-semibold text-xs rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Se caută...' : 'Caută'}
            </button>
          </div>
        </form>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* User List Table / Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wider text-[#94A3B8] uppercase">
            Rezultate Căutare ({users.length})
          </h2>

          {isLoading && users.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#94A3B8]">
              <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
              <p className="text-xs tracking-wider uppercase font-serif">Se preiau dosarele utilizatorilor...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center bg-[#12141C]/50 border border-white/5 rounded-2xl text-[#94A3B8] text-sm">
              Nu a fost găsit niciun utilizator pentru criteriile căutate.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {users.map((u) => {
                const isAdmin = u.role === 'admin' || u.isAdminRoleDoc;
                const isWorking = actionLoadingUid === u.uid;

                return (
                  <div
                    key={u.uid}
                    className={`bg-[#12141C] border transition-all rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isAdmin ? 'border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-bold text-[#F8FAFC] truncate">
                          {u.fullName || 'Executive Client'}
                        </span>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                            <Crown className="w-3.5 h-3.5" />
                            Admin Executive
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-[#94A3B8] border border-white/10">
                            Client VIP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#94A3B8] flex-wrap">
                        {u.email && <span>📧 {u.email}</span>}
                        {u.phone && <span>📞 {u.phone}</span>}
                        <span className="text-[11px] text-[#64748B]">UID: {u.uid.substring(0, 12)}...</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      {!isAdmin ? (
                        <button
                          onClick={() => handlePromote(u)}
                          disabled={isWorking}
                          className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#0A0B0E] text-xs font-semibold rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                          Promovează la Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevoke(u)}
                          disabled={isWorking}
                          className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-[#94A3B8] hover:text-red-400 border border-white/10 hover:border-red-500/30 text-xs font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                          Revocă Admin
                        </button>
                      )}

                      <button
                        onClick={() => setUserToDelete(u)}
                        disabled={isWorking}
                        title="Șterge contul instantaneu"
                        className="p-2 bg-white/5 hover:bg-red-500/15 text-[#64748B] hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation Modal for Account Deletion */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-[#12141C] border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] space-y-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-[#F8FAFC]">
                  Confirmă Ștergerea Contului
                </h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">
                  Ești sigur că dorești să ștergi instantaneu contul utilizatorului <strong className="text-white">{userToDelete.fullName}</strong> ({userToDelete.email})? Această acțiune va anula toate drepturile de sesiune în timp real.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[#F8FAFC] text-sm font-medium rounded-xl transition-all border border-white/10"
                >
                  Anulează
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Șterge Instantaneu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRolesPage;
