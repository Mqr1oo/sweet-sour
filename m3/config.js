/* ===========================================================================
   M3 Coffee & Lounge — configurarea localului
   ---------------------------------------------------------------------------
   Singurul fisier care difera intre localuri. index.html, dashboard.html si
   sw.js sunt identice peste tot, ca sa poti copia folderul pentru un client nou
   si sa schimbi doar de aici.

   Cheia publicabila e menita sa fie vizibila in browser; RLS decide ce se poate
   citi si scrie. Cheia `service_role` nu se pune NICIODATA aici.
   =========================================================================== */
window.SS_CONFIG = {
  // --- Supabase ---
  SUPABASE_URL: 'https://cjavzdnsebbkiiefigvi.supabase.co',
  SUPABASE_KEY: 'sb_publishable_2pItY__W7_6nbKWy_ZMytw_t4EfovN8',

  // --- Identitate ---
  NUME:      'M3',
  SUBTITLU:  'Coffee & Lounge',
  TAGLINE:   'Cafenea si lounge in Gradina „Nicu Albu”, Piatra Neamt. Cafea de specialitate, mic dejun toata ziua si seri lungi.',
  TAGLINE_EN:'Coffee shop and lounge in „Nicu Albu” Garden, Piatra Neamt. Specialty coffee, all-day breakfast and long evenings.',
  ORAS:      'Piatra Neamt',
  MONEDA:    'lei',

  // Sigla apare in antetul meniului. Pusa in icons/ ca fisier separat, ca sa
  // poata fi inlocuita fara sa se umble in cod.
  LOGO: 'icons/logo.png',

  // Link-ul de recenzie Google: Google Maps -> localul tau -> Scrie o recenzie,
  // apoi copiezi adresa din bara browserului.
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

  // --- Culori ---
  // Monocrom, ca sigla. Un singur accent cald, de espresso.
  CULORI: {
    '--bg-base':     '#000000',
    '--bg-card':     '#0e0e0e',
    '--bg-panel':    '#151515',
    '--bg-elevated': '#1c1c1c',
    '--ink':         '#f6f4f0',
    '--ink-soft':    '#8e8e8e',
    '--pink-main':   '#2a2a2a',
    '--pink-bright': '#ffffff',
    '--brass':       '#c8a07a',
    '--brass-soft':  '#e0c4aa',
    '--paper-dim':   '#242424',
    '--coral':       '#c96a4e'
  }
};
