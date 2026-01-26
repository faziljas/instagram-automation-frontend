import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Skeleton component with pulse animation
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      {...props}
    />
  );
}

/**
 * Table Skeleton - Loading state for tables
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-32" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Card Skeleton - Loading state for card components
 */
interface CardSkeletonProps {
  lines?: number;
  hasImage?: boolean;
  hasButton?: boolean;
}

export function CardSkeleton({ lines = 3, hasImage = false, hasButton = false }: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {hasImage && (
        <Skeleton className="h-48 w-full mb-4" />
      )}
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        {hasButton && (
          <Skeleton className="h-10 w-32 mt-4" />
        )}
      </div>
    </div>
  );
}

/**
 * List Skeleton - Loading state for list items
 */
interface ListSkeletonProps {
  items?: number;
  hasAvatar?: boolean;
}

export function ListSkeleton({ items = 5, hasAvatar = false }: ListSkeletonProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center space-x-4">
          {hasAvatar && (
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Stats Card Skeleton - Loading state for dashboard stats
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="ml-4 flex-1">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid Stats Skeleton - For dashboard stats grid
 */
interface GridStatsSkeletonProps {
  cards?: number;
}

export function GridStatsSkeleton({ cards = 4 }: GridStatsSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Form Skeleton - Loading state for forms
 */
interface FormSkeletonProps {
  fields?: number;
  hasButton?: boolean;
}

export function FormSkeleton({ fields = 4, hasButton = true }: FormSkeletonProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        {hasButton && (
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Profile Skeleton - Loading state for profile sections
 */
export function ProfileSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

/**
 * Page Header Skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/**
 * Full Page Skeleton - Complete page loading state
 */
interface FullPageSkeletonProps {
  hasHeader?: boolean;
  hasStats?: boolean;
  hasTables?: boolean;
}

export function FullPageSkeleton({
  hasHeader = true,
  hasStats = false,
  hasTables = false
}: FullPageSkeletonProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {hasHeader && <PageHeaderSkeleton />}
      {hasStats && (
        <div className="mb-8">
          <GridStatsSkeleton />
        </div>
      )}
      {hasTables ? (
        <TableSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
    </div>
  );
}

/**
 * Text Skeleton - For text content
 */
interface TextSkeletonProps {
  lines?: number;
  width?: 'full' | '3/4' | '1/2' | '1/4';
}

export function TextSkeleton({ lines = 1, width = 'full' }: TextSkeletonProps) {
  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/4': 'w-1/4',
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? widthClasses[width] : 'w-full'}`}
        />
      ))}
    </div>
  );
}
