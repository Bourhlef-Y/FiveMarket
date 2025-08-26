"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar: string | null;
  role: 'buyer' | 'seller' | 'admin';
  created_at: string;
  auth_email: string | null;
  discord_username: string | null;
  country: string | null;
}

interface UserTableProps {
  users: User[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  pageSize?: number;
}

export default function UserTable({
  users,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  pageSize = 10
}: UserTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Admin</Badge>;
      case 'seller':
        return <Badge className="bg-[#FF7101]">Vendeur</Badge>;
      default:
        return <Badge className="bg-zinc-500">Utilisateur</Badge>;
    }
  };

  const getCountryFlag = (countryCode: string | null) => {
    if (!countryCode) return null;
    return countryCode.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white"
        />
        <Button
          onClick={handleSearch}
          className="bg-[#FF7101] hover:bg-[#FF7101]/90"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-800/50">
            <TableRow>
              <TableHead className="text-zinc-400">Utilisateur</TableHead>
              <TableHead className="text-zinc-400">Discord</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Pays</TableHead>
              <TableHead className="text-zinc-400">Rôle</TableHead>
              <TableHead className="text-zinc-400">Créé le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => router.push(`/admin/users/${user.id}`)}
              >
                <TableCell className="font-medium text-white">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {user.username || 'Sans nom'}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400">
                  {user.discord_username || '-'}
                </TableCell>
                <TableCell className="text-zinc-400">
                  {user.auth_email || '-'}
                </TableCell>
                <TableCell className="text-zinc-400">
                  {getCountryFlag(user.country) || '-'}
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="text-zinc-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          {totalCount} utilisateur{totalCount > 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-zinc-700 text-zinc-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-zinc-400">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-zinc-700 text-zinc-400"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}