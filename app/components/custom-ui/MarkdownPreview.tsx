"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Eye } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  title?: string;
  excerpt?: string;
  type?: string;
  isPreview?: boolean;
}

export default function MarkdownPreview({ 
  content, 
  title, 
  excerpt, 
  type = 'page',
  isPreview = true 
}: MarkdownPreviewProps) {
  const getTypeColor = (type: string) => {
    const colors = {
      page: 'bg-blue-100 text-blue-800',
      post: 'bg-green-100 text-green-800', 
      news: 'bg-orange-100 text-orange-800',
      help: 'bg-purple-100 text-purple-800'
    } as const;
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Custom components for ReactMarkdown
  const components = {
    h1: ({ children }: any) => (
      <h1 className="text-4xl font-bold text-gray-900 mb-6 border-b pb-4">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-semibold text-gray-800 mb-4 mt-8">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xl font-semibold text-gray-800 mb-2 mt-4">
        {children}
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-700 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-6 mb-4 space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700">
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 italic text-gray-700">
        {children}
      </blockquote>
    ),
    code: ({ children, className }: any) => {
      const isBlock = className?.includes('language-');
      if (isBlock) {
        return (
          <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto mb-4">
            <code className={className}>
              {children}
            </code>
          </pre>
        );
      }
      return (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
          {children}
        </code>
      );
    },
    pre: ({ children }: any) => (
      <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto mb-4">
        {children}
      </pre>
    ),
    img: ({ src, alt }: any) => (
      <img 
        src={src} 
        alt={alt} 
        className="max-w-full h-auto rounded-lg shadow-sm mb-4"
      />
    ),
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        className="text-blue-600 underline hover:text-blue-800"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border border-gray-300">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-50">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody>
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="border-b border-gray-200">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2 text-left font-semibold text-gray-900 border-r border-gray-300">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-gray-700 border-r border-gray-300">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="border-t border-gray-300 my-8" />
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic">
        {children}
      </em>
    ),
  };

  return (
    <Card className="w-full">
      {isPreview && (
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Preview</CardTitle>
            <Badge variant="outline" className="text-xs">
              Live Preview
            </Badge>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="max-w-none p-6">
          {/* Header */}
          {(title || excerpt) && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                {isPreview && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Preview Mode
                  </Badge>
                )}
              </div>
              
              {title && (
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {title}
                </h1>
              )}
              
              {excerpt && (
                <p className="text-xl text-gray-600 mb-6">
                  {excerpt}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-200 pb-6">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>By Admin</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Published {formatDate(new Date())}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>0 views</span>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose max-w-none">
            {content ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="text-gray-400 italic text-center py-8">
                Start writing to see your content preview here...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 