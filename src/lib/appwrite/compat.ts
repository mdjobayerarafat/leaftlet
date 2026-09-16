/**
 * Compatibility shim for node-appwrite on modern Node runtimes.
 *
 * node-appwrite spreads a node-fetch-native "agent" object into every fetch()
 * call. Node's built-in undici rejects those extra keys with
 * `UND_ERR_INVALID_ARG: invalid onError method`, so we strip them before the
 * request reaches fetch. Safe everywhere: a no-op when the keys are absent.
 */
let patched = false;

export function installFetchCompat(): void {
  if (patched) return;
  patched = true;

  const globalFetch = globalThis.fetch;
  if (typeof globalFetch !== "function") return;

  const sanitizedFetch: typeof globalFetch = (input, init) => {
    if (init && (typeof init === "object")) {
      const { agent: _agent, dispatcher: _dispatcher, ...rest } = init as Record<string, unknown>;
      if (_agent !== undefined || _dispatcher !== undefined) {
        return globalFetch(input as Parameters<typeof globalFetch>[0], rest as RequestInit);
      }
    }
    return globalFetch(input as Parameters<typeof globalFetch>[0], init);
  };

  globalThis.fetch = sanitizedFetch;
}

installFetchCompat();
