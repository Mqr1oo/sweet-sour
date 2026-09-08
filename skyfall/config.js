/* ===========================================================================
   Sablon pentru un local nou. Copiaza folderul, redenumeste-l (numele devine
   calea din URL) si completeaza campurile de mai jos.

   Cheia publicabila e menita sa fie vizibila in browser; RLS decide ce se poate
   citi si scrie. Cheia `service_role` nu se pune NICIODATA aici.
   =========================================================================== */
window.SS_CONFIG = {
  SUPABASE_URL: 'https://INLOCUIESTE-CU-PROIECTUL-TAU.supabase.co',
  SUPABASE_KEY: 'sb_publishable_INLOCUIESTE_CU_CHEIA_TA',

  NUME:      'Skyfall',
  SUBTITLU:  '',
  TAGLINE:   'Completeaza aici descrierea localului.',
  TAGLINE_EN:'Write the venue description here.',
  ORAS:      'Piatra Neamt',
  MONEDA:    'lei',

  // Pune sigla in icons/logo.png. Daca lipseste, se afiseaza NUME ca text.
  LOGO: 'icons/logo.png',

  GOOGLE_REVIEW: '',

  CULORI: {
    '--bg-base':     '#0b0f1c',
    '--bg-card':     '#131a2e',
    '--ink':         '#f2ece0',
    '--ink-soft':    '#96a0bb',
    '--pink-main':   '#2f3f6b',
    '--pink-bright': '#8fb0f0',
    '--brass':       '#e8a33d'
  }
};
