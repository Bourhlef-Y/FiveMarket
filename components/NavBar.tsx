"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Plus } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Logo from "@/components/Logo"
import CartIcon from "@/components/CartIcon"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { RoleGuard } from "@/components/RoleGuard"

export default function NavBar() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <nav className="bg-zinc-900 text-zinc-100 p-4 sticky top-0 z-50 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="lg" />
          <div className="animate-pulse bg-zinc-800 h-8 w-8 rounded-full"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-zinc-900 text-zinc-100 p-4 sticky top-0 z-50 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Logo size="lg" />

        {/* Navigation Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            href="/" 
            className="text-zinc-400 hover:text-[#FF7101] transition-colors"
          >
            Accueil
          </Link>
          <Link 
            href="/marketplace" 
            className="text-zinc-400 hover:text-[#FF7101] transition-colors"
          >
            Marketplace
          </Link>
          <Link 
            href="/sell" 
            className="text-zinc-400 hover:text-[#FF7101] transition-colors"
          >
            Vendre
          </Link>
          <Link 
            href="/support" 
            className="text-zinc-400 hover:text-[#FF7101] transition-colors"
          >
            Support
          </Link>
          {profile?.role === 'seller' && (
            <Link 
              href="/seller/products" 
              className="text-zinc-400 hover:text-[#FF7101] transition-colors"
            >
              Mes Produits
            </Link>
          )}
          <CartIcon />
        </div>

        {/* Actions utilisateur */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Bouton vendre (uniquement pour sellers/admins) */}
              <RoleGuard requiredRole="seller">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/sell/new')}
                  className="hidden md:flex items-center gap-2 border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une ressource
                </Button>
              </RoleGuard>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 bg-slate-900">
                      <AvatarImage src={profile?.avatar || undefined} alt={user.email || ''} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{profile?.username || 'Utilisateur'}</p>
                      <p className="text-xs leading-none text-zinc-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem 
                    className="text-zinc-400 focus:text-white focus:bg-zinc-800 cursor-pointer"
                    onClick={() => router.push('/account')}
                  >
                    Mon compte
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem 
                      className="text-zinc-400 focus:text-white focus:bg-zinc-800 cursor-pointer"
                      onClick={() => router.push('/admin/users')}
                    >
                      Tableau de bord Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-zinc-400 focus:text-white focus:bg-zinc-800 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="text-zinc-400 hover:text-[#FF7101] hover:bg-zinc-800"
                onClick={() => router.push('/auth/sign-in')}
              >
                Se connecter
              </Button>
              <Button 
                className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                onClick={() => router.push('/auth/sign-up')}
              >
                S'inscrire
              </Button>
            </>
          )}

          {/* Menu mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col space-y-4 mt-8">
                <Link 
                  href="/" 
                  className="text-zinc-400 hover:text-[#FF7101] transition-colors text-lg"
                >
                  Accueil
                </Link>
                <Link 
                  href="/marketplace" 
                  className="text-zinc-400 hover:text-[#FF7101] transition-colors text-lg"
                >
                  Marketplace
                </Link>
                <Link 
                  href="/developpers" 
                  className="text-zinc-400 hover:text-[#FF7101] transition-colors text-lg"
                >
                  Développeurs
                </Link>
                <Link 
                  href="/support" 
                  className="text-zinc-400 hover:text-[#FF7101] transition-colors text-lg"
                >
                  Support
                </Link>
                {profile?.role === 'seller' && (
                  <Link 
                    href="/seller/products" 
                    className="text-zinc-400 hover:text-[#FF7101] transition-colors text-lg"
                  >
                    Mes Produits
                  </Link>
                )}
                <Link 
                  href="/cart" 
                  className="text-zinc-400 hover:text-[#FF7101] transition-colors text-lg"
                >
                  Panier
                </Link>
                {user && (
                  <>
                    <RoleGuard requiredRole="seller">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/sell/new')}
                        className="justify-start border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une ressource
                      </Button>
                    </RoleGuard>
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/account')}
                      className="justify-start text-zinc-400 hover:text-white"
                    >
                      Mon compte
                    </Button>
                    {profile?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        onClick={() => router.push('/admin/users')}
                        className="justify-start text-zinc-400 hover:text-white"
                      >
                        Tableau de bord Admin
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="justify-start text-zinc-400 hover:text-white"
                    >
                      Se déconnecter
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}