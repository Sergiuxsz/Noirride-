import React, { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { Shield, Search, UserCheck, UserX, Trash2, AlertTriangle, CheckCircle2, Loader2, Crown } from 'lucide-react';
import type { UserRole } from '../../types';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      setErrorMsg(err.message || t('admin.errorFetching', 'Error fetching user list from the executive system.'));
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
      setSuccessMsg(t('admin.promoteSuccess', 'User {{name}} was successfully promoted to Executive Administrator.', { name: targetUser.fullName }));
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: 'admin', isAdminRoleDoc: true } : u))
      );
    } catch (err: any) {
      console.error('[ADMIN ROLES] Promote error:', err);
      setErrorMsg(err.message || t('admin.promoteError', 'Error promoting user {{name}}.', { name: targetUser.fullName }));
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
      setSuccessMsg(t('admin.revokeSuccess', 'Administrator privileges revoked for {{name}}.', { name: targetUser.fullName }));
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: 'client', isAdminRoleDoc: false } : u))
      );
    } catch (err: any) {
      console.error('[ADMIN ROLES] Revoke error:', err);
      setErrorMsg(err.message || t('admin.revokeError', 'Error revoking privileges for {{name}}.', { name: targetUser.fullName }));
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
      setSuccessMsg(t('admin.deleteSuccess', 'User account {{name}} was instantly deleted from the system.', { name: targetName }));
      setUsers((prev) => prev.filter((u) => u.uid !== targetUid));
    } catch (err: any) {
      console.error('[ADMIN ROLES] Delete error:', err);
      setErrorMsg(err.message || t('admin.deleteError', 'Error deleting account {{name}}.', { name: targetName }));
    } finally {
      setActionLoadingUid(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in bg-primary text-content">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        {/* Header Section */}
        <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gold-500">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-semibold tracking-widest uppercase">{t('admin.secretProtocol', 'Secret Executive Protocol')}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-content">
              {t('admin.title', 'Executive Roles Administration')}
            </h1>
          </div>
          <div className="text-xs text-muted bg-secondary border border-border px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('admin.realtimeActive', 'Real-time onSnapshot Active')}</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.searchPlaceholder', 'Search users by name, email or phone number...')}
              className="w-full pl-12 pr-28 py-3.5 bg-secondary border border-border rounded-xl text-sm text-content placeholder-muted focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 px-5 py-2 bg-gradient-to-r from-gold-500 to-[#F3E5AB] text-black font-semibold text-xs rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
            >
              {isLoading ? t('admin.searching', 'Searching...') : t('admin.search', 'Search')}
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
          <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
            {t('admin.searchResults', 'Search Results')} ({users.length})
          </h2>

          {isLoading && users.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
              <p className="text-xs tracking-wider uppercase font-serif">{t('admin.fetching', 'Fetching user dossiers...')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center bg-secondary/50 border border-white/5 rounded-2xl text-muted text-sm">
              {t('admin.noUsers', 'No users found for the given criteria.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {users.map((u) => {
                const isAdmin = u.role === 'admin' || u.isAdminRoleDoc;
                const isWorking = actionLoadingUid === u.uid;

                return (
                  <div
                    key={u.uid}
                    className={`bg-secondary border transition-all rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isAdmin ? 'border-gold-500/40 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'border-border hover:border-border/50'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-bold text-content truncate">
                          {u.fullName || t('admin.executiveClient', 'Executive Client')}
                        </span>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/15 text-gold-500 border border-gold-500/30">
                            <Crown className="w-3.5 h-3.5" />
                            {t('admin.adminExecutive', 'Admin Executive')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 text-muted border border-border">
                            {t('admin.clientVip', 'Client VIP')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                        {u.email && <span>📧 {u.email}</span>}
                        {u.phone && <span>📞 {u.phone}</span>}
                        <span className="text-[11px] text-muted">UID: {u.uid.substring(0, 12)}...</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      {!isAdmin ? (
                        <button
                          onClick={() => handlePromote(u)}
                          disabled={isWorking}
                          className="px-4 py-2 bg-gradient-to-r from-gold-500 to-[#F3E5AB] text-black text-xs font-semibold rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                          {t('admin.promoteToAdmin', 'Promote to Admin')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevoke(u)}
                          disabled={isWorking}
                          className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 text-muted hover:text-red-400 border border-border hover:border-red-500/30 text-xs font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                          {t('admin.revokeAdmin', 'Revoke Admin')}
                        </button>
                      )}

                      <button
                        onClick={() => setUserToDelete(u)}
                        disabled={isWorking}
                        title={t('admin.deleteAccountInstantly', 'Delete account instantly')}
                        className="p-2 bg-black/5 dark:bg-white/5 hover:bg-red-500/15 text-muted hover:text-red-400 border border-border hover:border-red-500/30 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
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
            <div className="bg-secondary border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] space-y-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-content">
                  {t('admin.confirmDelete', 'Confirm Account Deletion')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {t('admin.deleteConfirmMsg', 'Are you sure you want to instantly delete the account for')} <strong className="text-content">{userToDelete.fullName}</strong> ({userToDelete.email})? {t('admin.deleteWarning', 'This action will revoke all real-time session rights.')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-content text-sm font-medium rounded-xl transition-all border border-border"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  {t('admin.deleteInstantly', 'Delete Instantly')}
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
