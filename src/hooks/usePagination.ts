import { useCallback, useMemo, useState } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
  params: { page: number; page_size: number };
  onChange: (newPage: number, newPageSize: number) => void;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const reset = useCallback(() => setPage(1), []);

  const params = useMemo(
    () => ({ page, page_size: pageSize }),
    [page, pageSize],
  );

  const onChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
        setPage(1);
      } else {
        setPage(newPage);
      }
    },
    [pageSize],
  );

  return { page, pageSize, setPage, setPageSize, reset, params, onChange };
}
