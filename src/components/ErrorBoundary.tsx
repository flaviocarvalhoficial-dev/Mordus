import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Ops! Algo deu errado.</h1>
                    <p className="text-muted-foreground max-w-md mb-8">
                        Ocorreu um erro inesperado na aplicação. Tentamos capturá-lo para que você não perca seu progresso.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="rounded-full px-6"
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Recarregar página
                        </Button>
                        <Button
                            onClick={() => this.setState({ hasError: false })}
                            className="rounded-full px-6"
                        >
                            Tentar novamente
                        </Button>
                    </div>
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-12 p-4 bg-secondary/50 rounded-xl text-left overflow-auto max-w-2xl border border-border">
                            <p className="text-xs font-mono text-destructive font-bold mb-2 uppercase tracking-widest">Detalhe do Erro:</p>
                            <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
                                {this.state.error?.stack}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
