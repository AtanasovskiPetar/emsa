import { Component, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-background">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground max-w-sm">{this.state.message}</p>
          <Button variant="outline" onClick={() => this.setState({ hasError: false, message: "" })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
