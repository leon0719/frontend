import { Component, type ErrorInfo, type ReactNode } from "react";
import { i18n } from "@/shared/i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // ErrorBoundary sits OUTSIDE <I18nextProvider>, so the useTranslation
      // hook is unavailable here; read from the global i18n instance directly.
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center">
            <h1 className="text-lg font-medium">{i18n.t("common.error.title")}</h1>
            <p className="text-foreground/60">{i18n.t("common.error.description")}</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
