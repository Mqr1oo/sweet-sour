# Platformă meniuri digitale

Un domeniu, mai multe localuri. Fiecare local are aplicația lui (meniu pentru
clienți + panou de personal) și **propriul proiect Supabase**, complet izolat.

```
Platforma/
├─ index.html            pagina de start: lista localurilor
├─ sweetandsour/         → domeniu.ro/sweetandsour
│  ├─ index.html         meniul clienților (RO / EN)
│  ├─ dashboard.html     panoul de personal
│  ├─ config.js          ⚠️ SINGURUL fișier care diferă între localuri
│  ├─ vendor/qrcode.js   generator de coduri QR (MIT, local)
│  ├─ manifest.json, sw.js, icons/, images/
├─ skyfall/              șablon gata de completat
└─ supabase/             SQL + scripturi, comune tuturor localurilor
```

Publici tot folderul `Platforma/` pe Cloudflare Pages. Rutarea pe cale merge
din prima, fără configurare: numele folderului **este** calea din URL.

## Cum adaugi un local nou

1. Copiezi folderul `skyfall/` și îl redenumești. Numele devine calea:
   `bistro/` → `domeniu.ro/bistro`.
2. Creezi un proiect Supabase nou și rulezi `supabase/01_schema.sql`.
3. Completezi `config.js` — URL, cheie publicabilă, nume, slogan, culori,
   link de recenzie Google.
4. Creezi conturile de personal (`supabase/creeaza_conturi_staff.py`) și le dai
   roluri.
5. Adaugi produsele din dashboard → panoul directorului → Meniu.
6. Adaugi localul în `index.html` (pagina de start) — un bloc `<a class="venue">`.

`index.html`, `dashboard.html` și `sw.js` sunt **identice** la toate localurile.
Tot ce e specific stă în `config.js`. Când repari ceva, copiezi cele trei fișiere
peste tot, fără să te uiți ce ai personalizat unde.

## Izolarea datelor

Fiecare local are proiectul lui Supabase. Nu împart nicio bază de date, deci un
local nu poate ajunge la comenzile, personalul sau încasările altuia — nici dacă
o politică RLS ar fi scrisă greșit. Separarea e la nivel de infrastructură, nu de
cod.

Costul: tier-ul gratuit Supabase permite 2 proiecte active per organizație. Al
treilea local înseamnă plan Pro, 25 $/lună pentru toate.

| Local | Proiect Supabase | Regiune |
|---|---|---|
| Sweet & Sour | `cjavzdnsebbkiiefigvi` | eu-central-1 |
| Skyfall | de creat | eu-central-1 recomandat |

## Meniul e în baza de date

Nu mai există `menu.json`. Meniul stă în tabela `meniu_produse` și se editează
din dashboard → panoul directorului → **Meniu**: nume, descriere, categorie,
secție, preț, activ/inactiv, plus descriere lungă (ingrediente, alergeni,
traducere în engleză) dacă apeși pe numele produsului.

Asta rezolvă o problemă reală din versiunea anterioară: prețul trăia în două
locuri — `menu.json` (ce vedea clientul) și `preturi_produse` (după ce
recalcula serverul). Dacă se desincronizau, clientul vedea un preț și plătea
altul. Acum e o singură sursă, iar serverul recalculează din exact ce vede
clientul.

Categoriile nu mai sunt scrise în cod: se deduc din produse, în ordinea din
coloana `ordine`. Adaugi o categorie nouă din dashboard și apare singură în meniu.

## Coduri QR pentru mese

Panoul directorului → **Coduri QR pentru mese**. Citește planul sălii, generează
câte un cod pentru fiecare masă și le pune la print, 3 pe rând, fără meniul
lateral. Codul deschide `.../sweetandsour/index.html?mesa=4`, deci clientul nu
mai scrie numărul mesei și nu mai ajung comenzi la masa greșită.

Biblioteca e inclusă local (`vendor/qrcode.js`, MIT), nu de pe un CDN: barul
trebuie să poată reprinta un cod și când pică internetul.

Înainte să printezi 40 de coduri, scanează unul cu telefonul. Dacă adresa de bază
e greșită, o afli acum, nu după ce le-ai lipit pe mese.

## Rolurile de personal

`director`, `bar`, `bucatarie`, `ospatar`. Se acordă din `staff_roles`, tabelă
care nu are nicio politică de scriere — se completează doar din consolă, cu
`service_role`. Nici directorul nu-și poate schimba rolul din aplicație.

**Mod fără ospătari** (panoul directorului): pentru turele fără nimeni pe sală,
barul și bucătăria închid singure comenzile și preiau cererile de la mese.
Rezervat strict directorului, ca un ospătar să nu poată ieși singur din propriul
flux de răspundere.

## Înainte de deschidere

1. Authentication → Providers → Email: **Allow new users to sign up** = oprit.
   (Nu „Enable email provider" — acela e logarea însăși.)
2. Pornește **Leaked password protection**.
3. Testează un ciclu complet: comandă de pe un telefon, o vezi la bar pe altul,
   „Gata" → ospătar → „Servit". Înainte să fie clienți în local.

## Ce mai lipsește

Meniul are 38 de produse cu **prețuri inventate**, ca punct de plecare.
Înlocuiește-le din dashboard înainte de deschidere.

Pozele din `images/` sunt placeholdere generate. Se înlocuiesc cu poze reale,
`N.webp`, unde N e `id_produs`.
