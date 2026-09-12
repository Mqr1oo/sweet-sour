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
├─ exemplu/              demo de prezentare, fără backend
├─ skyfall/              șablon gata de completat
└─ supabase/             SQL + scripturi, comune tuturor localurilor
```

Publici tot folderul `Platforma/` pe Cloudflare Pages. Rutarea pe cale merge
din prima, fără configurare: numele folderului **este** calea din URL.

## Cum adaugi un local nou

1. Copiezi folderul `skyfall/` și îl redenumești. Numele devine calea:
   `bistro/` → `domeniu.ro/bistro`.
2. Creezi un proiect Supabase nou și rulezi `supabase/01_schema.sql`, apoi
   `04_comenzi_live.sql` (acceptare, modificări din mers, închiderea zilei) și
   `05_fereastra_modificare.sql` (fereastra de modificare, setări citibile de
   clienți), `06_anulari_bonuri_pachet.sql` (motiv obligatoriu la anulare,
   bonul pe numele barmanului, comenzi la pachet opționale),
   `07_cod_anulare.sql` (codul zilei pentru anulări), `08_finalizata_la.sql`
   (ora închiderii comenzii), `09_manager.sql` (rolul `manager`) și
   `10_anulare_simpla.sql` (anularea cu motiv, fără cod; clientul modifică
   doar până e acceptată; managerul fără jurnal) și `11_zile_angajati_poze.sql`
   (ora de închidere pe zile, lista de angajați, nume + poză la anulare,
   bucket-ul privat `anulari`, managerul doar cu „ora de vârf") și
   `13_cod_lunar_delogare_zone.sql` (fără poze; codul lunii al managerului;
   delogarea personalului la ora închiderii; zonele ospătarilor). Pe M3 și
   Sweet & Sour a existat și un `12_poze_14_zile` (cron + funcție edge
   `curata-poze`) — a fost înlocuit de 13 și nu se mai rulează pe un proiect
   nou. Toate sunt deja aplicate pe M3 și Sweet & Sour.
3. Completezi `config.js` — URL, cheie publicabilă, nume, slogan, culori,
   link de recenzie Google.
4. Creezi conturile de personal (`supabase/creeaza_conturi_staff.py`) și le dai
   roluri.
5. Adaugi produsele din dashboard → panoul directorului → Meniu.
6. Adaugi localul în `index.html` (pagina de start) — un bloc `<a class="venue">`.

`index.html`, `dashboard.html` și `sw.js` sunt **aproape identice** la toate
localurile: diferă doar titlul, culorile din `:root` ale panoului, numele din
subsol și lista de categorii traduse. Tot restul stă în `config.js`. Când
repari ceva, faci modificarea pe `m3/` și o aplici ca patch pe celelalte
(`diff -u` + `patch`), apoi verifici cu `diff` că au rămas doar liniile
specifice.

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

## Comanda se acceptă, nu doar se face

Fluxul unei comenzi are acum un pas în plus, la început:

| Stare | Cine o pune | Ce vede clientul pe telefon |
|---|---|---|
| `noua` | intră singură | „Trimisă — așteaptă să fie văzută" |
| `acceptata` | barul / bucătăria apasă **„Acceptă"** pe card | „Acceptată — am văzut comanda, urmează să vină" |
| `finalizata` | barul / bucătăria apasă **„Gata"** (cu ospătari: ospătarul e anunțat s-o ia) sau **„Preluată"** (fără ospătari) | „Preluată. Poftă bună!" |
| `anulata` | bar / ospătar (cu codul lunii) / manager, cu motiv și nume | „Anulată de Andrei: motivul" |

Starea stă în baza de date, nu pe telefon: când cineva acceptă de pe un
dispozitiv, alarma se oprește pe toate.

### Alarma de comandă nouă

Cât timp există o comandă `noua` pentru rolul curent, telefonul **nu tace**:

1. un bip scurt,
2. vocea spune, în română, „Comandă nouă, masa 4" (sau „la pachet") — doar
   cu butonul „Voce" pornit,
3. apoi o alarmă continuă — un „ding-dong" pe două note, undă triunghiulară,
   cu pauză între bătăi; se aude clar în bar fără să zgârie urechea — care
   ține **până apasă cineva „Acceptă"** pe card, nu până se termină un sunet.

Masa se spune **o singură dată**: o comandă cu bar și bucătărie vine ca două
rânduri și, fără asta, vocea zicea „masa patru" de două ori la rând. Textul
vorbit e cu diacritice („Comandă nouă, masa 4", „Masa 4 cheamă ospătarul"),
altfel vocea îl pronunța strâmb. **Directorul nu primește alarma** și nici
bipul.

Butonul **„Voce: ON / OFF"** chiar face ce spune: pornit, telefonul spune
masa la fiecare comandă nouă și la fiecare cerere de la mese (bucătăria
primește și lista de produse, barul notele clientului); oprit, rămân doar
bipurile și alarma ding-dong, fără niciun cuvânt. E pornit implicit, iar
alegerea rămâne pe dispozitiv (`localStorage`). Îl au barul, bucătăria,
ospătarul (masa la „Gata") și managerul (anulările). Bara roșie de sus („Am văzut, accept") nu mai există:
era același buton ca pe card, de două ori.

Browserele pornesc sunetul doar după un gest al utilizatorului. Alarma se
deblochează la prima atingere a ecranului și, dacă între timp a intrat o
comandă, pornește atunci. Ospătarii nu primesc bâzâitul (comenzile nu sunt ale
lor), dar primesc bip dublu și voce la cererile de la mese („Masa 4 cheamă
ospătarul: nota, cash").

### Clientul își poate scoate produse de pe telefon

Din bara de stare (apăsată) se deschide **fișa comenzii**: ce a trimis, cu
starea fiecărei părți (bar / bucătărie). Lângă fiecare produs e un „−": îl
scoate pe loc, iar la bar cardul clipește galben și vocea spune „Masa 4 și-a
modificat comanda: scos 1 Espresso". Dacă scoate tot, comanda se anulează, cu
nota „Anulată de client, de pe telefon".

Merge doar cât timp comanda e `noua` sau `acceptata`. Din momentul în care e
`gata`, telefonul refuză și îl trimite la ospătar.

Cum știe serverul că e comanda lui: la trimitere, telefonul generează un token
aleator, îl păstrează în `sessionStorage` și trimite doar hash-ul SHA-256
(`token_client_hash`). Funcția `client_modifica_comanda(id, token, produse)`
verifică hash-ul și permite **doar scoateri și scăderi de cantitate** — nimic
nou, niciun preț atins; totalul se recalculează din prețurile deja validate.
Un client anonim poate citi comenzile ultimelor 2 ore (politica existentă),
dar vede doar hash-ul, care nu se poate inversa.

### Ospătarul modifică o comandă în timp real

Clientul cheamă ospătarul și se răzgândește: pe orice card activ e un „✏️"
care deschide editorul — scoți, adaugi din meniu (doar produse din aceeași
secțiune), schimbi cantități, adaugi o notă. Salvarea trece prin
`staff_modifica_comanda(id, produse)`: prețurile produselor noi vin din
`meniu_produse`, cele deja comandate rămân la prețul de atunci, totalul se
recalculează pe server. Jurnalul păstrează „înainte" și „după".

Ospătarul vede acum și comenzile în lucru (mai șters, cu „acceptată, în
lucru"), ca să știe ce așteaptă fiecare masă și să le poată modifica. Numărul
de pe iconița „Comenzi" numără, pentru el, doar ce are de făcut: de dus la masă
și cereri de la mese.

Funcția pune un semnal tranzacțional (`app.modificare_permisa`) pe care
`protect_comanda_update` îl respectă; orice alt UPDATE rămâne restricționat ca
înainte.

### Fereastra de modificare

Cine poate schimba o comandă și când (regula e aplicată pe server, în cele
două funcții RPC; interfața doar o arată):

| Cine | Cât timp |
|---|---|
| clientul, de pe telefon | **doar cât e `noua`**; după acceptare cheamă ospătarul din fișa comenzii |
| ospătarul | cât e `noua`; apoi N minute de la trimitere |
| barul / bucătăria (cei care o pregătesc), managerul | oricând, cât e deschisă |

N e „Fereastra de modificare" din Șef → Setări (3/5/10/15/30 min, implicit 5),
rând `setari_modificare` în jurnal, scris doar de director. Pe card apare
„✏️ se mai poate modifica 3:20" (se reîmprospătează la 10 s); în fișa
comenzii clientul are aceeași numărătoare, la secundă, iar butoanele „−"
dispar când expiră.

### Modul fără ospătari, fără „Gata" și „Servit"

Când nu e nimeni pe sală, cel care pregătește o și duce, deci nu mai are rost
un pas „gata" separat. Cu **Mod fără ospătari** pornit, barul și bucătăria au
pe card doar: „Am văzut, accept" → **„Preluată"** (la pachet: „Ridicată"),
care închide comanda direct în `finalizata`. Clientul nu mai vede „gata": după
acceptare vede „🍹 Acceptată — băutura vine din moment în moment", „🍳 …
mâncarea se pregătește, vine în câteva minute", sau ambele, după ce a comandat.

Cu ospătari, pasul `gata` rămâne în panou (așa află ospătarul când să vină să
o ia), dar clientul nu-l vede ca „gata": vede „✅ Acceptată — vine acum la
masă", apoi „✔️ Preluată. Poftă bună!" în loc de „Servită".

Ca telefonul clientului să știe modul, `setari_ospatari`, `setari_modificare`
și `setari_pachet` au devenit citibile de clienții anonimi (alături de
`config_mese`, `setari_busy`, `mesa_liberada`).

### Anularea: motiv + nume + codul lunii

Cine poate anula: **barul, ospătarul și managerul** (bucătăria cere barului;
directorul doar observă). ✕ deschide o fereastră cu trei lucruri:

1. **motivul**, din listă („Clientul s-a răzgândit", „Produs epuizat",
   „Comandă greșită", „Clientul a plecat", „Timp de așteptare prea mare",
   „Greșeală la bar / bucătărie", „Retur: produsul nu a fost bun", „Alt
   motiv" + text de minim 5 litere);
2. **numele** celui care anulează, ales din lista pusă de director (Șef →
   Personal → „Angajați"; rândul `setari_angajati` din jurnal). Contul de bar
   e comun, deci fără nume nu s-ar ști cine a fost. Ultimul nume ales rămâne
   preselectat pe dispozitiv;
3. **codul lunii**: 6 cifre, unice pe lună, pe care le vede doar managerul
   (și directorul) în Șef → Setări → „Codul de anulare al lunii". Barul și
   ospătarul nu pot anula fără el — managerul îl spune când e de acord.
   Managerul anulează fără cod. Codul se generează singur la prima cerere din
   lună (`coduri_anulare`, RPC `cod_anulare_luna`); „Cod nou" îl schimbă dacă
   s-a aflat și rămâne în jurnal (`cod_anulare_nou`). Un cod greșit nu
   anulează nimic și se scrie în jurnal (`cod_anulare_gresit`, cu numele și
   masa) — directorul le vede în „Anulări".

Am încercat și **poza cu camera din față** la anulare (11/12): scoasă la
cererea proprietarului — personalul lucrează de pe telefoanele personale și
era prea invaziv. Politicile de storage sunt șterse, bucket-ul `anulari` e
gol (se poate șterge din Supabase → Storage), iar funcția `curata-poze`
rămâne publicată doar ca să nu strice nimic — se poate șterge și ea.

Se poate anula **și o comandă deja preluată** (retur): ✕ apare și în Istoric
la bar/manager și pe cardul „Gata — du-o la masă" al ospătarului.

Ce rămâne e **istoricul**: RPC-ul `anuleaza_comanda(p_id, p_motiv, p_nume,
p_cod)` scrie `comenzi.motiv_anulare`, `comenzi.anulat_de` și rândul
`pedido_cancelado` în jurnal (cine — nume + cont —, când, de ce, cu ce rol,
dacă a fost cu cod, starea de dinainte, dacă avea bon). Clientul vede pe
telefon **cine și de ce** — telefonul vibrează și fișa comenzii se deschide
singură cu „Anulată de Andrei · Motiv: Produs epuizat"; managerul aude pe loc
„Masa 4, comandă anulată de Andrei. Produs epuizat". Un UPDATE direct în
`anulata` sau în `anulat_de` e refuzat de trigger.

### Clientul modifică doar până e acceptată

De pe telefon se pot scoate produse **doar cât comanda e `noua`**. Din clipa
în care barul a acceptat-o, butoanele „−" dispar, iar în fișa comenzii apare
**„🙋 Cheamă ospătarul să schimbe comanda"**: trimite o cerere „Modificare
comandă" — la bar sună și se aude „Masa 4 vrea să schimbe comanda. Trimite
ospătarul", ospătarul o vede în aplicație — iar ospătarul modifică (✏️) sau
anulează (✕) comanda la masă. Un produs returnat merge pe același drum:
ospătarul scoate produsul din comandă sau, dacă e toată, o anulează cu motiv.
Fereastra de modificare (Setări) se aplică acum doar ospătarului.

### Bonul rămâne pe numele barmanului

„Confirmă bonul" din Istoric cere o confirmare cu totalul, iar serverul scrie
singur `bon_scos_de` și `bon_scos_la` (ce trimite ecranul e ignorat). Bifa
**nu se mai poate scoate de la bar** — dacă e o greșeală, o scoate directorul,
și rămâne în jurnal. Cardul arată „🧾 Bon confirmat de bar la 21:14", iar în
panoul directorului există „Bonuri confirmate (pe barman)": câte și cât, pe
fiecare cont, lângă „Bonuri neconfirmate".

### Comenzile la pachet sunt opționale

Șef → Setări → „Comenzi la pachet", implicit **oprit**: pasul „Cum vrei să
comanzi?" dispare cu totul (clientul e pus direct la masă). Pornit, apare și
„La pachet" (nume și telefon, șterse după 48 h). Rând `setari_pachet` în
jurnal, scris doar de director; telefonul așteaptă setarea cel mult 1,5 s
înainte să decidă.

### „Gata" închide comanda; ospătarul e anunțat

Cu ospătari, nu mai există pasul „Servit": barul/bucătăria apasă **„Gata"** și
comanda trece direct în `finalizata` (serverul scrie `finalizata_la`).
Telefonul ospătarului bipăie de două ori și spune „Masa 4, comanda e gata";
cardul rămâne în lista lui, albastru, „🍽️ Gata — du-o la masă (de 2 min)",
timp de 10 minute, apoi dispare singur. Clientul vede „Preluată" din clipa în
care barul a terminat-o. Fără ospătari, butonul e „Preluată".

### Directorul nu e deranjat

Contul de director nu primește nimic la comenzi: fără bip, fără alarmă, fără
bara „Am văzut, accept", fără butoane pe card (vede doar starea), fără push.
Managerul la fel, cu o singură excepție: aude anulările făcute de personal. Cererile de la mese (nota, ajutor) sună **doar la bar**: trei note
care coboară, apoi vocea „Masa 4 cere nota, cash" / „Masa 4 cere ajutor".
Ospătarul le vede în aplicație cu vibrație, fără sunet; push-ul pentru alerte
merge tot doar la bar (`notifica-comanda`, redeploy pe Sweet & Sour).

### Restul de dat

Pe cardul cererii de notă, ospătarul (sau barul, fără ospătari) vede totalul
mesei — toate comenzile de la ultima eliberare — și un câmp „Primit": restul
se calculează pe loc („mai lipsesc 3.00 lei" dacă nu ajunge).

### Tura

„🕒 Intru în tură / Ies din tură" în bara laterală (și 🕒 pe mobil): rânduri
`tura_start` / `tura_stop` în jurnal, pe contul curent. Directorul are „Ture
azi" în Personal: cine, de la cât la cât, câte ore. E informativ, nu pontaj
oficial.

### Informarea personalului (GDPR)

Jurnalul, numele la anulare, codul folosit și zonele sunt prelucrare de date
ale angajaților, deci localul (ca angajator = operator) trebuie să-i
informeze **înainte** (art. 13 GDPR). Panoul are, în bara laterală,
„Informare date personal (GDPR)": cine e operatorul (din `config.js`:
OPERATOR/NUME, ADRESA, EMAIL_GDPR) și împuternicitul (PLATFORMA), tabelul cu
fiecare dată — de ce, temei (interes legitim, art. 6 alin. 1 lit. f) și cât
timp (30 de zile) —, ce NU se face (fără cameră, microfon, locație, poze;
sesiunea se închide la ora închiderii), cine vede ce, drepturile și ANSPDCP.
Butonul „🖨️ Printează informarea, de semnat" deschide varianta de tipărit cu
rubrici de nume, dată și semnătură (angajat + angajator): fiecare angajat
semnează un exemplar înainte să folosească panoul. Textul e același la toate
localurile (vine din `config.js`), deci `dashboard.html` nu mai are nicio
linie cu numele localului.

Pe meniul clienților, politica spune explicit că aplicația nu folosește
camera sau microfonul și nu face poze clienților.

### Fără Face ID / amprentă

Passkey-urile (WebAuthn prin Supabase) au fost scoase la cererea
proprietarului: toată lumea intră cu email și parolă. Dacă vreodată revin,
codul a fost în `dashboard.html` până pe 12 septembrie 2026 (`arePasskey`,
`auth.signInWithPasskey`, `auth.registerPasskey`) și cere Authentication →
Passkeys pornit în Supabase, cu RP ID = domeniul public.

### Fonturile sunt locale

`fonturi/` (Fraunces, Work Sans, Inter, Space Mono, Playfair Display — latin +
latin-ext, 441 KB, licență OFL) e servit de pe același domeniu; niciun apel la
Google când se încarcă paginile, iar politica nu mai menționează Google LLC.

### Fișa comenzii împarte nota

Tot din fișa comenzii: **„Împarte nota"** — în părți egale sau pe produs
(fiecare plătește ce a comandat), cu bacșiș. Calculatorul e același cu cel din
coș, doar că lucrează pe ce a fost comandat efectiv în vizita asta.

## Fiecare masă cu timerul ei

În Sala, fiecare masă ocupată arată „⏱ 1h 05m" — de când e ocupată (prima
comandă de după ultima eliberare) și, dacă diferă, de când a comandat ultima
dată. Se reîmprospătează din minut în minut. Atingând masa, fereastra arată
amândouă valorile în clar.

### A cerut nota: mov, 15 minute, apoi liberă

Din clipa în care clientul cere nota, masa devine **mov** și pe card apare o
numărătoare inversă la secundă, „💳 12:34": are 15 minute să plătească și să
plece, apoi masa se eliberează singură (`mesa_liberada` automat, ca la
eliberarea manuală). Nu contează dacă ospătarul a apucat să confirme plata —
timpul curge de la cerere. Cererea de notă **neconfirmată** rămâne în lista de
comenzi și în bara „mese vor să plătească" și după eliberare, ca să nu dispară
fără s-o fi văzut cineva; ajutorul și cererile confirmate se curăță.

La verificare am găsit și reparat: alertele de ajutor în română („Ajutor /
Altceva") nu erau recunoscute de panou — regexul știa doar `Help`/`Ayuda`.

## Ce se întâmplă când pică legătura

Legătura „live" cu baza (websocket) moare fără să anunțe când telefonul stă
blocat sau când netul are sughițuri. Panoul se apără în patru feluri:

- când ecranul revine (`visibilitychange`) și când revine netul (`online`),
  reîncarcă tot din bază;
- oricum, din minut în minut, cât e vizibil;
- canalul realtime, când se reconectează, cere din nou totul;
- comenzile `noua` apărute între timp sunt anunțate ca și cum ar fi intrat
  atunci (bip, masă, bâzâit).

Fără net apare o bară galbenă sus. Meniul clientului face același lucru la
revenirea ecranului: reîncarcă starea comenzilor și setările.

## Consimțământul vine primul

Pe telefonul clientului, fereastra de întâmpinare are trei pași, în ordinea
asta: **1) stocarea locală** (textul de cookie, „Accept și continui", cu
buton spre politică), în limba browserului, fiindcă limba meniului nu e încă
aleasă; **2) limba**; **3) masa / la pachet** (sărit când pachetul e oprit).
Ghidul pornește abia după ce se închide fereastra. Bannerul de jos cu cookie
nu mai există — se punea peste ghid și peste alegerea limbii.

## Politica de confidențialitate și termenii

Meniul are o politică completă, în 11 secțiuni, în română și engleză, generată
din `config.js`: cine e operatorul (localul: `OPERATOR`, `ADRESA`,
`EMAIL_GDPR` — dacă lipsesc, cade pe numele localului și „personalul
localului") și cine e persoana împuternicită (platforma: `PLATFORMA`,
`EMAIL_PLATFORMA`, doar pentru probleme tehnice), ce date se
prelucrează și ce **nu** (fără cont, locație, urmărire, profilare, marketing),
temeiul legal pe articole, duratele reale de păstrare (comenzi 2 zile,
contacte la pachet 48 h, jurnal 30 de zile), împuterniciții (Supabase — UE,
Cloudflare; fonturile sunt servite local din `fonturi/`, fără niciun apel la
Google), măsurile de protecție,
drepturile și ANSPDCP, tabelul stocării locale, minori, alergeni, data
actualizării. Completează câmpurile din `config.js` înainte de deschidere.

Sub politică, în același ecran, sunt **Termenii și condițiile** (10 secțiuni,
RO/EN), scriși ca să separe clar rolurile: platforma e furnizor de instrument,
localul e vânzătorul. Contractul de vânzare e exclusiv între client și local;
localul răspunde singur de meniu, prețuri, gramaje, **alergeni**, siguranța și
calitatea alimentelor, bon fiscal, personal, notă; platforma nu răspunde
pentru niciuna dintre acestea, iar clientul cu alergii e obligat să anunțe
personalul înainte de a comanda. Mai sunt: utilizarea corectă (comenzi reale,
de la masa ta), reclamații (local / ANPC / ODR), proprietate intelectuală,
legea română. E un text solid, dar nu ține loc de avocat: înainte de a-l pune
în fața clienților, dă-l unui jurist să-l valideze pentru firma ta.

Am scos pozele de rezervă de pe internet (LoremFlickr / Unsplash): o poză
lipsă aducea o fotografie la întâmplare de pe alt site și trimitea IP-ul
clientului unui terț. Acum apare un cadru neutru desenat local. Panoul de
personal are și el un paragraf despre ce se reține despre angajați.

## Ora la care se închide ziua, pe zile

Panoul șefului → Setări → **„Ora de închidere, pe zile"**: o oră pentru
fiecare zi a săptămânii, fiindcă vineri și sâmbătă se închide mai târziu
decât marți. Ora e a zilei în care s-a deschis: „vineri 04:00" înseamnă
sâmbătă dimineața la 4. La ora aleasă (ora României), o dată pe zi:

- se eliberează toate mesele;
- comenzile rămase deschise (`noua`, `acceptata`, `gata`) trec pe `expirata`:
  nu apar în panou, în istoric sau în rapoarte, dar rămân în bază două zile;
- alertele de la mese (notă, ajutor) se șterg;
- **toate conturile de personal ies din aplicație**: cron-ul șterge
  `auth.sessions` pentru toți cei din `staff_roles`, iar panourile deschise
  văd rândul `curatare_miezul_noptii` în jurnal (citibil de toți, prin RLS)
  și se deloghează singure, cu mesaj pe ecranul de login. Un panou redeschis
  a doua zi compară ora ultimului login (`localStorage.login_la`) cu ultima
  închidere și iese dacă e mai veche. Așa a doua zi fiecare intră cu contul
  lui și se știe cine e pe tură.

Tot de la ora asta începe „Azi" din panoul șefului și din exportul CSV: dacă
localul închide la 3, comenzile de la 1 noaptea sunt ale serii, nu ale zilei
următoare. „Luna aceasta" începe pe 1, la aceeași oră.

Setarea e un rând `setari_zi` în jurnal (`zile` = 7 ore, index 0 = duminica,
ca în JavaScript; `oraReset` = rezervă), scris doar de director; cron-ul
`curatare-miezul-noptii` (din 10 în 10 minute) o citește prin
`ora_inchidere_zi(data)`: după-amiaza (ora ≥ 12) închide ziua de azi, dimineața
pe cea de ieri. Panoul socotește la fel („Azi" începe la închiderea zilei de
lucru precedente, `ziLucru()` / `inceputZi()`). Pe proiectul moștenit rulau
încă job-urile vechi, în spaniolă, pe ora Madridului; le-am scos.

## Ghidul interactiv

Prima dată când cineva deschide meniul (pe telefon) sau panoul (pe fiecare
rol), ecranul se întunecă și un reflector cade, pe rând, pe fiecare element:
o bulă cu săgeată explică ce face. Se sare cu „Sari peste", se navighează cu
săgețile tastaturii, se reia oricând din „Cum funcționează meniul?" (jos, în
meniu) sau „❓ Ghid rapid" (panou). Pașii ale căror elemente nu există pentru
rolul curent dispar singuri din numărătoare.

Pentru panou, ghidul arată o comandă de exemplu și bara de acceptare chiar
dacă nu e nicio comandă în acel moment. Pe telefon, butonul de notificări
lipsea din antet (bara laterală e ascunsă sub 800 px) — acum e acolo, lângă
„❓".

## Nativ în română

Panoul avea încă zeci de texte în spaniolă (bannerul de plată, stocul,
ferestrele de alertă, zilele săptămânii din harta orelor, jurnalul, mesajele
de eroare), iar meniul clienților pornea cu texte spaniole în HTML, până le
înlocuia JavaScript-ul. Chrome le detecta și propunea traducerea din spaniolă.
Totul e acum în română de la prima literă; meniul își schimbă și atributul
`lang` când clientul alege engleza, iar panoul are `translate="no"`.

Notele clientului nu se mai traduc în spaniolă înainte să fie citite cu voce
tare.

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
| Bar anuleaza cu motiv (`anuleaza_comanda`) | permis, jurnal `pedido_cancelado` |
| Director anuleaza / accepta | respins (doar observa) |
| Manager citeste anularile altora din jurnal | 0 randuri (RLS) |
| Bar pune `anulata` direct, prin UPDATE | respins de trigger |
| Ospatar sterge comanda | niciun rand atins |
| Director corecteaza totalul | permis |
| Comanda la pachet | nume si telefon mutate in `contacte_takeaway` |
| Client scoate un produs de pe telefon (token corect) | total recalculat, jurnal `comanda_modificata_client` |
| Client incearca sa adauge un produs / sa mareasca | respins |
| Client modifica o comanda `gata` | respins („cheama ospatarul") |
| Ospatar modifica o comanda (RPC, JWT de ospatar) | permis, total recalculat din meniu, jurnal cu inainte/dupa |
| Client anonim apeleaza RPC-ul de personal | respins (fara EXECUTE) |
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

**Numele si telefonul de la pachet nu apareau in panou.** Trigger-ul scrie in
`mesa` „🥡 La pachet", dar codul care ataseaza contactele cauta „Takeaway".

## Un risc de productie ramas

`index.html` si `dashboard.html` incarca biblioteca Supabase de pe un CDN
(`cdn.jsdelivr.net`). Daca acel CDN e indisponibil, aplicatia nu porneste deloc —
nici macar dashboard-ul instalat, pentru ca service worker-ul nu pune in cache
fisiere de pe alt domeniu. Pentru un sistem care tine casa, merita descarcata
biblioteca local, langa `config.js`. Nu am facut-o inca.

## Conturi de personal

**M3 Coffee & Lounge** (`@m3coffe.com`): director, manager, bar, bucatarie,
ospatar1-3.

**Sweet & Sour** (`@sweetnsour.com`): director, manager, bar, bucatarie,
ospatar1-3. Conturile vechi `@alibretto.com` au fost sterse.

Atentie la nume: in Supabase, proiectul care serveste **M3** se numeste
„Sweet and Sour" (`cjav…`), iar cel care serveste **Sweet & Sour** se numeste
„Á Libretto" (`wnwl…`). Cel mai simplu e sa redenumesti proiectele dupa
localul pe care il servesc.

Push-ul (`notifica-comanda` + `03_push.sql`) e instalat doar pe Sweet & Sour;
pe M3 nu exista nici functia, nici trigger-ul, deci notificarile push nu merg
acolo (alarma din aplicatie merge oricum).

## Demo pentru prezentări — `/exemplu/`

Un meniu de demonstrație, la `domeniu.ro/exemplu/`. **Nu se conectează la niciun
Supabase**: produsele vin dintr-un fișier local (`meniu-demo.json`, 15 produse),
iar „Trimite comanda" arată că a funcționat fără să trimită nimic nicăieri.

Poți da linkul oricui, fără logo și fără riscul ca cineva să bage o comandă de
test în sistemul unui local real.

## Mesele au acum trei praguri de timp

Măsurate de la ultima comandă a mesei:

| Timp | Culoare | Ce se întâmplă |
|---|---|---|
| sub 60 min | verde | normal, nimic |
| 60–120 min | portocaliu, pulsează încet | alertă „trece un ospătar pe la ea", un bip |
| peste 120 min | roșu, pulsează rapid | alertă urgentă, trei bipuri, anunț vocal |

Deasupra planului sălii apare o bară cu mesele care așteaptă, cu minutele
exacte. Alerta sonoră sună **o singură dată per masă și per prag**, ca să nu
țiuie continuu; se resetează când masa revine sub prag. Doar ospătarii și
directorul sunt anunțați.

Timpul curge și când nu intră comenzi noi: sala se reevaluează din minut în minut.

## Adăugarea unui produs e acum un formular

Înainte erau șapte ferestre `prompt()` una după alta — dacă anulai a cincea,
pierdeai tot, și nimic nu te obliga să completezi ceva.

Acum e un formular cu validare, în care sunt **obligatorii**: nume, descriere,
categorie, secțiune, preț, volum/gramaj, ingrediente, nume și descriere în
engleză. Alergenii cer o afirmație explicită: ori îi listezi, ori bifezi „nu
conține" — nu poți lăsa câmpul gol și trece mai departe.

Verifică și numele duplicat: două produse cu același nume ar face serverul să nu
mai știe după ce preț să recalculeze comanda.

## Rolurile de personal

`director`, `manager`, `bar`, `bucatarie`, `ospatar`. Se acordă din
`staff_roles`, tabelă care nu are nicio politică de scriere — se completează
doar din consolă, cu `service_role`. Nimeni nu-și poate schimba rolul din
aplicație.

| | director | manager | bar | bucătărie | ospătar |
|---|---|---|---|---|---|
| vede comenzile, sala, istoricul, rapoartele | ✓ | ✓ | ale lui | ale lui | ✓ |
| meniu, prețuri, bucătărie închisă, fereastră, pachet, fără ospătari, ora de închidere, angajați | ✓ | – | – | – | – |
| „ora de vârf", harta sălii, stoc | ✓ | ✓ | stoc | stoc | – |
| acceptă / „Gata" / „Preluată" | – | – | ✓ | ✓ | – |
| modifică o comandă | – | oricând | a lui | a lui | în fereastră |
| anulează (motiv + nume; și retur) | – | fără cod | cu codul lunii | – | cu codul lunii |
| vede / schimbă codul lunii | ✓ | ✓ | – | – | – |
| își alege zona (📍) | – | – | – | – | ✓ |
| jurnal, rapoarte pe personal, anulări, ture, feedback | ✓ | – | – | – | – |
| șterge istoricul (Zona de risc) | ✓ | – | – | – | – |
| confirmă bonul / scoate confirmarea | – | – / ✓ | ✓ / – | – | – |
| comandă rapidă în numele clientului | – | ✓ | – | – | ✓ |
| eliberează o masă manual | – | ✓ | ✓ | – | ✓ |
| alarme (comenzi noi, cereri de la mese) | nimic | doar anulările făcute de personal | ✓ | ✓ | „gata", vibrație |

**Directorul doar observă.** Regula e în baza de date, nu doar în ecran:
`protect_comanda_update` refuză orice UPDATE de la un cont director, iar
funcțiile de modificare/anulare îl refuză la fel. **Managerul lucrează**, dar
meniul, setările grele, jurnalul, datele personalului și ștergerea
istoricului rămân ale directorului — tot prin RLS: politica `insert log staff`
îi lasă managerului doar `setari_busy` și `config_mese`, `meniu_produse` se
scrie doar de director, iar din jurnal managerul (ca și barul sau ospătarul)
citește doar setările, harta, mesele eliberate și rândurile proprii (tura
lui). În panou, `body.rol-manager` ascunde tot ce are `data-director`.

**Zonele ospătarilor.** Fiecare ospătar își alege zonele de care răspunde
(butonul „📍 Zona mea" din bara laterală, sau la „Intru în tură" când sala
are mai multe zone): rândul `zona_ospatar` din jurnal, citibil de tot
personalul, scris doar de conturile de ospătar. Comenzile din zona lui apar
primele și îl anunță (bip, voce, vibrație); cele din alte zone rămân
vizibile, mai șterse, cu „📍 Interior · Maria" (cine le acoperă), și le poate
lua oricând — doar un bip scurt la ele. Fără zone alese, totul e „al lui".
Directorul vede în „Ture azi" cine ce zonă a acoperit; barul vede pe card
zona mesei și ospătarul ei.

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
