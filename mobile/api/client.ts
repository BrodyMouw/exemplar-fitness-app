import { useAuth } from "@clerk/expo";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { API_BASE } from "../config";

// Wraps axios with the Clerk bearer token so screens don't each rebuild headers.
//
// Every value handed back here is reference-stable for the life of the
// component. Screens put `api` in effect dependency arrays, so a new object
// (or new function) each render would re-fire those effects on every render -
// refetching in a loop and clobbering any local state seeded from the response.
export function useApi() {
  const { getToken } = useAuth();

  // Read through a ref so `authHeaders` never has to depend on getToken's
  // identity, which Clerk does not guarantee to be stable.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const authHeaders = useCallback(async () => {
    const token = await getTokenRef.current();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const get = useCallback(
    async <T,>(path: string): Promise<T> => {
      const res = await axios.get<T>(`${API_BASE}${path}`, {
        headers: await authHeaders(),
      });
      return res.data;
    },
    [authHeaders],
  );

  const post = useCallback(
    async <T,>(path: string, body: unknown): Promise<T> => {
      const res = await axios.post<T>(`${API_BASE}${path}`, body, {
        headers: await authHeaders(),
      });
      return res.data;
    },
    [authHeaders],
  );

  const put = useCallback(
    async <T,>(path: string, body: unknown): Promise<T> => {
      const res = await axios.put<T>(`${API_BASE}${path}`, body, {
        headers: await authHeaders(),
      });
      return res.data;
    },
    [authHeaders],
  );

  const del = useCallback(
    async (path: string): Promise<void> => {
      await axios.delete(`${API_BASE}${path}`, { headers: await authHeaders() });
    },
    [authHeaders],
  );

  return useMemo(() => ({ get, post, put, del }), [get, post, put, del]);
}
