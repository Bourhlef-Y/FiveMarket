"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthMethod } from "@/hooks/useAuthMethod";

export default function DebugBox() {
  const { user, profile } = useAuth();
  const { method } = useAuthMethod();

  if (!user) return null;

  return (
    <div className="fixed bottom-20 left-4 bg-black/50 text-white p-4 rounded-lg text-xs font-mono z-50 backdrop-blur-sm">
      <div className="space-y-2">
        <div className="text-[#FF7101]">Debug Info</div>
        <div>
          <span className="text-zinc-400">Email:</span> {user.email}
        </div>
        <div>
          <span className="text-zinc-400">Username:</span> {profile?.username || 'Non défini'}
        </div>
        <div>
          <span className="text-zinc-400">Rôle:</span> {profile?.role || 'Non défini'}
        </div>
        <div>
          <span className="text-zinc-400">Auth:</span> {method}
        </div>
      </div>
    </div>
  );
}
