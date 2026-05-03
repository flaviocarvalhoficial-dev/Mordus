import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, ArrowRight, LogIn, UserPlus, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MordusLogo } from "@/components/MordusLogo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthMode = "signin" | "signup" | "forgot";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [mode, setMode] = useState<AuthMode>("signin");
    const [resetSent, setResetSent] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "signup") {
                if (!fullName) {
                    toast.error("Por favor, informe seu nome completo");
                    setLoading(false);
                    return;
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
                toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
                setMode("signin");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate("/");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const [resetCooldown, setResetCooldown] = useState(0);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Digite seu e-mail para continuar.");
            return;
        }
        if (resetCooldown > 0) {
            toast.error(`Aguarde ${resetCooldown}s antes de solicitar um novo link.`);
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth?mode=reset`,
            });
            if (error) {
                const msg = (error.message ?? "").toLowerCase();
                if (msg.includes("rate limit") || msg.includes("email rate") || msg.includes("too many")) {
                    toast.error("Muitas tentativas. Aguarde alguns minutos antes de solicitar um novo link.");
                } else {
                    toast.error("Não foi possível enviar o e-mail. Tente novamente em instantes.");
                }
                return;
            }
            // Start 60s cooldown to prevent repeated submissions
            setResetSent(true);
            let secs = 60;
            setResetCooldown(secs);
            const timer = setInterval(() => {
                secs -= 1;
                setResetCooldown(secs);
                if (secs <= 0) clearInterval(timer);
            }, 1000);
        } catch {
            toast.error("Não foi possível enviar o e-mail. Tente novamente em instantes.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToSignIn = () => {
        setMode("signin");
        setResetSent(false);
        setEmail("");
    };

    // ── Forgot Password View ──────────────────────────────────────
    if (mode === "forgot") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4 font-sans">
                <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center">
                        <MordusLogo variant="full" className="w-[180px] h-auto mb-2" />
                        <p className="text-[11px] text-muted-foreground font-black tracking-[0.3em] uppercase">Gestão Eclesiástica Inteligente</p>
                    </div>

                    <Card className="border-border/60 shadow-2xl shadow-primary/5 bg-card/80 backdrop-blur-sm overflow-hidden rounded-3xl">
                        <CardHeader className="space-y-3 pb-4 pt-8 text-center border-b border-border/40 bg-secondary/5">
                            <div className="flex justify-center">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <KeyRound className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground">
                                Recuperar senha
                            </CardTitle>
                            <CardDescription className="text-[13px]">
                                {resetSent
                                    ? "Verifique a caixa de entrada do seu e-mail"
                                    : "Informe seu e-mail e enviaremos um link de redefinição"}
                            </CardDescription>
                        </CardHeader>

                        {resetSent ? (
                            /* ── SUCCESS STATE ── */
                            <CardContent className="pt-8 pb-2 space-y-4 text-center">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-14 w-14 text-green-500" strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">E-mail enviado!</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                                        Enviamos um link de redefinição de senha para{" "}
                                        <span className="font-bold text-foreground">{email}</span>.
                                        Verifique também sua pasta de spam.
                                    </p>
                                </div>
                            </CardContent>
                        ) : (
                            /* ── FORM STATE ── */
                            <form onSubmit={handleForgotPassword} className="mt-2">
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-1.5 group">
                                        <Label htmlFor="reset-email" className="text-[12px] font-bold text-muted-foreground ml-1">E-mail cadastrado</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="reset-email"
                                                type="email"
                                                placeholder="exemplo@igreja.com"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-11 pl-10 bg-secondary/20 border-border/40 focus:border-primary/50 transition-all rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="flex flex-col space-y-4 pb-8 pt-2">
                                    <Button
                                        className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                        type="submit"
                                        disabled={loading || resetCooldown > 0}
                                    >
                                        {loading
                                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            : <Mail className="mr-2 h-4 w-4" />}
                                        {resetCooldown > 0
                                            ? `Aguarde ${resetCooldown}s para reenviar`
                                            : "Enviar link de recuperação"}
                                    </Button>
                                </CardFooter>
                            </form>
                        )}

                        <div className="flex justify-center pb-8 -mt-2">
                            <button
                                type="button"
                                onClick={handleBackToSignIn}
                                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Voltar para o login
                            </button>
                        </div>
                    </Card>

                    <p className="text-center text-[11px] text-muted-foreground/60 px-4">
                        Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
                    </p>
                </div>
            </div>
        );
    }

    // ── Sign In / Sign Up View ────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4 font-sans">
            <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center">
                    <MordusLogo variant="full" className="w-[180px] h-auto mb-2" />
                    <p className="text-[11px] text-muted-foreground font-black tracking-[0.3em] uppercase">Gestão Eclesiástica Inteligente</p>
                </div>

                <Card className="border-border/60 shadow-2xl shadow-primary/5 bg-card/80 backdrop-blur-sm overflow-hidden rounded-3xl">
                    <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="w-full">
                        <CardHeader className="space-y-1 pb-4 pt-8 text-center border-b border-border/40 bg-secondary/5">
                            <TabsList className="grid w-full grid-cols-2 max-w-[280px] mx-auto bg-secondary/50 p-1 border border-border/50 h-10 mb-2">
                                <TabsTrigger value="signin" className="text-xs font-bold gap-2 data-[state=active]:bg-background transition-all">
                                    <LogIn className="h-3 w-3" /> Entrar
                                </TabsTrigger>
                                <TabsTrigger value="signup" className="text-xs font-bold gap-2 data-[state=active]:bg-background transition-all">
                                    <UserPlus className="h-3 w-3" /> Cadastrar
                                </TabsTrigger>
                            </TabsList>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground pt-2">
                                {mode === "signup" ? "Criar nova conta" : "Seja bem-vindo"}
                            </CardTitle>
                            <CardDescription className="text-[13px]">
                                {mode === "signup" ? "Preencha os dados abaixo para começar" : "Acesse o painel administrativo da Mordus"}
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleAuth} className="mt-2">
                            <CardContent className="space-y-4 pt-6">
                                {mode === "signup" && (
                                    <div className="space-y-1.5 group">
                                        <Label htmlFor="fullName" className="text-[12px] font-bold text-muted-foreground ml-1">Nome Completo</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="fullName"
                                                placeholder="Seu nome"
                                                required={mode === "signup"}
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="h-11 pl-10 bg-secondary/20 border-border/40 focus:border-primary/50 transition-all rounded-xl"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5 group">
                                    <Label htmlFor="email" className="text-[12px] font-bold text-muted-foreground ml-1">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="exemplo@igreja.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-11 pl-10 bg-secondary/20 border-border/40 focus:border-primary/50 transition-all rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 group">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-[12px] font-bold text-muted-foreground">Senha</Label>
                                        {mode === "signin" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResetSent(false);
                                                    setMode("forgot");
                                                }}
                                                className="text-[10px] text-muted-foreground hover:text-primary font-bold transition-colors"
                                            >
                                                Esqueceu a senha?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 pl-10 bg-secondary/20 border-border/40 focus:border-primary/50 transition-all rounded-xl"
                                        />
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col space-y-4 pb-8 pt-2">
                                <Button className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]" type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                    {mode === "signup" ? "Criar Minha Conta" : "Entrar no Painel"}
                                </Button>

                                <div className="flex items-center justify-center w-full mt-2">
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors decoration-border/50"
                                        onClick={() => {
                                            setMode(mode === "signup" ? "signin" : "signup");
                                            setFullName("");
                                        }}
                                    >
                                        {mode === "signup" ? (
                                            <p>Já possui uma conta ativa? <span className="text-primary font-bold">Acesse agora</span></p>
                                        ) : (
                                            <p>Novo por aqui? <span className="text-primary font-bold">Comece agora gratuitamente</span></p>
                                        )}
                                    </button>
                                </div>
                            </CardFooter>
                        </form>
                    </Tabs>
                </Card>

                <p className="text-center text-[11px] text-muted-foreground/60 px-4">
                    Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
                </p>
            </div>
        </div>
    );
}
