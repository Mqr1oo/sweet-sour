# Platformă meniuri digitale — documentația tehnică

> Explicația pe înțelesul tuturor e în [README.md](README.md). Aici e partea
> tehnică: cum e construit, de ce, și ce s-a schimbat.

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
├─ qr/                   generator de coduri QR (unealta dezvoltatorului, doar local — în .gitignore)
├─ exemplu/              demo de prezentare, fără backend
├─ skyfall/              șablon gata de completat
└─ supabase/             SQL + scripturi, comune tuturor localurilor
```

Publici tot folderul `Platforma/` pe Cloudflare (Workers cu fișiere statice,
legat de GitHub — la fiecare push pe `main` se publică singur, în ~40 s).
Rutarea pe cale merge din prima: numele folderului **este** calea din URL.
Trei fișiere din rădăcină spun Cloudflare-ului cum să servească:

- `wrangler.jsonc` — numele worker-ului (`sweet-sour`), `assets.directory = "."`,
  `not_found_handling = "404-page"` (altfel paginile 404 proprii nu sunt
  servite), fără URL-uri de previzualizare. **Fără el**, `npx wrangler deploy`
  ghicește setările și publică tot folderul — inclusiv `.git/` (istoricul
  întreg, descărcabil de oricine), `backup/` și documentația. S-a întâmplat
  până pe 15 septembrie 2026; istoricul nu conținea secrete.
- `.assetsignore` — ce NU se publică: `.git`, `.github`, `backup`, `supabase`,
  `qr`, `README.md`, `TEHNIC.md`, `wrangler.jsonc`.
- `_headers` (antetele de securitate) și `_redirects` (linkurile scurte din
  codurile QR, vezi „Coduri QR pentru mese"). Amândouă sunt citite de
  Cloudflare și nu apar pe site.

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
   delogarea personalului la ora închiderii; zonele ospătarilor) și
   `14_timp_eliberare.sql` (câte minute după notă se eliberează masa —
   setare a directorului, citită și de cron), `15_tura_automata.sql`
   (turele deschise se închid la ora închiderii; rândurile serverului din
   jurnal rămân „sistema", nu „client") și `16_securitate.sql` (numele
   produselor vin din meniu, „bon gratis" doar managerul, clientul anonim nu
   vede coloanele personalului, cheia trigger-ului de push e verificabilă —
   vezi „Revizia de securitate"), `17_functii_noi.sql` (meniul zilei,
   etichete, produse ascunse, ciornă/publicare/versiuni, cod unic pe masă,
   limite anti-abuz, comandă uitată, „înapoi", al doilea factor, jurnal de
   conectări, `export_backup` — vezi „Runda 14"; înlocuiește `<REF>` cu
   ref-ul proiectului înainte de rulare), `18_inregistrare_inchisa.sql`
   (înregistrarea publică refuzată și din bază), `19_chei_dezvoltator.sql`
   (cheile meselor le face dezvoltatorul, chei de 8 caractere, curățarea
   istoricului pg_cron) și `20_istoric_scurt.sql` (jurnalul 3 zile, fără
   ștergere manuală a comenzilor, stocul nu e al directorului). Pe M3 și
   Sweet & Sour a existat și un `12_poze_14_zile` (cron + funcție edge
   `curata-poze`) — a fost înlocuit de 13 și nu se mai rulează pe un proiect
   nou. Toate sunt deja aplicate pe M3 și Sweet & Sour.
3. Completezi `config.js` — URL, cheie publicabilă, nume, slogan, culori,
   link de recenzie Google.
4. Creezi conturile de personal (`supabase/creeaza_conturi_staff.py`) și le dai
   roluri.
5. Adaugi produsele din dashboard → panoul directorului → Meniu.
6. Adaugi localul în `index.html` (pagina de start) și în `404.html` din
   rădăcină — câte un bloc `<a class="venue">`. Pagina 404 a localului vine
   odată cu folderul copiat și își ia singură numele, sigla și culorile din
   `config.js`.

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
dar numai coloanele de care are nevoie meniul — nici hash-ul, nici cine a
preluat sau a scos bonul (vezi „Revizia de securitate").

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

Nu mai există buton. La intrarea în cont, panoul caută în jurnal ultimul
`tura_start` / `tura_stop` al contului de la ultima închidere încoace (sau
din ultimele 20 h); dacă nu e o tură deschisă, scrie `tura_start` cu
`{automat:true}`. Un refresh nu pornește altă tură. La „Deconectare" scrie
`tura_stop` (`de_la`, `ore`); la ora închiderii serverul
(`curatare_mese_miezul_noptii`, migrația 15) închide el turele rămase
deschise, pe contul fiecăruia, înainte să șteargă sesiunile. Directorul n-are
tură. „Ture azi" în Personal: cine, de la cât la cât, câte ore. E informativ,
nu pontaj oficial.

Tot în migrația 15: trigger-ul `force_jurnal_utilizator` punea „client" pe
orice rând fără `auth.uid()` — inclusiv pe cele scrise de cron. Acum
„client" rămâne doar pentru cererile cu rolul `anon`/`authenticated`; ce
scrie serverul păstrează utilizatorul dat („sistema", sau email-ul din
`tura_stop`).

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
numărătoare inversă la secundă, „💳 12:34": are **N minute** să plătească și
să plece (Șef → Setări → „Cât stă masa după notă": 5–60 de minute, implicit
15; rândul `setari_eliberare`, citit și de cron-ul `auto_free_tables` prin
`minute_eliberare()`), apoi masa se eliberează singură (`mesa_liberada`
automat, ca la eliberarea manuală). Nu contează dacă ospătarul a apucat să confirme plata —
timpul curge de la cerere. Cererea de notă **neconfirmată** rămâne în lista de
comenzi și în bara „mese vor să plătească" și după eliberare, ca să nu dispară
fără s-o fi văzut cineva; ajutorul și cererile confirmate se curăță.

La verificare am găsit și reparat: alertele de ajutor în română („Ajutor /
Altceva") nu erau recunoscute de panou — regexul știa doar `Help`/`Ayuda`.

### Nota mesei, de la calculatorul central

Clientul nu apasă mereu „Vreau să plătesc" pe telefon: îi zice unui ospătar
— nu neapărat celui din zona lui (al lui e la fumat). Atunci oricine din
personal deschide masa în **Sala** (sau o caută în bara de căutare) și vede
**tot ce a consumat de când e ocupată**, adică de la ultima eliberare:
totalul, câte comenzi, produsele adunate („2× Espresso, 1× Paste"), zona și
ospătarul care o acoperă — o „notă a mesei", ca să nu se încurce ospătarii
între ei. Comenzile anulate nu intră în total.

Tot de acolo, „💵 Nota — cash" / „💳 Nota — card" pune cererea de notă în
locul clientului: un rând `ALERTĂ OSPĂTAR: Nota (cash) — cerută verbal, pusă
de ospatar2`, care merge pe drumul normal — sună la bar, apare pe telefoanele
ospătarilor cu totalul mesei, produsele și restul de dat, iar cine scoate
nota apasă **„Preluat"** pe ea. Din clipa cererii masa e mov și se eliberează
singură după 15 minute, sau barul o eliberează pe loc din Sala după ce nota
a fost scoasă. Dacă masa are deja o cerere de notă, fereastra o arată (când
și de cine a fost scoasă) și nu lasă să se pună alta. Cardul cererii de notă
arată acum totalul și consumul mesei și la bar și la manager, nu doar la
ospătar.

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
Bannerul de jos cu cookie nu mai există — se punea peste alegerea limbii.

Ferestrele (modal) se deschid și se închid cu o tranziție reală (scală +
blur), prin `@starting-style` și `transition-behavior: allow-discrete` pe
`display`; înainte, `display:none → flex` omora orice tranziție și fereastra
apărea brusc. Browserele vechi cad pe comportamentul de dinainte. Barele care
apar singure (total, starea comenzii, butonul de ospătar) nu mai „sar" peste
țintă — curbă fără depășire, fiindcă nu vine dintr-un gest cu inerție. Pe
telefon `:hover` e dezactivat (cardul rămânea ridicat după atingere). Ținte
de minimum 40 px la ✕ și la ±. O vibrație scurtă doar la comanda trimisă și
la ospătarul chemat.

**Sticlă lichidă.** Stratul care plutește peste meniu (limba, mesele
libere, căutarea, categoriile, ± de pe poză, bara de total, starea comenzii,
butonul de ospătar, ferestrele) e un material translucid derivat din paleta
localului prin `color-mix` pe `--bg-panel` / `--ink` / `--pink-main`, cu
muchie luminoasă sus (`inset 0 1px 0`), umbră jos și blur mai adânc pe
suprafețele mari. Nu mai există nuanțe fixe (`rgba(20,16,13,…)` etc.), deci
arată la fel de bine pe negrul de la M3 și pe bleumarinul de la Sweet & Sour.
Cardurile cu produse rămân opace (sunt conținut, nu bară); chenarele groase au
devenit linii de păr. Textul pe sticlă e `--ink` la 82 %, nu gri șters.
`prefers-reduced-transparency` face materialul mat, `prefers-contrast: more`
pune muchii clare fără umbre. Tot blocul e la sfârșitul foii de stil, ca să
câștige prin ordine.

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

Doar în panoul personalului (meniul clienților nu mai are tur: era prea mult
pentru cineva care vrea doar să comande). Prima dată pe fiecare rol, ecranul
se întunecă și un reflector cade, pe rând, pe fiecare element, cu o bulă de
una-două propoziții. Se sare cu „Sari peste", se navighează cu săgețile, se
reia din „❓ Ghid rapid". Pașii ale căror elemente nu există pentru rolul
curent dispar din numărătoare. Ghidul arată o comandă de exemplu chiar dacă
nu e niciuna. Dacă ospătarului i se cere zona la intrare, ghidul așteaptă să
se închidă fereastra zonei (și invers).

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

## Paginile 404

Cloudflare servește, la o adresă lipsă, **cel mai apropiat `404.html`** (pe
Workers doar cu `not_found_handling = "404-page"` în `wrangler.jsonc`):
pentru `/m3/masa-99` caută `/m3/404.html`, apoi `/404.html`. De aceea sunt
două feluri de pagini:

- **una pe local** (`m3/404.html`, `sweetandsour/404.html`, în șablon și în
  demo): în hainele meniului — sigla, numele, culorile și fonturile localului —
  cu un singur buton, „Deschide meniul", spre `/<local>/`. Un client care a
  scanat un QR vechi de pe masă rămâne la localul lui, nu e trimis să aleagă
  dintr-o listă. Numele, sigla și culorile se citesc din `config.js` la
  încărcare (valorile din pagină sunt doar ca să nu clipească);
- **una în rădăcină** (`404.html`): pentru adrese greșite în afara localurilor,
  cu cardurile tuturor localurilor, în stilul paginii de start.

Amândouă arată textul în română și engleză și, discret, adresa cerută — ca să
se vadă ce QR sau link trebuie refăcut. Pentru că URL-ul rămâne cel greșit
(poate fi oricât de adânc), legăturile sunt scrise de la rădăcina site-ului
(`/fonturi/…`, `/m3/…`); un script mic le potrivește și pe github.io, unde
rădăcina e `/<repo>/`.

## Coduri QR pentru mese

Unealta **dezvoltatorului**, nu a directorului: `qr/index.html`, doar pe
calculatorul tău (folderul e în `.gitignore`, nu ajunge pe site). O deschizi
în browser, alegi localul (își citește `config.js`), scrii **cheia
dezvoltatorului** (cea din Vault, `cheie_backup` — aceeași cu secretul
`CHEIE_BACKUP` din GitHub) și apeși „Ia mesele și cheile din baza": unealta
cheamă `chei_mese_dezvoltator(cheie, regenereaza)` și primește mesele din
planul sălii cu cheia fiecăreia (cele lipsă se creează pe loc). De acolo:
„Chei noi pentru toate mesele" sau pentru una singură (codurile vechi nu mai
merg pentru comandă cât e pornit codul unic), apoi „Generează codurile".
Directorul nu vede cheile și nu le poate reface din panou — doar pornește sau
oprește opțiunea din Setări. Așa codurile lipite pe mese nu se strică din
greșeală; când directorul adaugă mese noi în Sală, îți cere coduri pentru ele.

**Linkul din cod** e scurt: `domeniu/s/12/ab12cd34` (Sweet & Sour, masa 12,
cheia) sau `domeniu/m/12/…` (M3) — regulile sunt în `_redirects` din
rădăcină (`/s/:masa/:cheie → /sweetandsour/?m=:masa&k=:cheie`, 302), iar
clientul înțelege `?m=` și, pentru codurile mai vechi, `?mesa=`. Fără cheie,
`domeniu/s/12`. Cheia are 8 caractere (litere mici + cifre). Pentru un local
nou: două rânduri în `_redirects` cu un prefix liber și un rând în lista
`LOCALURI` din unealtă. Când localul are domeniul lui, schimbi „Adresa
site-ului" în unealtă și refaci codurile — ce face linkul lung e gazda
`…workers.dev`, nu calea.

**Fișierele sunt coduri curate**: SVG cu o singură cale (patratelele negre
unite în dreptunghiuri), fără fundal, fără text, latura în mm (o alegi, implicit
30) — se importă direct în Bambu Studio sau în orice program; și PNG cu fundal
transparent (24 px pe patratel). „Descarcă tot" dă un ZIP (scris de mână în
pagină, fără bibliotecă: `svg/`, `png/`, `linkuri.txt` cu masa și linkul).
Numărul mesei nu e pe cod — îl scrii tu pe obiect; lasă în jur o margine goală
de măcar 3 mm pe culoarea de fundal, altfel telefonul nu citește codul.
Numerele de masă se pot scrie și de mână (fără bază, deci fără cheie): listă
(`1, 2, 5`), interval (`1-12`) sau nume (`Terasa1`, `Bar2`).

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

## Revizia de securitate

O trecere separată, doar pe securitate (RLS, triggere, ce ajunge în HTML), a
găsit cinci lucruri; toate sunt reparate în `16_securitate.sql`, în
`dashboard.html`, `index.html` și în funcția `notifica-comanda`.

**Numele produselor vin din meniu, nu de la client.** Serverul verifica doar că
produsul există și păstra textul trimis de telefon în `nume`; oricine putea
băga HTML într-o comandă (direct pe API, cu cheia publică). Toate locurile din
panou escapau textul, cu o singură excepție — rândul „comandă modificată" din
Jurnal — deci scriptul ar fi rulat în sesiunea directorului. Acum
`normalizeaza_produse` scrie numele din `meniu_produse`, notele și masa rămân
text liber dar fără `<` și `>`, iar rândul din jurnal e escapat și el.

**„Bon gratis" doar managerul.** `comp_motiv` scoate comanda din încasări și
din venitul pe angajat, dar trigger-ul `protect_comanda_update` nu-l păzea:
orice ospătar sau barman putea trimite un `PATCH` cu `comp_motiv` și comanda
dispărea din cifre, fără urmă. Acum e refuzat pentru toți în afara
managerului, iar când managerul îl pune (sau îl scoate) apare în jurnal ca
`pedido_gratis`, pe care doar serverul îl poate scrie.

**Clientul anonim nu mai vede emailurile personalului.** RLS alege rândurile,
dar grantul pe `comenzi` și `jurnal_activitate` era pe toată tabela: cu cheia
publică se puteau citi `creat_de`, `preluat_de`, `bon_scos_de` și
`utilizator` din rândurile de configurare (adresele de login ale
personalului). Acum `anon` are grant doar pe coloanele folosite de meniu
(`comenzi`: id, created_at, mesa, produse, total, sectiune, status,
motiv_anulare, anulat_de; `jurnal_activitate`: id, created_at, actiune,
detalii). Meniul cere coloanele explicit — `select('*')` ar pica —, iar
Realtime trimite clientului doar coloanele pe care le poate citi
(`has_column_privilege`, în `realtime.apply_rls`).

**`notifica-comanda` răspunde doar trigger-ului.** Funcția lua orice
corp de cerere drept comandă și trimitea push-ul; cu cheia publică se puteau
trimite notificări inventate pe telefoanele barului. Acum cere cheia
service_role în `Authorization` (cea pe care trigger-ul o ia din Vault): o
compară cu a ei sau întreabă baza prin `verifica_cheie_notificari(cheie)`,
care răspunde doar da/nu — cheia nu iese din bază.

**CSV-ul nu mai poate purta formule.** O masă sau o notă care începea cu `=`,
`+`, `-` sau `@` ar fi fost rulată ca formulă de Excel / Google Sheets la
deschiderea exportului directorului. `csvCelula` pune un apostrof în față
(numerele și liniuța de „gol" rămân cum sunt).

## Biblioteca Supabase e locala

`index.html` si `dashboard.html` incarcau biblioteca Supabase de pe un CDN
(`cdn.jsdelivr.net`); daca CDN-ul era blocat sau picat (retea de firma,
adblock, pana), pagina nu pornea deloc si formularul de login se trimitea
„pe vechi" (adresa se termina in `?`). Acum biblioteca sta in `vendor/supabase.js`
(UMD, v2.116.0), incarcata cu `../vendor/supabase.js`, pusa in cache de
service worker si acoperita de `script-src 'self'`. Ca s-o innoiesti:
`curl -L -o vendor/supabase.js https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js`.

## Runda 14 — funcții noi, anti-abuz, copie de siguranță

Tot ce e pe server stă în `17_functii_noi.sql` (aplicată pe ambele proiecte)
și `18_inregistrare_inchisa.sql`; funcția edge `notifica-comanda` (v7, doar pe
Sweet & Sour) primește acum și mesaje generice `{ mesaj: { title, body, tag,
roluri } }`.

**Meniul zilei.** `meniu_produse.zilei / zilei_pret / zilei_pana_la`;
`pret_curent(rand)` alege prețul special cât timp ține, iar
`normalizeaza_produse` îl folosește la orice comandă. RPC
`seteaza_meniul_zilei(id, pret, pana_la)` — manager și director; `null` îl
scoate. Clientul arată cardul în capul meniului (`renderMeniulZilei`) și îl
ascunde la ora aleasă; jurnal `meniul_zilei`.

**Etichete.** `meniu_produse.etichete text[]` (vegan, vegetarian, fara_gluten,
fara_lactoza, picant, fara_alcool, fara_zahar). Directorul le bifează în
formularul produsului; clientul vede al doilea rând de filtre doar cu cele
prezente în meniu; se combină (toate trebuie să se potrivească).

**Produse ascunse.** `meniu_produse.sters_la`. Politica pentru anonim e
`activ and sters_la is null` (a înlocuit vechea „select meniu public", care
se aduna cu OR); `normalizeaza_produse` refuză produsele ascunse. Editorul le
arată sub tabel, cu „recuperează".

**Ciornă → publică → versiuni.** `meniu_ciorna` (un rând, tot meniul ca
JSON, în forma dată de `meniu_ca_json()`), `meniu_versiuni` (snapshot-ul
meniului viu de dinaintea fiecărei publicări; 40 păstrate, cron-ul șterge
peste 180 de zile dar ține ultimele 5). RPC-uri, toate doar director:
`ciorna_meniu()` (o creează din meniul viu dacă lipsește; `publicat` = ciorna
e identică cu meniul viu), `salveaza_ciorna(json)`, `publica_meniu()`
(snapshot + `aplica_meniu`, care face upsert doar pe rândurile schimbate și
ascunde ce nu mai e în listă; coloanele „vii" — stoc, meniul zilei — nu sunt
atinse), `restaureaza_meniu(id_versiune)` (versiunea devine meniu viu și
ciornă; starea de dinainte e salvată și ea), `restaureaza_din_backup(json)`
(un fișier din `backup/` intră în ciornă). Editorul (`loadMeniu`,
`salveazaMeniu`, `publicaMeniu`, `arataVersiuni`) nu mai scrie direct în
`meniu_produse`; `produsCiorna()` normalizează fiecare produs în forma
serverului. Clientul reîncarcă meniul cu un `setTimeout` de 500 ms după
evenimentele realtime, ca o publicare (38 de rânduri) să însemne o singură
reîncărcare.

**Cod unic pe masă.** `chei_mese (masa, cheie)` — fără niciun grant.
Din runda 15 cheile le vede și le reface doar dezvoltatorul, prin
`chei_mese_dezvoltator(cheie, regenereaza)` (anonim, cu cheia din Vault);
`chei_mese_lista()` și `chei_mese_regenereaza()` au rămas în bază, dar fără
drept de execuție pentru personal. Setarea
`setari_chei {activ}` e citită și de anonim, ca telefonul să spună dinainte
„scanează codul". `sanitize_comanda_insert` (acum security definer) cere, când
e activ, `comenzi.cheie_masa` egală cu cheia mesei; coloana e golită înainte
de scriere, deci nu ajunge nicăieri. Clientul ia `?mesa=4&k=…` din QR, îl ține
14 ore în `localStorage` (`STORE + 'cheie'`) și îl trimite la comenzi și la
cererile de ospătar; cu cheie, numărul mesei e blocat în fereastră. Codurile
le face unealta `qr/` (vezi „Coduri QR pentru mese").
Erorile serverului au `hint` (`cod_masa`, `limita_neacceptate`,
`limita_ritm`, `limita_produse`, `alerta_recenta`), pe care clientul îl
traduce în engleză (`mesajEroareComanda`).

**Limite anti-abuz.** Trigger `trg_zz_limite_comanda` (rulează după
recalcularea totalului), doar pentru anonim, cu `setari_limite` (implicit:
3 grupuri de comenzi neconfirmate pe masă, 8 în 10 minute, 30 de bucăți,
prag 500 lei). Cererile de ospătar se refuză dacă aceeași masă are una
neacceptată din ultimele 2 minute. Peste prag, `comenzi.atentie =
'suma_mare'` (coloană citită și de anonim): telefonul îi spune clientului că
vine un ospătar, cardul are semnul „sumă mare", iar „Accepta" cere o
confirmare.

**Comandă uitată.** Cron `comenzi-uitate` (la minut) → `alerte_comenzi_uitate()`:
o comandă `noua` mai veche de `setari_alerte.minute_uitata` (implicit 5)
primește `alerta_uitata_la`, un rând `comanda_uitata` în jurnal (citit de tot
personalul) și un push `trimite_mesaj_push(...)` către manager și secțiune
(doar unde există `service_role_key` în Vault, deci Sweet & Sour). Panoul
sună (`alarmaComandaUitata`, bandă roșie 60 s, bip pentru director) și
marchează cardul.

**„Înapoi".** `protect_comanda_update` ține `status_anterior /
status_schimbat_la / status_schimbat_de` (nu și pe drumul RPC-urilor, care
își pun singure urma). `revino_comanda(id, 'status'|'bon'|'anulare')` acceptă
doar acțiunea aceluiași cont din ultimele 25 s (bara din panou arată 10);
anularea se retrage după rândul `pedido_cancelado`. Jurnal `revenire`.

**Al doilea factor.** `mfa_ok()` = jwt `aal = 'aal2'` sau niciun factor
verificat în `auth.mfa_factors`; `is_staff()`, `current_staff_rol()` și
politica de pe `staff_roles` îl includ, deci un cont înrolat fără cod nu e
„staff" nicăieri. Panoul: `verificaMfa()` după login (fereastra de cod),
Șef → Setări → „Al doilea factor" (enroll TOTP cu QR, `challengeAndVerify`,
unenroll). TOTP trebuie să fie pornit în Authentication → Multi-Factor (e
implicit).

**Jurnal de conectări.** Trigger pe `auth.sessions` (postgres are TRIGGER
acolo): rând `conectare {rol, dispozitiv, ip, amprenta, nou}`; amprenta e
user-agent-ul fără numere de versiune. Un dispozitiv nevăzut în 90 de zile pe
un cont de conducere (nu prima conectare) dă `dispozitiv_nou` + push. Orice
eroare e prinsă (`raise log`), ca login-ul să nu pice.

**Înregistrare închisă.** Ambele proiecte aveau sign-up-ul pornit (testat cu
`/auth/v1/signup`; conturile de test au fost șterse). Pe lângă setarea din
consolă, `18_inregistrare_inchisa.sql` refuză din `auth.users` orice cont
care intră neconfirmat și neinvitat; conturile din consolă / scriptul de
personal (confirmate pe loc) trec.

**Copie de siguranță și ținut treaz.** `export_backup(cheie)` (anonim, cu
cheia din Vault `cheie_backup`, aceeași pe ambele proiecte) întoarce meniul,
meniul complet, ciorna, stocul epuizat și setările (fără `setari_angajati`,
fără coduri, fără cheile meselor). `.github/workflows/backup.yml` rulează
zilnic `backup/salveaza.py`: o cerere la fiecare proiect (ține treaz planul
gratuit), apoi copia în `backup/<local>/<data>.json` + `ultimul.json`
(30 de zile; restul rămâne în istoricul git). Are nevoie de secretul GitHub
`CHEIE_BACKUP`; fără el face doar ținutul treaz. Dacă un proiect nu răspunde,
rularea eșuează și GitHub trimite email.

**Semnal slab la client.** `sw.js` (v2) pune în cache și meniul (`index.html`,
`config.js`, fonturile, sigla, scriptul Supabase de pe CDN — opac) și
răspunde network-first cu termen de 4 s pentru pagini, cu cache-ul ca rezervă;
răspunsurile Supabase nu intră niciodată în cache. `index.html` înregistrează
același `sw.js` (nu în demo). Datele: ultimul meniu în
`localStorage (STORE + 'meniuCache')`; o comandă trimisă fără semnal
(`esteEroareRetea`) intră în coada `STORE + 'coada'` și pleacă la `online`
sau la 10 s (20 de minute maxim), cu bandă „fără semnal" / „comanda a
plecat".

**Antete Cloudflare.** `_headers` din rădăcină: CSP (`script-src 'self'
'unsafe-inline' cdn.jsdelivr.net`, `connect-src` doar Supabase + serviciul de
traducere, `frame-ancestors 'none'`), nosniff, Referrer-Policy,
Permissions-Policy; `sw.js` și `config.js` cu `Cache-Control: no-cache`.
Testat local cu CSP-ul ca `<meta>`: nicio încălcare pe meniu și pe panou.

**Politici de jurnal.** `select jurnal staff` lasă acum tot personalul să
citească orice `setari_%` plus noile acțiuni; `insert log staff` interzice
rândurile scrise doar de server (`comanda_uitata`, `revenire`, `conectare`,
`dispozitiv_nou`, `meniul_zilei`, `meniu_publicat`, `chei_regenerate`) și
lasă `setari_%` doar directorului (mai puțin `setari_busy`). Curățenia
zilnică păstrează orice `setari_%`, nu o listă fixă. `setare_jurnal()` ordonează
după `created_at, id`, ca două rânduri din aceeași tranzacție să nu se bată.
Un `cod_anulare_luna` fără rol nu mai trece de verificare (`null not in
(...)` era null, nu fals).

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
(fereastra se deschide singură la prima intrare din zi, când sala are mai
multe zone — închisă fără alegere înseamnă „toate zonele" pe ziua aceea, ca
să nu se tot deschidă; apoi din butonul „📍 Zona mea"): rândul `zona_ospatar` din jurnal, citibil de tot
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

## Runda 15 — setări pe secțiuni, chei la dezvoltator, Cloudflare curat

**Setările** (Șef → Setări) sunt împărțite în trei secțiuni, după cât de des
se folosesc: „Zi de zi" (meniul zilei, codul lunii, ore de vârf, închide
bucătăria), „Cum lucrează localul" (ora de închidere, mod fără ospătari,
fereastra de modificare, cât stă masa după notă, alerta „comandă uitată",
comenzi la pachet — toată secțiunea doar pentru director) și „Siguranță" (al
doilea factor, cod unic pe masă, limite). Pe ecrane de peste 1080 px
panourile stau pe două coloane (`.setari-grila`; `.lat` = pe toată lățimea).
Secțiunea (`<section class="setari-sectiune" data-grup="setari">`) poartă
grupul, panourile din ea nu — `admArata` comută secțiunile.

**Cheile meselor** (migrația 19, pe ambele proiecte): `cheie_noua()` dă 8
caractere `[a-z0-9]`; `chei_mese_dezvoltator(p_cheie, p_regenereaza)` —
anonim, verifică cheia cu `cheie_dezvoltator_ok` (Vault `cheie_backup`,
`pg_sleep(0.5)` la cheie greșită), reface toate cheile (`'*'`) sau una
(numărul mesei), creează cheile lipsă din `config_mese` și întoarce
`{activ, mese:[{masa, cheie, creata_la}]}`; scrie în jurnal
`chei_regenerate` ca „dezvoltator" (trigger-ul `force_jurnal_utilizator`
respectă `app.jurnal_utilizator`, un GUC pe care îl pot seta doar funcțiile
serverului). Din panou au dispărut lista de chei și „Chei noi": linkul pe
care îl construia (`bazaMeniu()`) ieșea `…/sweetandsour/dashboardindex.html`
pe adresa fără `.html`, deci nu mergea. Cheile de pe ambele proiecte au fost
refăcute în formatul scurt pe 15 septembrie 2026 (opțiunea era oprită).

**Linkuri scurte**: `_redirects` (`/s/:masa/:cheie`, `/s/:masa`, `/m/…`),
clientul citește `?m=` sau `?mesa=`. Testat pe site: `/s/20/<cheie>` → 302 →
`/sweetandsour/?m=20&k=<cheie>`, cheia ajunge în `localStorage`, comanda cu
cheie trece, fără cheie / cu cheie greșită / cu cheia altei mese e refuzată
cu `hint = 'cod_masa'`.

**Cloudflare**: `wrangler.jsonc` + `.assetsignore` (vezi „Structura").
Înainte, `.git/`, `backup/`, `README.md`, `TEHNIC.md` și `.github/` erau
publice, iar 404-urile veneau goale.

**Mărunțiș**: `search_path` fixat și pe `luna_curenta`, `pret_curent`,
`seteaza_finalizata_la` (ultimele avertismente ale linterului); job pg_cron
`curatare-cron-istoric` (duminica 04:30, șterge `cron.job_run_details` mai
vechi de 7 zile — două joburi pe minut făceau ~1 milion de rânduri pe an);
`split_takeaway_contact` scrie „🥡 La pachet" pe ambele proiecte. Avertismentele
rămase ale linterului sunt intenționate: funcțiile `security definer` apelabile
de anonim (`export_backup`, `chei_mese_dezvoltator`, `client_modifica_comanda`)
își verifică singure cheia/token-ul, iar tabelele fără politici RLS
(`chei_mese`, `coduri_anulare`, `meniu_ciorna`) se citesc doar prin funcții.

## Runda 16 — istoric scurt, fără jurnal în panou, directorul fără comenzi și stoc

Cerința: istoricul să dispară la închidere, să se șteargă singur, fără buton
de ștergere; jurnalul de activitate să nu mai fie în panou; directorul să nu
vadă panoul de comenzi și nici stocul.

**Baza** (migrația 20, ambele proiecte): cron-ul `curatare-zilnica` șterge
comenzile închise la 2 zile (ca înainte) și rândurile din `jurnal_activitate`
la **3 zile**, cu trei excepții — `setari_%` și `config_mese` rămân mereu,
`conectare` 90 de zile (pe ele se sprijină alerta „dispozitiv nou", care
compară amprenta browserului cu cele din ultimele 90 de zile), `feedback_client`
30 de zile (părerile clienților, afișate în Personal). Politica de ștergere pe
`comenzi` a rămas doar pentru alertele de ospătar (`delete alerte staff`) —
directorul nu mai poate șterge comenzi nici din API. `stoc_produse`: insert /
update doar bar, bucătărie, manager; delete doar manager.

**Panoul**: `renderOrders` filtrează istoricul cu `inceputZi()` (de la ultima
închidere); au dispărut tab-ul și vederea „Jurnal" (`loadJurnal`,
`exportLogsCSV`), „Zona de risc" (`btnWipeHistory`, grupul `risc`), „Luna
aceasta" (`statsMode` rămâne `'today'`) și „Harta orelor de vârf"
(`renderHeatmap` — cu 2 zile de date n-avea ce arăta). Directorul: `navActive`
și `navStock` ascunse, intră direct cu `switchTab('admin')`; turul sare peste
pașii Comenzi / O comandă / Stoc. Informarea GDPR a personalului (versiunea
15 septembrie 2026) spune 3 zile, cu un rând nou pentru dispozitiv/IP la
conectare (90 de zile); politica clientului spune 3 zile la jurnal.

## Înainte de deschidere

1. Authentication → Providers → Email: **Allow new users to sign up** = oprit.
   (Nu „Enable email provider" — acela e logarea însăși.) Pe 14 septembrie
   2026 era pornit pe ambele proiecte; baza refuză oricum înregistrările
   (migrația 18), dar setarea trebuie oprită.
2. **Leaked password protection** e doar pe planul Pro; până atunci, pune
   parola minimă la 10 caractere din aceeași pagină.
3. GitHub → Settings → Secrets and variables → Actions → `CHEIE_BACKUP`
   (cheia din Vault `cheie_backup`), altfel copiile nu se fac.
4. Directorul și managerul își activează al doilea factor (Șef → Setări).
5. Codurile QR le faci tu din `qr/` (cu cheia dezvoltatorului) și le
   printezi; dacă localul vrea codul unic pe masă, directorul pornește
   opțiunea abia după ce codurile cu cheie sunt lipite pe mese.
6. Testează un ciclu complet: comandă de pe un telefon, o vezi la bar pe altul,
   „Gata" → ospătar → „Servit". Înainte să fie clienți în local.

## Ce mai lipsește

Meniul are 38 de produse cu **prețuri inventate**, ca punct de plecare.
Înlocuiește-le din dashboard înainte de deschidere.

Pozele din `images/` sunt placeholdere generate. Se înlocuiesc cu poze reale,
`N.webp`, unde N e `id_produs`.
