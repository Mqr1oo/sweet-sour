/* ===========================================================================
   Sweet & Sour — configurarea localului
   ---------------------------------------------------------------------------
   Acesta e SINGURUL fisier care difera intre localuri. index.html, dashboard.html
   si sw.js sunt identice peste tot, ca sa poti copia folderul pentru un client
   nou si sa schimbi doar de aici.

   Ca sa adaugi un local nou:
     1. copiezi folderul asta si il redenumesti (devine calea din URL)
     2. creezi un proiect Supabase nou si rulezi supabase/01_schema.sql
     3. schimbi valorile de mai jos
     4. pui logo-ul in icons/ si pozele in images/

   Cheia publicabila e menita sa fie vizibila in browser; RLS decide ce se poate
   citi si scrie. Cheia `service_role` nu se pune NICIODATA aici.
   =========================================================================== */
window.SS_CONFIG = {
  // --- Supabase (propriu fiecarui local) ---
  SUPABASE_URL: 'https://cjavzdnsebbkiiefigvi.supabase.co',
  SUPABASE_KEY: 'sb_publishable_2pItY__W7_6nbKWy_ZMytw_t4EfovN8',

  // --- Identitate ---
  NUME:      'Sweet & Sour',
  TAGLINE:   'Cocktail bar & lounge in Piatra Neamt. Cocktailuri, muzica la tonomat si seri lungi.',
  TAGLINE_EN:'Cocktail bar & lounge in Piatra Neamt. Cocktails, jukebox music and long evenings.',
  ORAS:      'Piatra Neamt',
  MONEDA:    'lei',

  // Link-ul de recenzie Google. Il iei din Google Maps -> localul tau ->
  // Scrie o recenzie, si copiezi adresa din bara browserului.
  GOOGLE_REVIEW: 'https://search.google.com/local/writereview?placeid=ChIJyzJWVP5VNUcRhjKpcE9ZqY8',

  // --- Culori (se aplica peste variabilele CSS) ---
  CULORI: {
    '--bg-base':    '#0b0f1c',
    '--pink-main':  '#2f3f6b',
    '--pink-bright':'#8fb0f0',
    '--brass':      '#e8a33d'
  }
};
