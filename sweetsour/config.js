/* ===========================================================================
   Sweet & Sour — configurare Supabase
   ---------------------------------------------------------------------------
   Singurul loc din proiect unde se scriu URL-ul si cheia. index.html si
   dashboard.html citesc amandoua de aici, ca sa nu ajunga niciodata sa fie
   configurate diferit.

   Inlocuieste cele doua valori cu ale proiectului tau:
     Supabase -> Project Settings -> API
       - Project URL              -> SUPABASE_URL
       - Publishable key          -> SUPABASE_KEY  (incepe cu sb_publishable_)

   Cheia publicabila e menita sa fie vizibila in browser; ea NU da acces la
   date prin ea insasi, pentru ca RLS decide ce se poate citi si scrie.
   Cheia `service_role` nu se pune NICIODATA aici — doar in Vault / Edge
   Function Secrets, pe server.
   =========================================================================== */
window.SS_CONFIG = {
  SUPABASE_URL: 'https://cjavzdnsebbkiiefigvi.supabase.co',
  SUPABASE_KEY: 'sb_publishable_2pItY__W7_6nbKWy_ZMytw_t4EfovN8'
};
