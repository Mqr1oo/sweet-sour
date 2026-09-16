/* ===========================================================================
   ZeN Lounge Garden (fost Sweet & Sour) — configurarea localului
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
  // Cheia publica VAPID a notificarilor push (perechea ei privata sta in
  // secretele functiei edge `notifica-comanda`, in Supabase). Fiecare local
  // are perechea lui.
  VAPID_PUBLIC: 'BHKSXTQuMn8UiJ4E4udL6kNbE74nAhjHYzs5DYE9m2OIeLFNJNiClyUfbeSr3iexGcxS3IQgnF6wmYYplYVa3lU',

  // --- Identitate ---
  NUME:      'ZeN Lounge Garden',
  SUBTITLU:  'lounge garden',
  TAGLINE:   'O locatie deosebita in Piatra Neamt, perfecta pentru intalniri de afaceri sau pentru petreceri.',
  TAGLINE_EN:'A special place in Piatra Neamt, perfect for business meetings or parties.',
  INSTAGRAM: 'https://www.instagram.com/zen_lounge_garden/',
  ORAS:      'Piatra Neamt',
  MONEDA:    'lei',

  LOGO: 'icons/logo.svg',
  // sigla originala are litere verde inchis: in meniu si in panou sta pe un
  // card alb, ca sa se vada pe fundalul inchis (lasa gol daca sigla e deschisa)
  LOGO_FUNDAL: '#ffffff',

  // Link-ul de recenzie Google: Maps -> localul tau -> Scrie o recenzie,
  // apoi copiezi adresa din bara browserului.
  GOOGLE_REVIEW: 'https://search.google.com/local/writereview?placeid=ChIJyzJWVP5VNUcRhjKpcE9ZqY8',

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
  PLATFORMA:       'Ospi',
  EMAIL_PLATFORMA: '',

  // --- Culori: cele doua verzuri ale siglei (inchis pentru litere, deschis
  // pentru E) pe un fundal verde-noapte ---
  CULORI: {
    '--bg-base':     '#0f130c',
    '--bg-card':     '#171f12',
    '--bg-panel':    '#1e2818',
    '--bg-elevated': '#28341f',
    '--ink':         '#f3f1e8',
    '--ink-soft':    '#a5b097',
    '--pink-main':   '#3f5a2a',
    '--pink-bright': '#9fd07f',
    '--brass':       '#8fc26c',
    '--brass-soft':  '#c4e3a8',
    '--paper-dim':   '#2b3822',
    '--coral':       '#e0563c'
  }
};
