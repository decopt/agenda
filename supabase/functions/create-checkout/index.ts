
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) throw new Error("Usuário não autenticado");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar cliente Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Verificar se o usuário está no período de teste
    const { data: config, error: configError } = await supabaseClient
      .from("company_config")
      .select("plan_type")
      .eq("user_id", user.id)
      .single();
    
    if (configError) throw configError;
    
    // Adicionar mensagem adaptada ao plano atual do usuário
    let successMessage = "Assinatura realizada com sucesso!";
    if (config.plan_type === "trial") {
      successMessage = "Plano PRO ativado com sucesso! Seu período de teste foi convertido em uma assinatura permanente.";
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Plano PRO - AgendaFácil",
              description: "Agendamentos ilimitados e recursos avançados",
            },
            unit_amount: 4990, // R$ 49,90
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?tab=configuracoes&success=true&message=${encodeURIComponent(successMessage)}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?tab=configuracoes&canceled=true`,
    });

    // Registrar tentativa de pagamento
    await supabaseClient.from("payments").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      amount: 4990,
      currency: "brl",
      status: "pending"
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
