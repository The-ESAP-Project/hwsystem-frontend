import { Component, type ErrorInfo, type ReactNode } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import i18n from "@/app/i18n";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，显示降级 UI 而非白屏
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // 记录错误到日志（生产环境可上报到监控服务）
    logger.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <FiAlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {i18n.t("errorPage.title")}
              </h1>
              <p className="text-muted-foreground">
                {i18n.t("errorPage.description")}
              </p>
            </div>

            {/* 开发环境显示错误详情 */}
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left p-4 bg-muted rounded-lg overflow-auto max-h-48">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {i18n.t("errorPage.retry")}
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
                {i18n.t("errorPage.refresh")}
              </button>
            </div>

            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {i18n.t("errorPage.backHome")}
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
