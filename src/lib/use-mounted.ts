import { useSyncExternalStore } from "react";

// Six components used `useEffect(() => setMounted(true), [])` to avoid a
// hydration mismatch on theme-dependent markup. That setState-in-effect costs
// an extra render pass on every one of them, and React now flags it.
//
// useSyncExternalStore gives the same answer without the extra render: the
// server snapshot is false, the client snapshot is true, so the first paint
// matches the server and everything after knows it is hydrated.

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
