"use client";

import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, Users, UserPlus, ShoppingBag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  // Protection de la route admin
  if (!loading && (!profile || profile.role !== 'admin')) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#FF7101]"></div>
      </div>
    );
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* En-tête */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LayoutDashboard className="h-6 w-6 text-[#FF7101]" />
              <h1 className="text-xl font-semibold text-white">Dashboard Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-400">
                Connecté en tant que {profile.username || user?.email}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-400 hover:text-[#FF7101]"
                onClick={() => router.push('/')}
              >
                <Home className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <div className="p-2">
                <nav className="space-y-2">
                  <Link href="/admin" className="w-full">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive('/admin')
                          ? 'bg-[#FF7101] text-white hover:bg-[#FF7101]/90'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/users" className="w-full">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive('/admin/users')
                          ? 'bg-[#FF7101] text-white hover:bg-[#FF7101]/90'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Utilisateurs
                    </Button>
                  </Link>
                  <Link href="/admin/sellers" className="w-full">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive('/admin/sellers')
                          ? 'bg-[#FF7101] text-white hover:bg-[#FF7101]/90'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Demandes Vendeur
                    </Button>
                  </Link>
                  <Link href="/admin/products" className="w-full">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive('/admin/products')
                          ? 'bg-[#FF7101] text-white hover:bg-[#FF7101]/90'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Produits
                    </Button>
                  </Link>
                </nav>
              </div>
            </Card>
          </aside>

          {/* Contenu principal */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}