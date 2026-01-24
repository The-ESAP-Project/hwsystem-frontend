import { useCallback, useEffect, useRef, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number; // 新增：最大重连间隔
  heartbeatInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

const DEFAULT_OPTIONS = {
  autoConnect: true,
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000, // 最大 30 秒
  heartbeatInterval: 30000,
} as const;

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url,
    autoConnect = DEFAULT_OPTIONS.autoConnect,
    reconnect = DEFAULT_OPTIONS.reconnect,
    maxReconnectAttempts = DEFAULT_OPTIONS.maxReconnectAttempts,
    reconnectInterval = DEFAULT_OPTIONS.reconnectInterval,
    maxReconnectInterval = DEFAULT_OPTIONS.maxReconnectInterval,
    heartbeatInterval = DEFAULT_OPTIONS.heartbeatInterval,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const currentUser = useUserStore((s) => s.currentUser);
  const isAuthenticated = currentUser !== null;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  // 构建 WebSocket URL
  const getWsUrl = useCallback(() => {
    if (url) return url;

    const baseUrl =
      import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}/ws`;
    }

    return `${baseUrl.replace(/^http/, "ws")}/ws`;
  }, [url]);

  // 停止心跳
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // 启动心跳
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, stopHeartbeat]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("disconnected");
  }, [stopHeartbeat]);

  // 连接 WebSocket
  const connect = useCallback(() => {
    const token = localStorage.getItem("authToken");

    if (!isAuthenticated || !token) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    disconnect();
    setStatus("connecting");

    try {
      const wsUrl = new URL(getWsUrl());
      wsUrl.searchParams.set("token", token);

      const ws = new WebSocket(wsUrl.toString());

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
        startHeartbeat();
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;

          // 忽略 pong 消息
          if (message.type === "pong") return;

          setLastMessage(message);
          onMessage?.(message);
        } catch {
          console.warn("Failed to parse WebSocket message:", event.data);
        }
      };

      ws.onerror = (event) => {
        setStatus("error");
        onError?.(event);
      };

      ws.onclose = () => {
        setStatus("disconnected");
        stopHeartbeat();
        onDisconnect?.();

        // 尝试重连
        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          // 指数退避，但限制最大间隔
          const delay = Math.min(
            reconnectInterval * 2 ** reconnectAttemptsRef.current,
            maxReconnectInterval,
          );
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setStatus("error");
    }
  }, [
    isAuthenticated,
    getWsUrl,
    disconnect,
    startHeartbeat,
    stopHeartbeat,
    reconnect,
    maxReconnectAttempts,
    reconnectInterval,
    maxReconnectInterval,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  ]);

  // 发送消息
  const send = useCallback((message: WebSocketMessage | string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected");
      return false;
    }

    const data =
      typeof message === "string" ? message : JSON.stringify(message);
    wsRef.current.send(data);
    return true;
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, connect, disconnect]);

  // 网络状态监听：网络恢复时立即重连
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated && status === "disconnected") {
        // 重置重连计数，立即尝试重连
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };

    const handleOffline = () => {
      // 网络断开时清除重连定时器
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAuthenticated, status, connect]);

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    send,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
  };
}
