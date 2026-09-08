// Edge Function: trimite notificari Web Push cand intra o comanda noua.
//
// Este apelata de un trigger din baza de date (pg_net) la fiecare INSERT in
// `comenzi`. Alege destinatarii dupa sectiune si rol, apoi trimite push catre
// toate dispozitivele lor inregistrate in `push_subscriptions`.
//
// Secrete necesare (Supabase -> Edge Functions -> Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@sweetandsour.ro";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Comanda = {
  id: number;
  mesa: string;
  sectiune: string;
  status: string;
  produse: Array<{ nume: string; cantitate: number }>;
};

/** Cine trebuie sa fie trezit pentru comanda asta. */
function destinatari(c: Comanda): string[] {
  const text = JSON.stringify(c.produse ?? []);
  const esteAlerta = text.includes("ALERTĂ OSPĂTAR");

  if (esteAlerta) return ["ospatar", "bar", "director"];

  return c.sectiune === "bucatarie"
    ? ["bucatarie", "director"]
    : ["bar", "director"];
}

function continut(c: Comanda) {
  const text = JSON.stringify(c.produse ?? []);
  const esteAlerta = text.includes("ALERTĂ OSPĂTAR");

  const linii = (c.produse ?? [])
    .filter((p) => (p.cantitate ?? 0) > 0)
    .map((p) => `${p.cantitate}× ${p.nume}`)
    .join(", ");

  if (esteAlerta) {
    return {
      title: `🔔 Masa ${c.mesa}`,
      body: (c.produse?.[0]?.nume ?? "Solicitare").replace("🔔 ALERTĂ OSPĂTAR: ", ""),
      tag: `alerta-${c.mesa}`,
    };
  }

  return {
    title: `🛎️ Comanda noua — Masa ${c.mesa}`,
    body: linii.slice(0, 180) || "Comanda noua",
    tag: `comanda-${c.id}`,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let comanda: Comanda;
  try {
    const body = await req.json();
    comanda = body.record ?? body;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (!comanda?.id) return new Response("Fara comanda", { status: 400 });

  const roluri = destinatari(comanda);

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .in("rol", roluri);

  if (error) {
    console.error("Eroare la citirea abonamentelor:", error.message);
    return new Response("DB error", { status: 500 });
  }
  if (!subs?.length) {
    return new Response(JSON.stringify({ trimise: 0, motiv: "niciun dispozitiv" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({
    ...continut(comanda),
    comandaId: comanda.id,
    sectiune: comanda.sectiune,
    url: "./dashboard.html",
  });

  const moarte: string[] = [];
  let trimise = 0;

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        payload,
        { TTL: 600, urgency: "high" },
      );
      trimise++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        moarte.push(s.endpoint);
      } else {
        console.error("Push esuat:", e?.statusCode, e?.body ?? e?.message);
      }
    }
  }));

  if (moarte.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", moarte);
  }

  return new Response(JSON.stringify({ trimise, sterse: moarte.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
