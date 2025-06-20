"use client";

import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Upload,
  Loader2
} from 'lucide-react';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use the lowlight version
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your content...',
      }),
      Typography,
      TextStyle,
      Color,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-100 p-4 rounded-lg overflow-x-auto',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/content/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Insert image into editor
      editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [editor, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="border-b p-3 flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex gap-1">
            <Button
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('strike') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('code') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Headings */}
          <div className="flex gap-1">
            <Button
              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Lists and Quote */}
          <div className="flex gap-1">
            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('blockquote') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Media and Links */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={addLink}
              disabled={uploading}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addImage}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addTable}
              disabled={uploading}
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="min-h-[300px]">
          <EditorContent editor={editor} />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  );
} 