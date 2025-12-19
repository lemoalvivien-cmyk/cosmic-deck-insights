import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CardInput {
  card_id: string;
  orientation: "upright" | "reversed";
  position_key: string;
}

interface RequestPayload {
  spread_id: string;
  question: string | null;
  cards: CardInput[];
}

interface TarotInterpretation {
  title: string;
  summary: string;
  interpretation: {
    general: string;
    love: string;
    work: string;
    money: string;
  };
  advice: string[];
  reflection_questions: string[];
  safety: {
    medical: string;
    legal: string;
    financial: string;
  };
}

const JSON_SCHEMA = `{
  "title": "Titre évocateur du tirage (ex: 'La Voie de la Transformation')",
  "summary": "Résumé global de l'interprétation en 2-3 phrases mystiques et bienveillantes",
  "interpretation": {
    "general": "Interprétation générale et guidance spirituelle (3-4 phrases)",
    "love": "Ce que cette carte révèle pour les relations amoureuses et affectives (2-3 phrases)",
    "work": "Guidance pour la carrière et les projets professionnels (2-3 phrases)",
    "money": "Éclairages sur les questions financières et matérielles (2-3 phrases)"
  },
  "advice": ["Conseil concret 1", "Conseil concret 2", "Conseil concret 3"],
  "reflection_questions": ["Question introspective 1 ?", "Question introspective 2 ?"],
  "safety": {
    "medical": "Rappel: consulter un professionnel de santé pour toute question médicale",
    "legal": "Rappel: consulter un avocat pour toute question juridique",
    "financial": "Rappel: consulter un conseiller financier pour toute décision importante"
  }
}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for ENV CHECK mode (admin diagnostic - REQUIRES AUTH + ADMIN ROLE)
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "env-check") {
      // ENV CHECK requires authentication
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Non autorisé" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create Supabase client with user's JWT
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseEnvCheck = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      // Verify user
      const { data: { user: envCheckUser }, error: envCheckUserError } = await supabaseEnvCheck.auth.getUser();
      if (envCheckUserError || !envCheckUser) {
        return new Response(
          JSON.stringify({ error: "Session invalide" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check admin role
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdminEnvCheck = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: isAdminData } = await supabaseAdminEnvCheck.rpc("is_admin", { _user_id: envCheckUser.id });
      
      if (!isAdminData) {
        return new Response(
          JSON.stringify({ error: "Accès admin requis" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hasLovableKey = !!Deno.env.get("LOVABLE_API_KEY");
      
      return new Response(
        JSON.stringify({ 
          hasLovableKey, 
          provider: hasLovableKey ? "lovable-ai" : "none"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Check rate limit
    const today = new Date().toISOString().split("T")[0];
    
    // Use service role for rate limit operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create usage record
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("ai_usage_daily")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();

    if (usageError) {
      console.error("Usage check error:", usageError);
    }

    const currentCount = usageData?.count || 0;
    const DAILY_LIMIT = 20;

    if (currentCount >= DAILY_LIMIT) {
      console.log("Rate limit exceeded for user:", user.id, "count:", currentCount);
      
      // Log rate limit hit to admin_audit_logs
      await supabaseAdmin
        .from("admin_audit_logs")
        .insert({
          action: "rate_limit_hit",
          target_id: user.id,
          target_type: "user",
          metadata: { 
            day: today, 
            count: currentCount, 
            limit: DAILY_LIMIT,
            endpoint: "tarot-interpretation"
          }
        });

      return new Response(
        JSON.stringify({ 
          error: "Limite quotidienne atteinte",
          message: `Vous avez atteint la limite de ${DAILY_LIMIT} interprétations par jour. Revenez demain !`,
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const payload: RequestPayload = await req.json();
    console.log("Request payload:", JSON.stringify(payload));

    if (!payload.cards || payload.cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune carte fournie" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, intention, preferred_domain")
      .eq("id", user.id)
      .single();

    // Get card details from database
    const cardIds = payload.cards.map(c => c.card_id);
    const { data: cardsData, error: cardsError } = await supabase
      .from("tarot_cards")
      .select("id, nom_fr, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr")
      .in("id", cardIds);

    if (cardsError || !cardsData || cardsData.length === 0) {
      console.error("Cards fetch error:", cardsError);
      return new Response(
        JSON.stringify({ error: "Cartes non trouvées" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build card context
    interface CardContext {
      card_id: string;
      name_fr: string;
      type: string;
      numero: number | null;
      orientation: "upright" | "reversed";
      position_key: string;
      meaning: string | null;
      keywords: string[];
    }
    
    const cardContextsRaw = payload.cards.map(c => {
      const cardData = cardsData.find(cd => cd.id === c.card_id);
      if (!cardData) return null;
      
      const meaning = c.orientation === "upright" 
        ? cardData.meaning_upright_fr 
        : cardData.meaning_reversed_fr;
      
      return {
        card_id: c.card_id,
        name_fr: cardData.nom_fr as string,
        type: cardData.type as string,
        numero: cardData.numero as number | null,
        orientation: c.orientation,
        position_key: c.position_key,
        meaning: meaning as string | null,
        keywords: (cardData.keywords_fr || []) as string[]
      };
    });
    
    const cardContexts = cardContextsRaw.filter((c): c is CardContext => c !== null);

    // Detect sensitive topics in question
    const sensitivePatterns = {
      medical: /\b(maladie|cancer|médecin|santé|diagnostic|guérir|mourir|mort|symptôme|traitement|médicament|opération|chirurgie|dépression|anxiété|suicide)\b/i,
      legal: /\b(procès|avocat|tribunal|jugement|condamn|prison|divorce|garde|juridique|légal|plainte|litige)\b/i,
      financial: /\b(investir|bourse|actions|bitcoin|crypto|prêt|crédit|dette|faillite|héritage|placement|trader)\b/i
    };

    const questionLower = (payload.question || "").toLowerCase();
    const hasMedicalTopic = sensitivePatterns.medical.test(questionLower);
    const hasLegalTopic = sensitivePatterns.legal.test(questionLower);
    const hasFinancialTopic = sensitivePatterns.financial.test(questionLower);

    // Build the prompt
    const systemPrompt = `Tu es un tarologue expert du Tarot de Marseille avec 30 ans d'expérience. Tu pratiques une approche bienveillante et introspective du tarot.

STYLE ET TON:
- Ton mystique et premium, jamais fataliste ni alarmiste
- Langage évocateur avec métaphores lumineuses (aube, lumière, chemin, transformation)
- Français soutenu mais accessible
- Toujours bienveillant et encourageant
- Privilégie le Tarot de Marseille, mentionne le Rider-Waite seulement si pertinent

RÈGLES DE SÉCURITÉ ABSOLUES:
- Tu ne donnes JAMAIS d'avis médical, juridique ou financier
- Si la question touche ces domaines sensibles, tu DOIS:
  1. Rediriger vers un professionnel qualifié
  2. Proposer une lecture symbolique et introspective à la place
  3. Rappeler les limites du tarot dans la section "safety"
- Tu ne prédis jamais la mort, la maladie grave ou les catastrophes
- Tu rappelles toujours le libre arbitre de l'utilisateur

${hasMedicalTopic ? "⚠️ ATTENTION: La question semble concerner la santé. Tu DOIS recommander de consulter un médecin et proposer une lecture symbolique uniquement." : ""}
${hasLegalTopic ? "⚠️ ATTENTION: La question semble concerner un aspect juridique. Tu DOIS recommander de consulter un avocat et proposer une lecture symbolique uniquement." : ""}
${hasFinancialTopic ? "⚠️ ATTENTION: La question semble concerner les finances. Tu DOIS recommander de consulter un conseiller financier et proposer une lecture symbolique uniquement." : ""}

STRUCTURE DE RÉPONSE:
Tu dois répondre UNIQUEMENT en JSON valide selon ce schéma exact:
${JSON_SCHEMA}

IMPORTANT: Ta réponse doit être UNIQUEMENT le JSON, sans aucun texte avant ou après, sans bloc markdown.`;

    const userContext = profile ? 
      `Contexte utilisateur: ${profile.display_name ? `Pseudo: ${profile.display_name}. ` : ""}${profile.intention ? `Intention générale: ${profile.intention}. ` : ""}${profile.preferred_domain ? `Domaine de prédilection: ${profile.preferred_domain}.` : ""}` : "";

    const userPrompt = `${userContext}

Question posée: ${payload.question || "Pas de question spécifique, guidance générale demandée."}

Type de tirage: ${payload.spread_id}

Carte tirée:
${cardContexts.map(c => `- ${c.name_fr} (${c.type === "major" ? "Arcane Majeur" : "Arcane Mineur"}${c.numero !== null ? ` #${c.numero}` : ""})
  Orientation: ${c.orientation === "upright" ? "À l'endroit" : "Renversée"}
  Position: ${c.position_key}
  Signification de base: ${c.meaning || "Non disponible"}
  Mots-clés: ${c.keywords?.join(", ") || "N/A"}`).join("\n\n")}

Génère une interprétation mystique, bienveillante et personnalisée pour les 4 domaines (général, amour, travail, finances). Réponds UNIQUEMENT en JSON valide.`;

    console.log("Calling Lovable AI...");

    // Use Lovable AI - no API key required from user
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("Missing LOVABLE_API_KEY - Lovable AI not configured");
      return new Response(
        JSON.stringify({ error: "Configuration IA manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lovable AI configuration - using Gemini Flash for balanced cost/performance
    const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const AI_MODEL = "google/gemini-2.5-flash";
    
    console.log("Using provider: Lovable AI, model:", AI_MODEL);

    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service IA temporairement indisponible, réessayez dans quelques instants" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Lovable AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("No content from AI");
      throw new Error("No AI response content");
    }

    console.log("AI raw response length:", rawContent.length);

    // Parse JSON response (handle markdown code blocks)
    let interpretation: TarotInterpretation;
    try {
      // Remove markdown code block if present
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      interpretation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw:", rawContent.substring(0, 500));
      
      // Fallback interpretation
      const cardName = cardContexts[0]?.name_fr || "La carte tirée";
      const cardMeaning = cardContexts[0]?.meaning || "Une période de transformation";
      
      interpretation = {
        title: `Guidance de ${cardName}`,
        summary: `${cardName} vous invite à une profonde réflexion sur votre chemin actuel. ${cardMeaning}.`,
        interpretation: {
          general: "Cette carte vous encourage à faire confiance à votre intuition et à accueillir les changements qui se présentent. Prenez le temps de méditer sur son message.",
          love: "Dans le domaine affectif, cette énergie vous invite à l'authenticité et à l'ouverture du cœur. Les relations sincères sont favorisées.",
          work: "Professionnellement, c'est le moment d'évaluer vos ambitions et de faire des choix alignés avec vos valeurs profondes.",
          money: "Sur le plan financier, la prudence et la réflexion sont de mise. Évitez les décisions impulsives."
        },
        advice: [
          "Prenez un moment de calme pour méditer sur le message de cette carte",
          "Notez vos impressions et ressentis dans votre journal",
          "Faites confiance à votre intuition pour les décisions à venir"
        ],
        reflection_questions: [
          "Qu'est-ce que cette carte éveille en vous ?",
          "Dans quel domaine de votre vie son message résonne-t-il le plus ?"
        ],
        safety: {
          medical: "Pour toute question de santé, consultez un professionnel médical qualifié.",
          legal: "Pour tout aspect juridique, adressez-vous à un avocat ou conseiller juridique.",
          financial: "Pour vos décisions financières importantes, consultez un conseiller financier agréé."
        }
      };
    }

    // Ensure safety section is always present
    if (!interpretation.safety) {
      interpretation.safety = {
        medical: "Pour toute question de santé, consultez un professionnel médical qualifié.",
        legal: "Pour tout aspect juridique, adressez-vous à un avocat ou conseiller juridique.",
        financial: "Pour vos décisions financières importantes, consultez un conseiller financier agréé."
      };
    }

    // Update rate limit counter
    const { error: upsertError } = await supabaseAdmin
      .from("ai_usage_daily")
      .upsert({
        user_id: user.id,
        day: today,
        count: currentCount + 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,day"
      });

    if (upsertError) {
      console.error("Usage upsert error:", upsertError);
    }

    // Log successful interpretation to admin_audit_logs
    await supabaseAdmin
      .from("admin_audit_logs")
      .insert({
        action: "tarot_interpretation_generated",
        target_id: user.id,
        target_type: "user",
        metadata: { 
          day: today, 
          count: currentCount + 1,
          spread_id: payload.spread_id,
          card_ids: cardIds,
          has_question: !!payload.question
        }
      });

    console.log("Interpretation generated successfully, new count:", currentCount + 1);

    return new Response(
      JSON.stringify(interpretation),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
