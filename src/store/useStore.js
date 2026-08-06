// This file stays as a compatibility bridge so current imports keep working
// while we gradually migrate code toward the new store hook location.
// Once all callers use `store/hooks/useStore` directly, this file can be
// removed without affecting the internal store architecture.
export {
  useAccountStore,
  useAuthStore,
  useCatalogStore,
  useMatchmakingStore,
  usePlayerStore,
  useStore,
  default,
} from "./hooks/useStore";
