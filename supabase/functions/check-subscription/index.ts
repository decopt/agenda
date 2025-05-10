
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
    if (customers.data.length === 0) {
      // Verificar se está no período de teste
      const { data: config, error: configError } = await supabaseClient
        .from("company_config")
        .select("plan_type, trial_end_date")
        .eq("user_id", user.id)
        .single();
      
      if (configError) throw configError;
      
      const isInTrial = config?.plan_type === 'trial' && config?.trial_end_date && new Date(config.trial_end_date) > new Date();
      
      return new Response(JSON.stringify({ subscribed: false, trial: isInTrial }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar assinatura ativa
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
    });

    const hasActiveSub = subscriptions.data.length > 0;

    if (hasActiveSub) {
      // Atualizar config da empresa para PRO
      await supabaseClient
        .from("company_config")
        .update({ 
          plan_type: "pro",
          trial_start_date: null,
          trial_end_date: null
        })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ subscribed: hasActiveSub, trial: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
