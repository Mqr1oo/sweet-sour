# Platformă meniuri digitale

Un domeniu, mai multe localuri. Fiecare local are aplicația lui (meniu pentru
clienți + panou de personal) și **propriul proiect Supabase**, complet izolat.

```
Platforma/
├─ index.html            pagina de start: lista localurilor
├─ m3/                   → domeniu.ro/m3
├─ sweetandsour/         → domeniu.ro/sweetandsour
│  ├─ index.html         meniul clienților (RO / EN)
│  ├─ dashboard.html     panoul de personal
│  ├─ config.js          ⚠️ SINGURUL fișier care diferă între localuri
│  ├─ manifest.json, sw.js, icons/, images/
├─ qr/                   generator de coduri QR (unealtă separată)
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
| M3 Coffee & Lounge | `cjavzdnsebbkiiefigvi` | eu-central-1 |
| Sweet & Sour | `wnwllyyhtkufcejzjeay` | eu-west-1 |
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

Unealtă separată, la `domeniu.ro/qr/`. Nu mai e în dashboard: e ceva ce faci o
dată, la deschidere sau când mai adaugi mese, nu în timpul turei — n-avea ce
căuta lângă comenzile active.

Ce poate:

- **Numere de masă** scrise ca listă (`1, 2, 5`), ca interval (`1-12`) sau ca
  nume (`Terasa1`, `Bar2`). Le poți amesteca.
- **Numele localului** scris pe fiecare cod.
- **Descărcare SVG**, individual sau toate odată. SVG înseamnă că poți mări
  codul la orice dimensiune fără să se pixeleze — de la autocolant de 5 cm la
  panou de perete.
- **Simbol contactless (NFC)** opțional, dacă pui și tag-uri NFC pe mese.
- **Chenar punctat** pentru tăiere, și printare 3 pe rând.

Totul se generează în browser. Nu trimite nimic nicăieri și merge fără internet
odată încărcată pagina — utilă când trebuie să reprintezi un cod și netul e picat.

Simbolul contactless e desenat generic (trei unde). Nu e N-Mark-ul oficial NFC
Forum, care e marcă înregistrată.

Codul duce la `.../m3/index.html?mesa=4`, deci clientul nu mai scrie
numărul mesei și nu mai ajung comenzi la masa greșită.

**Scanează un cod cu telefonul înainte să printezi 40.** Dacă adresa de bază e
greșită, afli acum, nu după ce le-ai lipit pe mese.

## Panoul directorului

Era o coloană de 12 panouri stivuite, în ordinea în care fuseseră adăugate.
Acum e împărțit în cinci secțiuni, grupate după ce faci:

| Secțiune | Ce conține |
|---|---|
| **Sinteză** | încasări, comenzi servite, evoluție, harta orelor de vârf, top 5 produse |
| **Meniu** | editorul de produse |
| **Setări** | mod aglomerat, mod fără ospătari |
| **Personal** | raport pe angajat, anulări suspecte, bonuri neconfirmate, păreri interne |
| **Risc** | ștergerea istoricului |

Graficele și rapoartele se calculează doar când deschizi secțiunea lor, nu toate
odată la intrarea în panou.

## Totul se actualizează instant

Aplicația apela `.subscribe()` pe `comenzi`, `stoc_produse` și
`jurnal_activitate` — dar publicația `supabase_realtime` era **goală**. Postgres
nu trimitea niciun eveniment, iar tot ce părea „live" era de fapt polling la
30–120 de secunde. Frontend-ul era scris corect; îi lipsea partea de bază de
date.

Am adăugat cele patru tabele în publicație și le-am pus `replica identity full`
— fără asta, evenimentele de UPDATE și DELETE ajung doar cu cheia primară, iar
codul care citește `p.new.actiune` primește câmpuri goale.

Ce se propagă acum instant, pe toate telefoanele din tură:

| Schimbare | Cine o vede imediat |
|---|---|
| Mod aglomerat pornit/oprit | clienții (banner) și tot personalul |
| Mod fără ospătari | tot personalul, butoanele se schimbă pe loc |
| Preț sau produs modificat | clienții care au meniul deschis |
| Produs marcat epuizat | clienții |
| Comandă nouă / schimbare de stare | barul, bucătăria, ospătarii |
| Plan de sală modificat | tot personalul |

Când meniul se schimbă sub un client care tocmai comanda, coșul lui rămâne
intact; dispar doar produsele scoase din meniu între timp. Iar dacă directorul
editează meniul chiar în acel moment, modificările lui nesalvate nu sunt
suprascrise de actualizarea live.

## Aplicatia instalabila e doar pentru personal

`dashboard.html` e singurul care se instaleaza pe telefon: are `manifest.json`,
service worker si notificari push. Se deschide de zeci de ori pe tura, deci merita
sa porneasca instant si sa mearga si cand netul are sughituri.

`index.html` — meniul clientilor — e un site obisnuit. Se deschide de la codul QR,
se foloseste o data si se inchide. Nu are manifest, nu inregistreaza service
worker, nu apare invitatia de instalare si nu ramane nimic in cache pe telefonul
clientului.

Un detaliu care conteaza: scope-ul unui service worker e folderul din care e
inregistrat, deci cel al dashboard-ului acopera si meniul clientilor. L-am facut
sa lase meniul sa treaca direct la retea — altfel un client ar fi putut vedea
preturi vechi din cache.

Meniul **nu** dezinstaleaza service worker-ul existent, desi ar parea curat sa o
faca: `getRegistrations()` intoarce toate inregistrarile de pe origine, deci ar
sterge-o si pe cea a dashboard-ului. Un barman care deschide meniul de pe
telefonul lui si-ar taia singur notificarile push.

## Un local, un prefix de stocare

Toate localurile stau pe același domeniu, deci împart același `localStorage`.
Fără prefix, coșul și masa s-ar amesteca între ele: adaugi două cafele la M3,
treci la alt local și le găsești acolo. Prefixul se derivă automat din folder
(`meniu:/m3:`), deci nu e nimic de configurat când adaugi un local nou.

## Verificare inainte de lansare

Rulata pe baza reala, cu rolurile reale. Ce a trecut:

| Test | Rezultat |
|---|---|
| Comanda cu pret falsificat (5 lei in loc de 54) | salvata la **54 lei** |
| Produs inventat, inexistent in meniu | respins |
| Bar marcheaza „Gata" | permis |
| Bar incearca sa schimbe totalul | respins |
| Ospatar confirma bonul | respins (doar barul poate) |
| Bar confirma bonul | permis |
| Ospatar marcheaza „Servit" | permis |
| Ospatar sterge comanda | niciun rand atins |
| Director corecteaza totalul | permis |
| Comanda la pachet | nume si telefon mutate in `contacte_takeaway` |
| Client anonim citeste contactele | refuzat, nici grant nu are |
| Alerta de la masa (cere nota) | acceptata, total 0 |
| Impartire bar / bucatarie | doua comenzi, acelasi `grup_comanda` |

Cele 4 job-uri cron ruleaza si raporteaza `succeeded`.

## Ce a fost reparat la verificare

**Nimeni nu putea adauga nimic in cos.** `id_produs` din baza e text, dar
`onclick` il scria neghilimelat, deci ajungea numar; cautarea folosea `===`, iar
`"1" !== 1`. Cu `menu.json` era numar si mergea — s-a rupt cand am mutat meniul
in baza de date. Butonul „+" nu facea nimic, fara nicio eroare in consola.

**Stergerea istoricului nu functiona.** Promptul cerea sa scrii `STERGE`, codul
verifica `ELIMINAR`, iar mesajul de eroare era in spaniola.

Plus ultimele texte spaniole din panoul de personal (harta orelor, raportul pe
angajat, anuntul vocal pentru comenzile la pachet, starile meselor).

## Un risc de productie ramas

`index.html` si `dashboard.html` incarca biblioteca Supabase de pe un CDN
(`cdn.jsdelivr.net`). Daca acel CDN e indisponibil, aplicatia nu porneste deloc —
nici macar dashboard-ul instalat, pentru ca service worker-ul nu pune in cache
fisiere de pe alt domeniu. Pentru un sistem care tine casa, merita descarcata
biblioteca local, langa `config.js`. Nu am facut-o inca.

## Conturi de personal

**M3 Coffee & Lounge** (`@m3coffe.com`): director, bar, bucatarie, ospatar1-3.

**Sweet & Sour** (`@alibretto.com`, mostenite din proiectul anterior): jefe
(director), bar, cocina (bucatarie), camarero1-8 (ospatari). Rolurile sunt
corecte, doar adresele au numele vechi. Daca vrei adrese noi, le creezi din
consola si rulezi din nou atribuirea de roluri — cele vechi pot fi sterse dupa.

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
