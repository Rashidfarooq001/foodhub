import { useState } from 'react';

export function usePagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = () => setPage((prev) => prev + 1);
  const prevPage = () => setPage((prev) => Math.max(1, prev - 1));
  const goToPage = (p: number) => setPage(Math.max(1, p));

  return { page, limit, setLimit, nextPage, prevPage, goToPage };
}
