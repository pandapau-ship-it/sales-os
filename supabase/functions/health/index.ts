// health — minimaler Health-Endpoint (B-1 Stub, Punkt 5/F).
// Zweck: Andockpunkt für den EXTERNEN Uptime-Ping (B-2-Außenschicht, B2). Der Ping ruft alle 15 Min
// diesen Endpoint — fällt Supabase/alles aus, meldet der externe Dienst. Kein Auth (öffentlich zugänglich):
// beim Deploy `--no-verify-jwt` bzw. verify_jwt=false setzen. Bewusst schlank; Ausbau (echte Health-
// Checks: Cron-Frische, Queue-Längen) folgt in B-2/B-4 über cron_runs/system_alerts.
Deno.serve(() =>
  new Response(
    JSON.stringify({ status: "ok", ts: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" } },
  )
);
