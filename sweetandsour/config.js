/* ===========================================================================
   Sweet & Sour — configurarea localului
   ---------------------------------------------------------------------------
   Singurul fisier care difera intre localuri. index.html, dashboard.html si
   sw.js sunt identice peste tot, ca sa poti copia folderul pentru un client nou
   si sa schimbi doar de aici.

   Cheia publicabila e menita sa fie vizibila in browser; RLS decide ce se poate
   citi si scrie. Cheia `service_role` nu se pune NICIODATA aici.
   =========================================================================== */
window.SS_CONFIG = {
  // --- Supabase (proiect propriu, separat de M3) ---
  SUPABASE_URL: 'https://wnwllyyhtkufcejzjeay.supabase.co',
  SUPABASE_KEY: 'sb_publishable_yCycz19M9_HmXlRN1xjn1Q_5YhFtZPh',

  // --- Identitate ---
  NUME:      'Sweet & Sour',
  SUBTITLU:  'Cocktail bar & lounge',
  TAGLINE:   'Cocktail bar & lounge in Piatra Neamt. Cocktailuri, muzica la tonomat si seri lungi.',
  TAGLINE_EN:'Cocktail bar & lounge in Piatra Neamt. Cocktails, jukebox music and long evenings.',
  ORAS:      'Piatra Neamt',
  MONEDA:    'lei',

  LOGO: 'icons/logo.png',

  // Link-ul de recenzie Google: Maps -> localul tau -> Scrie o recenzie,
  // apoi copiezi adresa din bara browserului.
  GOOGLE_REVIEW: 'https://search.google.com/local/writereview?placeid=ChIJyzJWVP5VNUcRhjKpcE9ZqY8',

  // --- Culori: bleumarinul siglei + chihlimbarul de tonomat ---
  CULORI: {
    '--bg-base':     '#0b0f1c',
    '--bg-card':     '#131a2e',
    '--bg-panel':    '#1a2239',
    '--bg-elevated': '#232c47',
    '--ink':         '#f2ece0',
    '--ink-soft':    '#96a0bb',
    '--pink-main':   '#2f3f6b',
    '--pink-bright': '#8fb0f0',
    '--brass':       '#e8a33d',
    '--brass-soft':  '#f7cd84',
    '--paper-dim':   '#2a3350',
    '--coral':       '#e0563c'
  }
};
