import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * 监听认证失效事件，自动跳转到登录页
 */
export function useAuthEventListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate("/auth/login", { replace: true });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [navigate]);
}
