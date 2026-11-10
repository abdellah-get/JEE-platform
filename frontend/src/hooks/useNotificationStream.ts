"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { notificationsStreamUrl } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * Opens an authenticated SSE stream for unread notification pushes.
 * Falls back to whatever polling TanStack Query already has when the stream drops.
 */
export function useNotificationStream(accessToken: string | null) {
  const queryClient = useQueryClient();
  const retryRef = useRef(0);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    let abort: AbortController | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      if (cancelled) return;
      abort = new AbortController();
      try {
        const res = await fetch(notificationsStreamUrl(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "text/event-stream",
          },
          signal: abort.signal,
          credentials: "include",
        });
        if (!res.ok || !res.body) {
          throw new Error(`SSE ${res.status}`);
        }
        retryRef.current = 0;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const lines = chunk.split("\n");
            let eventName = "message";
            let data = "";
            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                data += line.slice(5).trim();
              }
            }
            if (eventName === "notifications" && data) {
              try {
                const parsed = JSON.parse(data) as { unreadCount?: number };
                if (typeof parsed.unreadCount === "number") {
                  queryClient.setQueryData(queryKeys.unreadNotificationCount, {
                    count: parsed.unreadCount,
                  });
                }
              } catch {
                // ignore malformed payloads
              }
              void queryClient.invalidateQueries({
                queryKey: ["notifications"],
              });
            }
          }
        }
      } catch {
        // aborted or network — reconnect with backoff; polling remains as fallback
      }
      if (!cancelled) {
        const delay = Math.min(30_000, 2000 * 2 ** retryRef.current);
        retryRef.current += 1;
        reconnectTimer = setTimeout(() => {
          void connect();
        }, delay);
      }
    };

    void connect();

    return () => {
      cancelled = true;
      abort?.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [accessToken, queryClient]);
}
