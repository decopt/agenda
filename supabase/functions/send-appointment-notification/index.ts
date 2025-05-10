
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { appointment_id, user_id } = await req.json();

    console.log("Received request to send notification for appointment:", appointment_id);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch appointment details
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from("appointments")
      .select(`
        *,
        services (name, duration, price),
        profiles!appointments_user_id_fkey (company_name, custom_url)
      `)
      .eq("id", appointment_id)
      .single();

    if (appointmentError) {
      console.error("Error fetching appointment:", appointmentError);
      throw appointmentError;
    }
    
    console.log("Fetched appointment data:", JSON.stringify(appointment, null, 2));

    // Fetch webhook URL from company config
    const { data: config, error: configError } = await supabaseClient
      .from("company_config")
      .select("webhook_url, plan_type")
      .eq("user_id", user_id)
      .single();

    if (configError) {
      console.error("Error fetching company config:", configError);
      throw configError;
    }
    
    console.log("Company config:", JSON.stringify(config, null, 2));
    
    // Only proceed with webhook if user is on PRO plan and has webhook configured
    if (config.plan_type !== 'pro' || !config.webhook_url) {
      console.log("No webhook configured or user not on PRO plan:", {
        plan_type: config.plan_type,
        has_webhook: !!config.webhook_url
      });
      return new Response(
        JSON.stringify({ message: "No webhook configured or user not on PRO plan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format date and time for the webhook
    const scheduledDate = new Date(appointment.scheduled_at);
    const formattedDate = scheduledDate.toISOString().split('T')[0];
    const formattedTime = scheduledDate.toTimeString().slice(0, 5);

    // Send webhook in the requested format
    const webhookData = {
      nome_cliente: appointment.client_name,
      telefone_cliente: appointment.client_phone,
      email_cliente: appointment.client_email,
      servico: appointment.services.name,
      data: formattedDate,
      hora: formattedTime,
      empresa: appointment.profiles.company_name,
      // Include additional useful data
      servico_duracao: appointment.services.duration,
      servico_preco: appointment.services.price,
      appointment_id: appointment.id,
      status: appointment.status
    };

    // Use the correct webhook URL from company_config
    const webhookUrl = config.webhook_url || "https://webhook.conectdigitalpro.com/webhook/agendafacil";
    
    console.log("Sending webhook to:", webhookUrl);
    console.log("Webhook payload:", JSON.stringify(webhookData, null, 2));

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "*/*",
          "User-Agent": "AgendaFacil-Webhook/1.0"
        },
        body: JSON.stringify(webhookData),
      });
      
      console.log("Webhook response status:", webhookResponse.status);
      
      if (!webhookResponse.ok) {
        const responseText = await webhookResponse.text();
        console.error("Webhook error response:", responseText);
        throw new Error(`Webhook failed: ${webhookResponse.status} - ${webhookResponse.statusText}. Response: ${responseText}`);
      }
      
      const responseData = await webhookResponse.text();
      console.log("Webhook success response:", responseData);
    } catch (webhookError) {
      console.error("Error sending webhook:", webhookError);
      throw webhookError;
    }

    return new Response(
      JSON.stringify({ 
        message: "Notification sent successfully",
        data: webhookData,
        webhook_url: webhookUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
