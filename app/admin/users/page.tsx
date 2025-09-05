"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import UserTable from '@/components/admin/UserTable';
import { toast } from '@/hooks/useToast';

interface User {
  id: string;
  username: string | null;
  avatar: string | null;
  role: 'buyer' | 'seller' | 'admin';
  created_at: string;
  discord_username: string | null;
  country: string | null;
  auth_email: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const pageSize = 10;

  const loadUsers = async (page: number, search: string = '') => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur serveur');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du chargement des utilisateurs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(currentPage, searchTerm);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    loadUsers(1, term);
  };

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-white">Gestion des Utilisateurs</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-zinc-400 hover:text-[#FF7101]"
          onClick={() => router.push('/')}
        >
          <Home className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101]"></div>
          </div>
        ) : (
          <UserTable
            users={users}
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            pageSize={pageSize}
          />
        )}
      </CardContent>
    </Card>
  );
}