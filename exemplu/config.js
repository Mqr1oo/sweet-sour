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

  NUME:      'Meniu digital',
  SUBTITLU:  'Demonstratie',
  TAGLINE:   'Asa arata meniul pe telefonul clientului. Alege ceva, adauga in comanda si trimite — e o demonstratie, nu pleaca nicio comanda.',
  TAGLINE_EN:'This is how the menu looks on a customer phone. It is a demo, no order is actually sent.',
  ORAS:      '',
  MONEDA:    'lei',
  LOGO:      '',
  GOOGLE_REVIEW: '',

  CULORI: {
    '--bg-base':'#101013','--bg-card':'#1a1a1f','--bg-panel':'#202027','--bg-elevated':'#2a2a32',
    '--ink':'#f4f2ee','--ink-soft':'#9a9aa4','--pink-main':'#3a3a46','--pink-bright':'#c9c2b4',
    '--brass':'#c9a86a','--brass-soft':'#e3ceA0','--paper-dim':'#2c2c34','--coral':'#d4674e'
  }
};
