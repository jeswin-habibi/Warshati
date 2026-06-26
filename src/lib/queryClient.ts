import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

// Offline-first: cached reads come from IndexedDB; queries/mutations are queued when offline
// and retried automatically when the connection returns (networkMode: 'offlineFirst').
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'offlineFirst' },
  },
})

export const persister = createAsyncStoragePersister({
  key: 'warshati-query-cache',
  storage: {
    getItem: async (k) => (await get(k)) ?? null,
    setItem: (k, v) => set(k, v),
    removeItem: (k) => del(k),
  },
})
