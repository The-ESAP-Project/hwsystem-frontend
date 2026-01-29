import { useEffect, useState } from "react";

import { DEBOUNCE_DELAY } from "@/lib/constants";

export interface UseDebouncedSearchOptions {
  /** 防抖延迟时间（毫秒），默认 300ms */
  delay?: number;
  /** 搜索变化时的回调（如重置页码） */
  onSearchChange?: () => void;
}

export interface UseDebouncedSearchReturn {
  /** 原始搜索值（用于输入框） */
  search: string;
  /** 设置搜索值 */
  setSearch: (value: string) => void;
  /** 防抖后的搜索值（用于 API 请求） */
  debouncedSearch: string;
  /** 清空搜索 */
  clearSearch: () => void;
}

/**
 * 防抖搜索 Hook
 * 提供输入值和防抖后的值，避免频繁 API 请求
 */
export function useDebouncedSearch(
  options: UseDebouncedSearchOptions = {},
): UseDebouncedSearchReturn {
  const { delay = DEBOUNCE_DELAY, onSearchChange } = options;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed !== debouncedSearch) {
        setDebouncedSearch(trimmed);
        onSearchChange?.();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [search, delay, debouncedSearch, onSearchChange]);

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
  };

  return {
    search,
    setSearch,
    debouncedSearch,
    clearSearch,
  };
}

export default useDebouncedSearch;
