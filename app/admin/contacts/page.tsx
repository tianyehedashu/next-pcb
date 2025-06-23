import { createSupabaseServerClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building, Calendar, MessageSquare, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  project_type?: string;
  message: string;
  created_at: string;
}

export default async function AdminContactsPage() {

  const supabase = await createSupabaseServerClient();

  // 获取所有联系表单
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return <div>Error loading contacts</div>;
  }

  const getProjectTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'prototype': 'bg-blue-100 text-blue-800',
      'small-batch': 'bg-green-100 text-green-800',
      'medium-batch': 'bg-yellow-100 text-yellow-800',
      'mass-production': 'bg-purple-100 text-purple-800',
      'pcb-assembly': 'bg-orange-100 text-orange-800',
      'design-service': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Form Submissions</h1>
          <p className="text-gray-600 mt-2">
            Manage and respond to customer inquiries
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {contacts?.length || 0} Total Submissions
        </Badge>
      </div>

      {!contacts || contacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contact form submissions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact: Contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDistanceToNow(new Date(contact.created_at))} ago</span>
                        </div>
                        {contact.project_type && (
                          <Badge className={getProjectTypeBadgeColor(contact.project_type)}>
                            {contact.project_type.replace('-', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                  
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <a 
                        href={`tel:${contact.phone}`}
                        className="text-green-600 hover:text-green-800 hover:underline"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  
                  {contact.company && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-700">{contact.company}</span>
                    </div>
                  )}
                </div>

                {/* Message */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Customer Message
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {contact.message}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a 
                    href={`mailto:${contact.email}?subject=Re: Your PCB Project Inquiry`}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Reply via Email
                  </a>
                  
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </a>
                  )}
                  
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(contact.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 