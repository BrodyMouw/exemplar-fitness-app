import { useAuth } from "@clerk/expo";
import axios from "axios";
import { useCallback } from "react";
import { API_BASE } from "../config";

// Wraps axios with the Clerk bearer token so screens don't each rebuild headers.
export function useApi() {
  const { getToken } = useAuth();

  const authHeaders = useCallback(async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

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

  return { get, post, put, del };
}
