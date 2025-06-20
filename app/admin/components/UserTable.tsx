"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminUser } from '../types/user';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Mail, Phone, Calendar, CheckCircle, XCircle, Clock, Shield, UserPlus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface UserTableProps {
  users: AdminUser[];
  onUserUpdated?: () => void;
}

export function UserTable({ users, onUserUpdated }: UserTableProps) {
  const [promotingUsers, setPromotingUsers] = useState<Set<string>>(new Set());
  const [resettingPassword, setResettingPassword] = useState<Set<string>>(new Set());

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getStatusBadge = (user: AdminUser) => {
    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
    const isVerified = user.email_confirmed_at;
    
    if (isBanned) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-red-100 text-red-800">
          <XCircle className="h-3 w-3" />
          Banned
        </Badge>
      );
    }
    
    if (isVerified) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800">
        <Clock className="h-3 w-3" />
        Unverified
      </Badge>
    );
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-purple-100 text-purple-800">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-600">
        User
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLastSignIn = (lastSignIn: string | null) => {
    if (!lastSignIn) return 'Never';
    const date = new Date(lastSignIn);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(lastSignIn);
  };

  const handleMakeAdmin = async (userId: string) => {
    setPromotingUsers(prev => new Set(prev).add(userId));
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/make-admin`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to promote user to admin');
      }
      
      toast.success('User successfully promoted to admin');
      onUserUpdated?.();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to promote user');
    } finally {
      setPromotingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleResetPassword = async (userId: string, email: string | null) => {
    if (!email) {
      toast.error("User email is not available, cannot send reset link.");
      return;
    }

    if (!window.confirm(`Are you sure you want to send a password reset link to ${email}?`)) {
      return;
    }

    setResettingPassword(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send password reset link');
      }

      toast.success(`Password reset link sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset link:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setResettingPassword(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50/50">
            <TableHead className="font-semibold text-gray-700 py-4">User</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Contact</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Role</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Joined</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Last Active</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow 
                key={user.id} 
                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                        {getInitials(user.user_metadata?.full_name, user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {user.user_metadata?.full_name || 'No name'}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {user.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="py-4">
                  <div className="space-y-1">
                    {user.phone ? (
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {user.phone}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No phone</div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="py-4">
                  {getRoleBadge(user.user_metadata?.role || user.role)}
                </TableCell>
                
                <TableCell className="py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {user.created_at ? formatDate(user.created_at) : 'N/A'}
                  </div>
                </TableCell>
                
                <TableCell className="py-4">
                  <div className="text-sm text-gray-700">
                    {getLastSignIn(user.last_sign_in_at || null)}
                  </div>
                </TableCell>
                
                <TableCell className="py-4">
                  {getStatusBadge(user)}
                </TableCell>
                
                <TableCell className="py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex items-center gap-1.5"
                      onClick={() => handleResetPassword(user.id, user.email)}
                      disabled={resettingPassword.has(user.id)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {resettingPassword.has(user.id) ? 'Sending...' : 'Reset Pass'}
                    </Button>

                    {(user.user_metadata?.role !== 'admin' && user.role !== 'admin') && (
                      <Button
                        onClick={() => handleMakeAdmin(user.id)}
                        disabled={promotingUsers.has(user.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {promotingUsers.has(user.id) ? 'Promoting...' : 'Make Admin'}
                      </Button>
                    )}
                    
                    <Link href={`/admin/users/${user.id}`} passHref>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Mail className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">No users found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 