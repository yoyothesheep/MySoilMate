import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { type PlantFilter, type PaginatedPlantsResponse } from '@shared/schema';
import { buildQueryString } from '@/lib/plantData';

export function useInfiniteScroll(filter: PlantFilter) {
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: queryIsFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['plants-infinite', filter],
    queryFn: async ({ pageParam = 1 }) => {
      const filterWithPage = { ...filter, page: pageParam, limit: 15 };
      const queryString = buildQueryString(filterWithPage);
      const response = await fetch(`/api/plants?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch plants');
      }
      return response.json() as Promise<PaginatedPlantsResponse>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten all pages into a single array
  const allPlants = data?.pages.flatMap(page => page.plants) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 // Trigger 1000px before bottom
      ) {
        if (hasNextPage && !queryIsFetchingNextPage && !isFetchingNextPage) {
          setIsFetchingNextPage(true);
          fetchNextPage().finally(() => {
            setIsFetchingNextPage(false);
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, queryIsFetchingNextPage, isFetchingNextPage, fetchNextPage]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !queryIsFetchingNextPage && !isFetchingNextPage) {
      setIsFetchingNextPage(true);
      fetchNextPage().finally(() => {
        setIsFetchingNextPage(false);
      });
    }
  }, [hasNextPage, queryIsFetchingNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    plants: allPlants,
    totalCount,
    isLoading,
    isError,
    isFetchingNextPage: queryIsFetchingNextPage || isFetchingNextPage,
    hasNextPage,
    loadMore,
    refetch
  };
}