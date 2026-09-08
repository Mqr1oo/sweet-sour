/* ===========================================================================
   Skyfall — configurarea localului
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
  SUPABASE_URL: 'https://INLOCUIESTE-CU-PROIECTUL-SKYFALL.supabase.co',
  SUPABASE_KEY: 'sb_publishable_INLOCUIESTE_CU_CHEIA_SKYFALL',

  // --- Identitate ---
  NUME:      'Skyfall',
  TAGLINE:   'Completeaza aici descrierea localului.',
  TAGLINE_EN:'Write the venue description here.',
  ORAS:      'Piatra Neamt',
  MONEDA:    'lei',

  // Link-ul de recenzie Google. Il iei din Google Maps -> localul tau ->
  // Scrie o recenzie, si copiezi adresa din bara browserului.
  GOOGLE_REVIEW: 'https://search.google.com/local/writereview?placeid=INLOCUIESTE',

  // --- Culori (se aplica peste variabilele CSS) ---
  CULORI: {
    '--bg-base':    '#0d0b14',
    '--pink-main':  '#4a2f6b',
    '--pink-bright':'#b08ff0',
    '--brass':      '#d9a441'
  }
};
