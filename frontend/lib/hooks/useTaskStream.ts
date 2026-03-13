"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TaskStreamState {
  status: string;
  streamingUrl: string | null;
  progressSteps: string[];
  isDone: boolean;
  isConnected: boolean;
}

/**
 * WebSocket hook that connects to the backend task progress stream.
 * Includes automatic reconnection with exponential backoff (max 5 retries).
 */
export function useTaskStream(taskId: string | null): TaskStreamState {
  const [status, setStatus] = useState<string>("pending");
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const maxRetries = 5;

  const connect = useCallback(() => {
    if (!taskId) return;

    const wsUrl =
      (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000") +
      `/ws/tasks/${taskId}/progress`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          setProgressSteps((prev) => [...prev, data.step]);
        }
        if (data.type === "status") {
          setStatus(data.status);
          if (data.streaming_url) setStreamingUrl(data.streaming_url);
        }
        if (data.type === "done") {
          setStatus(data.status);
          setIsDone(true);
          ws.close();
        }
        if (data.type === "error") {
          console.error("Task stream error:", data.error);
          ws.close();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      console.error("WebSocket error for task", taskId);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);

      // Auto-reconnect if not done and retries left
      if (!isDone && retriesRef.current < maxRetries) {
        retriesRef.current += 1;
        const delay = Math.min(3000 * retriesRef.current, 15000);
        setTimeout(connect, delay);
      }
    };
  }, [taskId, isDone]);

  useEffect(() => {
    if (!taskId) return;

    // Reset state for new task
    setStatus("pending");
    setStreamingUrl(null);
    setProgressSteps([]);
    setIsDone(false);
    setIsConnected(false);
    retriesRef.current = 0;

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [taskId, connect]);

  return { status, streamingUrl, progressSteps, isDone, isConnected };
}
