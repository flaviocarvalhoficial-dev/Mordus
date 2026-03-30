import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MordusLogo } from "@/components/MordusLogo";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: email.split('@')[0] }
                    }
                });
                if (error) throw error;
                toast.success("Conta criada! Verifique seu e-mail.");
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md bg-card border-border shadow-xl">
                <CardHeader className="flex flex-col items-center pt-12 pb-10">
                    <div className="mb-4">
                        <MordusLogo
                            variant="full"
                            className="w-[140px] h-auto"
                        />
                    </div>
                    <p className="text-sm font-normal text-muted-foreground mb-6">
                        Gestão completa da igreja em um só lugar.
                    </p>
                    <CardDescription className="text-center italic">
                        {isSignUp ? "Crie sua conta para gerenciar sua igreja" : "Entre com sua conta para acessar o painel"}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="exemplo@igreja.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? "Criar Conta" : "Entrar"}
                        </Button>
                        <button
                            type="button"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? "Já tem uma conta? Entre" : "Não tem uma conta? Cadastre-se"}
                        </button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
