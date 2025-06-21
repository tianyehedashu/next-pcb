'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface ContentFiltersProps {
  categories: Category[];
}

export function ContentFilters({ categories }: ContentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId && categoryId !== 'all') {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type && type !== 'all') {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search articles..."
          defaultValue={searchParams.get('search')?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select
        value={searchParams.get('category') || 'all'}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('type') || 'all'}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="help">Help & Guides</SelectItem>
          <SelectItem value="news">Industry News</SelectItem>
          <SelectItem value="post">Articles</SelectItem>
          <SelectItem value="page">Resources</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 