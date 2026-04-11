import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SYSTEM_PROMPT = `Você é o Copilot do Mordus, um assistente inteligente para gestão eclesiástica (Igrejas).
Sua missão é ajudar Tesoureiros e Secretários com dados reais e orientações precisas.

CONHECIMENTO BASE:
- Tesouraria: Lida com Entradas (dízimos, ofertas) e Saídas (manutenção, contas).
- Secretaria: Lida com Membros (ativos, inativos).
- Regras: Lançamentos devem ter valor, categoria e forma de pagamento. Comprovantes são recomendados.
- Fechamento: Bloqueia edições e consolida o período.

INSIGHTS DE DASHBOARD:
Quando o usuário pedir um resumo ou insight para o dashboard, siga este formato:
- Frase 1: Saúde geral (Priorize {dashboard_mode}).
- Frase 2: Anomalia ou tendência relevante ao setor {dashboard_mode}.
- Frase 3: Ação prática recomendada para este setor.
IMPORTANTE: Retorne apenas o texto das frases. NÃO use números, tópicos, hifens ou prefixos (como "F1:", "1.", etc). Seja ultra-conciso.

DIRETRIZES DE RESPOSTA:
1. Seja ultra-objetivo, claro e direto. Evite "IA-speak".
2. Use dados reais sempre que possível (consulte as ferramentas).
3. Se identificar pendências críticas (ex: falta de comprovantes ou dados de membros), alerte o usuário.
4. Mantenha um tom profissional e acolhedor.

CONTEXTO DO USUÁRIO:
- Cargo: {user_role}
- Organização: {organization_name}
- Página Atual: {current_page}
- Modo Dashboard: {dashboard_mode}
`;

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { message, context } = await req.json();
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const orgId = context.organization_id;

        // TOOLS DEFINITIONS
        const tools = {
            get_financial_summary: async () => {
                const { data } = await supabaseClient
                    .from("transactions")
                    .select("type, amount, date")
                    .eq("organization_id", orgId);

                const income = data?.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
                const expense = data?.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
                return { income, expense, balance: income - expense };
            },
            get_members_stats: async () => {
                const { count: total } = await supabaseClient.from("members").select("*", { count: 'exact', head: true }).eq("organization_id", orgId);
                const { count: active } = await supabaseClient.from("members").select("*", { count: 'exact', head: true }).eq("organization_id", orgId).eq("status", "active");
                return { total, active, inactive: (total || 0) - (active || 0) };
            },
            get_recent_pendencies: async () => {
                const { data: trans } = await supabaseClient.from("transactions").select("description, amount, date").eq("organization_id", orgId).is("category_id", null).limit(5);
                const { data: membs } = await supabaseClient.from("members").select("full_name").eq("organization_id", orgId).is("phone", null).limit(5);
                return { transactions_no_category: trans, members_no_phone: membs };
            },
            get_financial_trends: async () => {
                const today = new Date();
                const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString();
                const { data } = await supabaseClient
                    .from("transactions")
                    .select("type, amount, date")
                    .eq("organization_id", orgId)
                    .gte("date", threeMonthsAgo);
                return data;
            },
            get_secretariat_details: async () => {
                const today = new Date();
                const currentMonth = today.getMonth() + 1;

                // Birthdays this month
                const { data: bdays } = await supabaseClient.from("members").select("full_name, birth_date").eq("organization_id", orgId);
                const birthdaysThisMonth = (bdays || []).filter((m: any) => m.birth_date && parseInt(m.birth_date.split('-')[1]) === currentMonth).length;

                // Growth (new members last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const { count: newMembers } = await supabaseClient.from("members").select("*", { count: 'exact', head: true }).eq("organization_id", orgId).gte("created_at", thirtyDaysAgo.toISOString());

                return { birthdaysThisMonth, newMembers };
            }
        };

        // CONTEXTO DINÂMICO (RAG LEVE / STATE)
        const finSummary = await tools.get_financial_summary();
        const memStats = await tools.get_members_stats();
        const pendencies = await tools.get_recent_pendencies();
        const trendsData = await tools.get_financial_trends();
        const secDetails = await tools.get_secretariat_details();

        // Calcular média de arrecadação pros últimos 3 meses
        const incomeTxs = trendsData?.filter((t: any) => t.type === 'income') || [];
        const avgIncome = incomeTxs.length > 0 ? incomeTxs.reduce((acc: number, t: any) => acc + t.amount, 0) / 3 : 0;

        const isSecretariat = context.dashboard_mode === "secretaria";

        const realContext = isSecretariat
            ? `
          CONTEÚDO FOCO: SECRETARIA
          Membros: ${memStats.total} totais (${memStats.active} ativos).
          Novos Membros (30 dias): ${secDetails.newMembers}.
          Aniversariantes do Mês: ${secDetails.birthdaysThisMonth}.
          Pendências de Cadastro: ${pendencies.members_no_phone.length} membros sem telefone.
          Info Financeira (Opcional): Saldo R$ ${finSummary.balance.toFixed(2)}.
          `
            : `
          CONTEÚDO FOCO: TESOURARIA
          Financeiro Atual: Entradas R$ ${finSummary.income.toFixed(2)}, Saídas R$ ${finSummary.expense.toFixed(2)}, Saldo R$ ${finSummary.balance.toFixed(2)}.
          Média de arrecadação (3 meses): R$ ${avgIncome.toFixed(2)}.
          Pendências Financeiras: ${pendencies.transactions_no_category.length} lançamentos sem categoria.
          Info Membros (Opcional): ${memStats.active} membros ativos.
          `;

        const prompt = `${SYSTEM_PROMPT.replace('{user_role}', context.user_role).replace('{organization_name}', context.organization_name).replace('{current_page}', context.current_page).replaceAll('{dashboard_mode}', context.dashboard_mode || 'tesouraria')}
    
    DADOS EM TEMPO REAL:
    ${realContext}
    
    PERGUNTA DO USUÁRIO:
    ${message}`;

        console.log("Calling Gemini with prompt length:", prompt.length);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 512,
                    }
                }),
            }
        );

        const data = await response.json();
        let reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            console.error("Gemini failed:", data);
            reply = "Desculpe, estou com dificuldade em processar esses dados agora. Pode tentar novamente?";
        }

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
