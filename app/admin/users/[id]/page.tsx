"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AdminUser } from '../../types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, KeyRound, User, Mail, Phone, Calendar, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import { UserOrdersTable } from '../../components/UserOrdersTable'; 
import { UserQuotesTable } from '../../components/UserQuotesTable';
import { UserAddresses } from '../../components/UserAddresses';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUser = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
      });
       const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send password reset');
      }
      toast.success('Password reset email sent successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastSignIn = (lastSignIn: string | null) => {
    if (!lastSignIn) return 'Never signed in';
    const date = new Date(lastSignIn);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(lastSignIn);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-lg">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="p-4 bg-red-100 rounded-full">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center">
              <p className="text-red-600 text-lg font-medium">Error loading user</p>
              <p className="text-gray-500">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isBanned = user?.banned_until && new Date(user.banned_until) > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" className="rounded-lg hover:bg-white">
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </div>

        {/* User Profile Card */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                    {getInitials(user.user_metadata?.full_name, user.email || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {user.user_metadata?.full_name || 'No name provided'}
                    </CardTitle>
                    {isBanned ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Deactivated
                      </Badge>
                    ) : user.email_confirmed_at ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting} className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Send Password Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send Password Reset?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send a password reset link to the user&apos;s email: <strong>{user.email}</strong>. Are you sure you want to proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetPassword} disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send Link'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {user.phone || 'Not provided'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Joined Date
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {user.created_at ? formatDate(user.created_at) : 'N/A'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Clock className="h-4 w-4" />
                  Last Sign In
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {getLastSignIn(user.last_sign_in_at)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Shield className="h-4 w-4" />
                  Email Status
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <Tabs defaultValue="quotes" className="w-full">
            <div className="border-b border-gray-100">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="quotes" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                >
                  Quotes
                </TabsTrigger>
                <TabsTrigger 
                  value="orders" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                >
                  Orders
                </TabsTrigger>
                <TabsTrigger 
                  value="addresses" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                >
                  Addresses
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="quotes" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">User Quotes</h3>
                <UserQuotesTable userId={id} />
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">User Orders</h3>
                <UserOrdersTable userId={id} />
              </div>
            </TabsContent>
            
            <TabsContent value="addresses" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">User Addresses</h3>
                <UserAddresses userId={id} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 