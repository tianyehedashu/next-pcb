"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ContentMedia } from '@/types/content';
import { 
  Upload, 
  Image as ImageIcon, 
  Search, 
  Grid, 
  List,
  Calendar,
  File,
  Check,
  Loader2
} from 'lucide-react';

interface MediaLibraryProps {
  onSelect?: (media: ContentMedia) => void;
  trigger?: React.ReactNode;
  multiple?: boolean;
}

export default function MediaLibrary({ onSelect, trigger, multiple = false }: MediaLibraryProps) {
  const [media, setMedia] = useState<ContentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<ContentMedia[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const { toast } = useToast();

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/content/media');
      if (!response.ok) throw new Error('Failed to fetch media');
      
      const data = await response.json();
      setMedia(data.media);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast({
        title: "Error",
        description: "Failed to fetch media files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/content/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      return response.json();
    });

    try {
      const results = await Promise.all(uploadPromises);
      
      toast({
        title: "Success",
        description: `${results.length} file(s) uploaded successfully`,
      });
      
      fetchMedia(); // Refresh the media list
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error", 
        description: "Some files failed to upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [fetchMedia, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(event.target.files);
    // Reset input
    event.target.value = '';
  }, [handleUpload]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    handleUpload(event.dataTransfer.files);
  }, [handleUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const toggleSelection = useCallback((item: ContentMedia) => {
    if (multiple) {
      setSelectedMedia(prev => {
        const isSelected = prev.some(m => m.id === item.id);
        if (isSelected) {
          return prev.filter(m => m.id !== item.id);
        } else {
          return [...prev, item];
        }
      });
    } else {
      if (onSelect) {
        onSelect(item);
        setIsOpen(false);
      }
    }
  }, [multiple, onSelect]);

  const handleSelectMultiple = useCallback(() => {
    if (multiple && selectedMedia.length > 0) {
      // For multiple selection, you'd need to modify the onSelect prop to handle arrays
      // For now, we'll just select the first one
      if (onSelect && selectedMedia[0]) {
        onSelect(selectedMedia[0]);
        setIsOpen(false);
      }
    }
  }, [multiple, selectedMedia, onSelect]);

  const filteredMedia = media.filter(item =>
    item.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  const MediaGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredMedia.map((item) => {
        const isSelected = selectedMedia.some(m => m.id === item.id);
        return (
          <Card 
            key={item.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => toggleSelection(item)}
          >
            <CardContent className="p-3">
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                {item.mime_type?.startsWith('image/') ? (
                  <img
                    src={item.file_path}
                    alt={item.alt_text || item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium truncate">
                {item.original_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(item.file_size)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const MediaList = () => (
    <div className="space-y-2">
      {filteredMedia.map((item) => {
        const isSelected = selectedMedia.some(m => m.id === item.id);
        return (
          <Card 
            key={item.id} 
            className={`cursor-pointer transition-all hover:shadow-sm ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => toggleSelection(item)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.mime_type?.startsWith('image/') ? (
                    <img
                      src={item.file_path}
                      alt={item.alt_text || item.original_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <File className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {item.original_name}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(item.file_size)}</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ImageIcon className="w-4 h-4 mr-2" />
            Select Media
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              id="file-upload"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? (
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
              ) : (
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              )}
              <p className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop files here'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </label>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {multiple && selectedMedia.length > 0 && (
                <Badge variant="secondary">
                  {selectedMedia.length} selected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Media Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading media...</span>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No media found matching your search.' : 'No media files yet. Upload some files to get started.'}
              </div>
            ) : viewMode === 'grid' ? (
              <MediaGrid />
            ) : (
              <MediaList />
            )}
          </div>

          {/* Actions */}
          {multiple && selectedMedia.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedMedia([])}>
                  Clear Selection
                </Button>
                <Button onClick={handleSelectMultiple}>
                  Select {selectedMedia.length} Item(s)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 