/* ===========================================================================
   DEMO — meniu de prezentare, fara backend.
   ---------------------------------------------------------------------------
   Nu se conecteaza la niciun Supabase: meniul vine din meniu-demo.json, iar
   comenzile nu pleaca nicaieri. E facut ca sa poti arata produsul oricui, de pe
   orice link, fara sa atingi datele unui local real.

   Ca sa devina un local adevarat: copiaza folderul unui local existent (nu
   acesta), pune URL-ul si cheia proiectului lui Supabase in config.js.
   =========================================================================== */
window.SS_CONFIG = {
  DEMO: true,
  MENIU_DEMO: 'meniu-demo.json',

  SUPABASE_URL: '',
  SUPABASE_KEY: '',

  NUME:      'Meniu Digital',
  SUBTITLU:  'Prezentare',
  TAGLINE:   'Clientul scaneaza, alege si comanda direct de pe telefon. Fara aplicatii instalate, fara hartie.',
  TAGLINE_EN:'The customer scans, picks and orders straight from their phone. No app to install, no paper menu.',
  ORAS:      '',
  MONEDA:    'lei',
  LOGO:      '',
  GOOGLE_REVIEW: '',

  // --- Protectia datelor (apar in politica de confidentialitate din meniu) ---
  // Denumirea legala a firmei care opereaza localul, adresa sediului si o
  // adresa de email la care clientii isi pot exercita drepturile GDPR.
  // Daca raman goale, politica foloseste numele localului si „personalul localului".
  OPERATOR:   '',
  ADRESA:     '',
  EMAIL_GDPR: '',
  // Cine pune la dispozitie meniul digital (firma ta). Apare in termeni si
  // in politica, ca furnizor al instrumentului — nu ca vanzator al
  // produselor. Contactul e doar pentru probleme tehnice.
  PLATFORMA:       '',
  EMAIL_PLATFORMA: '',

  CULORI: {
    '--bg-base':'#101013','--bg-card':'#1a1a1f','--bg-panel':'#202027','--bg-elevated':'#2a2a32',
    '--ink':'#f4f2ee','--ink-soft':'#9a9aa4','--pink-main':'#3a3a46','--pink-bright':'#c9c2b4',
    '--brass':'#c9a86a','--brass-soft':'#e3ceA0','--paper-dim':'#2c2c34','--coral':'#d4674e'
  }
};
