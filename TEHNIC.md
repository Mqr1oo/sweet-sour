# Platformă meniuri digitale — documentația tehnică

> Explicația pe înțelesul tuturor e în [README.md](README.md). Aici e partea
> tehnică: cum e construit, de ce, și ce s-a schimbat.

Un domeniu, mai multe localuri. Fiecare local are aplicația lui (meniu pentru
clienți + panou de personal) și **propriul proiect Supabase**, complet izolat.

```
Platforma/
├─ index.html            pagina de start: lista localurilor
├─ m3/                   → domeniu.ro/m3
├─ zen/                  → domeniu.ro/zen  (fost sweetandsour/)
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
   istoricului pg_cron), `20_istoric_scurt.sql` (jurnalul 3 zile, fără
   ștergere manuală a comenzilor, stocul nu e al directorului) și
   `21_istoric_lunar.sql` (comenzile închise: luna în curs + luna trecută,
   anulările la fel) și `22_push_ospatari.sql` (push și pentru ospătari, pe
   zona lor; `<REF>` de înlocuit). Pe M3 și
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
| ZeN Lounge Garden (fost Sweet & Sour; folder `zen/`, fost `sweetandsour/`) | `wnwllyyhtkufcejzjeay` | eu-west-1 |
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
următoare. „30 de zile" începe la închiderea zilei de acum 30 de zile.

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

- **una pe local** (`m3/404.html`, `zen/404.html`, în șablon și în
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
rădăcină (`/s/:masa/:cheie → /zen/?m=:masa&k=:cheie`, 302), iar
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

**Al doilea factor** — scos în runda 36 (migrația 29): `mfa_ok()` răspunde
mereu `true` și rămâne doar pentru că o cheamă `is_staff()`,
`current_staff_rol()`, politica de pe `staff_roles` și trigger-ul comenzilor;
panoul nu mai are fereastra de cod și nici panoul din Setări.

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
comenzi la pachet — toată secțiunea doar pentru director) și „Siguranță" (cod
unic pe masă, limite, mutare — și ea doar pentru director). Pe ecrane de peste 1080 px
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
care îl construia (`bazaMeniu()`) ieșea `…/zen/dashboardindex.html`
pe adresa fără `.html`, deci nu mergea. Cheile de pe ambele proiecte au fost
refăcute în formatul scurt pe 15 septembrie 2026 (opțiunea era oprită).

**Linkuri scurte**: `_redirects` (`/s/:masa/:cheie`, `/s/:masa`, `/m/…`),
clientul citește `?m=` sau `?mesa=`. Testat pe site: `/s/20/<cheie>` → 302 →
`/zen/?m=20&k=<cheie>`, cheia ajunge în `localStorage`, comanda cu
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

## Runda 17 — statistici pe zi / lună, istoric pe zile, taburile directorului

Utilizatorul s-a răzgândit față de runda 16: vrea statisticile pe zi **și**
pe lună înapoi, istoricul filtrabil pe zilele trecute, ștergerea „o dată pe
lună", iar taburile șefului separate și mai vizibile.

**Baza** (migrația 21, ambele proiecte): `curatare-zilnica` șterge comenzile
închise cu `created_at` mai vechi de **1 ale lunii trecute, ora României**
(`date_trunc('month', now() at time zone 'Europe/Bucharest') - interval
'1 month'`, convertit înapoi cu `at time zone`) — deci baza ține luna în curs
și luna trecută, iar pe 1 pleacă luna de dinainte. Jurnalul rămâne la 3 zile
cu excepțiile din 20, plus anulările (`pedido_cancelado`,
`comanda_anulata_client`, `cod_anulare_gresit`), care se țin cât comenzile
(raportul „Anulări" pe lună). Testat într-o tranzacție derulată înapoi cu
rânduri datate manual (jurnalul are trigger care forțează `created_at`, deci
datarea se face cu UPDATE după INSERT).

**Panoul**:

- `loadOrders` nu mai ia „ultimele 500": ia comenzile deschise plus cele
  închise din ziua de lucru curentă (`.or('status.in.(noua,acceptata,gata),
  created_at.gte.<inceputZi>')`, limită 1000) și rulează din nou după
  `loadOraReset` (ora de închidere mută începutul zilei). `allOrders` = ziua
  curentă; tot ce e mai vechi se citește la cerere. Handler-ul realtime de
  DELETE ignoră comenzile pe care nu le are (curățenia lunară șterge mii de
  rânduri deodată).
- Citire paginată: `citesteTot(fa)` (pagini de 1000 cu `.range`, PostgREST
  taie la 1000), `citesteComenzi(deLa, panaLa)` (finalizate + anulate,
  interval `[deLa, panaLa)`).
- Statistici: `statsMode` = `today | zile30` (runda 21; înainte `month |
  lastmonth`); `perioadaStats()` dă intervalul (`inceputZi`, `inceput30Zile`
  — pe zile de lucru, adică de la ora de închidere); `comenziPerioada()` = azi din
  `allOrders`, lunile din baza cu cache de 5 minute (`perioadaCache`, golit
  la bifa de bon). `calculateDirectorStats` e `async`, ignoră rezultatul dacă
  perioada s-a schimbat între timp; graficul e pe ore (azi) sau pe zile de
  lucru (lună), sortat cronologic. `exportCSV` folosește aceeași listă.
  Butoanele `.perioada` (două seturi identice: capul Sintezei și al
  Personalului, `.adm-cap[data-grup]`) sunt sincronizate de `setPerioada`.
- `renderHeatmap` e înapoi: ultimele **4 săptămâni** (exact 4 din fiecare zi
  a săptămânii), citește doar `id, created_at` cu `total > 0` (alertele au
  totalul 0).
- Istoric pe zile: bara `#istoricBara` (◀ / `<input type=date>` / ▶ / Azi),
  `ziIstoric` (null = azi, live) și `istoricZi` (comenzile zilei alese, din
  baza); `intervalIstoric()`, `sursaComenzi()` (lista din care se randează),
  `alegeZiIstoric(zi)`, `actualizeazaBaraIstoric()`. Limitele calendarului:
  1 ale lunii trecute … azi. Pe o zi trecută bonul se poate bifa (`toggleBon`
  caută în `sursaComenzi()`), dar ✕ (retur) nu apare.
- Directorul: `body.rol-director`; grupul `.nav-grup-sef` din bară (titlu
  „Panoul șefului", `order:-1`, chenar) cu `navAdmin` (etichetă „Sinteza"),
  `navSefMeniu`, `navSefPersonal`, `navSefSetari` → `switchTab('admin:grup')`
  (`NAV` mapează id-urile la taburi); pastilele `.adm-tabs` sunt ascunse
  pentru el, managerul le păstrează. Pe mobil grupul e `display: contents`
  și itemii lui vin primii în bara de jos (6 taburi). Titlurile de pagină:
  „Șef · Sinteza / Meniu / Personal / Setari".
- Zilele săptămânii se scriu din `ZILE_SAPT` (`ziFrumos`), nu din
  `toLocaleDateString`, ca să nu apară diacritice.
- Informarea GDPR a personalului (aceeași versiune, 15 septembrie 2026) are
  un rând nou pentru contul de pe comenzi (luna în curs și luna trecută) și
  anulările la fel; politica clientului spune luna în curs și luna trecută.

## Runda 18 — push pentru ospătari, taburi în Comenzi, notificările cerute la intrare

Cerința: notificările nu veneau cu telefonul blocat (ospătarul nu era
destinatar de push deloc — funcția trimitea doar la bar / bucătărie); cererile
de la mese să nu se piardă sub comenzi; alte zone fără sunet, într-un tab;
X la căutare; vocea în antet în locul „?"-ului; „?" ascuns; meniul de comandă
rapidă mai compact; bara clientului să rămână după „Gata" și să arate mai
bine; linkurile meselor pentru NFC.

**Push (server)**: funcția edge `notifica-comanda` v8 (repo:
`supabase/functions/notifica-comanda/index.ts`, deploy pe ambele proiecte)
primește `{ record, tip?, roluri, uids }` și trimite la
`push_subscriptions` cu `rol in roluri` **sau** `uid in uids`; `tip: 'gata'`
dă titlul „🍽️ Masa X — comanda e gata". Migrația 22 (ambele proiecte):
`setare_bool(actiune, camp)`, `ospatari_pentru_masa(mesa)` (uid-urile
ospătarilor **în tură** — ultimul eveniment `tura_start`/`tura_stop` din 24 h
e start — a căror zonă aleasă după `tura_start` conține zona mesei din
`config_mese`; fără zone / listă goală = toți), `trimite_push(jsonb)` (cheia
service_role din Vault, pg_net, timeout 8 s), `trimite_notificare_comanda`
(INSERT: cererile → bar + ospătarii zonei, dacă nu e „fără ospătari";
comenzile → secțiune, bucătăria închisă → bar) și `trimite_notificare_gata`
(UPDATE la `finalizata` din noua/acceptata/gata, nu alertă, nu „fără
ospătari" → ospătarii zonei). Testat pe Sweet & Sour cu o cerere reală
(`trimise: 2`, apoi ștearsă).

**M3 (cjav) n-avea push deloc** (nici funcție, nici trigger, nici
`service_role_key` în Vault). Acum are funcția, migrația 22 și secretele
VAPID (puse de utilizator din `supabase/m3_vapid.txt`, neversionat; cheia
publică e în `m3/config.js`, `VAPID_PUBLIC`). Ca să nu fie nevoie de
`service_role_key` în Vault, `trimite_push` folosește ca rezervă cheia
dezvoltatorului (`cheie_backup`), iar funcția o verifică prin
`cheie_dezvoltator_ok`; pentru asta funcția de pe cjav e publicată cu
`verify_jwt = false` (cheia nu e JWT, poarta Supabase o refuza cu
`UNAUTHORIZED_INVALID_JWT_FORMAT`) — verificarea e în funcție. Pe wnwl rămâne
`service_role_key` + `verify_jwt = true`. Fără secretele VAPID funcția
răspunde 500 „Lipsesc secretele VAPID…" în loc să cadă la pornire. Testat pe
cjav: `200 {trimise: 0, motiv: niciun dispozitiv}`. Panoul citește `SS_CONFIG.VAPID_PUBLIC` (cu
cheia Sweet & Sour ca rezervă) și, dacă abonamentul existent e făcut cu altă
cheie, se dezabonează și se reabonează singur (`reabonare()`).

**Panoul**:

- Notificări: fără butoane. `ensureNotificationPermission()` la intrare:
  `granted` → `reabonare()`; `default` → fereastra `#modalNotificari`
  („Pornește notificările" cheamă `Notification.requestPermission()` dintr-un
  click; „Mai târziu" amână 6 h, `localStorage.notif_amanat`); `denied` →
  textul `#notifStare` în bara laterală și în meniul contului. Ghidul și
  fereastra zonei așteaptă închiderea ei (`dupaNotificari`). Directorul nu e
  întrebat.
- Antetul de telefon: `#btnVoceMobile` (🔊 / 🔇) în locul 🔕 și ❓; butonul
  lat „Voce" de sub căutare a dispărut. Numele contului (`#mobileUserDisplay`,
  buton) deschide `#modalCont`: notificări (stare + pornire), ghid, GDPR,
  deconectare.
- Căutarea: `.cauta-wrap` + `.cauta-x` (apare când e text), golește ambele
  câmpuri.
- Comenzi: `#comenziTaburi` cu `subTab` = `comenzi | cereri | altele`;
  `renderOrders` împarte comenzile active în grupuri (`cuZone` = ospătar cu
  zonă aleasă și >1 zone): „Zona mea / Comenzi", „Cereri" (bar, ospătar,
  conducere), „Alte zone" (ospătar). Bulina de pe Comenzi = de făcut (gata /
  de dus) + cereri. Bannerul `#paymentAlertBanner` și `updatePaymentAlertBadge`
  au dispărut; cardurile nu mai sunt „șterse" (`.alta-zona`).
- Alte zone = liniște: `playAlertAndVibrate`, handler-ele realtime de INSERT
  și UPDATE („gata") și `loadOrders` ignoră comenzile din alte zone pentru
  ospătar (`esteZonaMea`).
- Comanda rapidă: `.cr-cap` (masa 96 px + nota pe un rând, căutarea sub),
  rânduri `.cr-item` mai scunde, lista fără `max-height`, `.cr-foot` sticky.
- Meniul clientului: bara `#liveTracker` cu pași (`.t-pasi`, `.t-linie`,
  `.t-pas.facut/.acum`), text `stVine` (4 min după `finalizata`, moment ținut
  în `c.servita_la` pentru că `finalizata_la` nu e vizibil pentru anon), apoi
  `stServita`, după 15 min clasa `mic`; `setInterval` de 30 s. Comenzile
  sesiunii stau în `localStorage` (`{la, comenzi}`), 8 ore, doar pentru masa
  curentă (`incarcaComenziSesiune`).
- Linkurile meselor (QR / NFC) sunt în `qr/linkuri_<local>.txt`
  (neversionat), luate din `chei_mese`: `/s/<masa>/<cheie>` (Sweet & Sour),
  `/m/<masa>/<cheie>` (M3).

## Runda 19 — trage în jos ca să reîncarci panoul

Cerința: „o pagină de refresh în fiecare cont din dashboard — să trag în jos
și să dea refresh".

`dashboard.html` (toate localurile), în `initTrageReincarca()` (după
`initSoundToggle()`): pe `.content-area` (singurul element care derulează pe
telefon; `body` are `overflow: hidden`, deci Chrome nu face singur
pull-to-refresh) ascultăm `touchstart/move/end` pasive. Dacă `scrollTop` e 0
la atingere și degetul coboară, indicatorul `#ptr` (↻ într-un cerc, absolut
în `main`, sub antet: 70 px desktop / 60 px mobil) coboară cu 0,6 × distanța,
se rotește și devine „gata" la 80 px; la ridicare peste prag → `.incarca`
(se învârte), vibrație scurtă și `location.reload()` după 250 ms. Reîncărcăm
pagina de tot, nu doar datele: se refac și canalul realtime și abonarea la
push, adică exact lucrurile care „se blochează". Nu se declanșează cu un
modal deschis (`.modal-overlay.open`, `.auth-overlay.open`) și nici dacă lista
nu e sus. `main { overscroll-behavior-y: contain }` ca browserul să nu tragă
și el pagina. Pe calculator, butonul `#btnReincarca` (↻, în
`.header-actions`, ascuns pe mobil odată cu antetul) face același lucru.

Testat cu evenimente `TouchEvent` sintetice pe viewport 375 px: indicatorul
apare la y≈90 (sub antet), „gata" la 80 px, `touchend` → clasa `incarca` și
pagina se reîncarcă (`performance.timeOrigin` nou).

## Runda 20 — managerul fără Stoc și fără Meniu

Cerința: „scoate de la manager butonul de stoc, cel de meniu; ca manager,
când anulează, să nu mai pună codul".

`dashboard.html`, `setupUserEnvironment()`: `navStock` se arată doar la bar și
bucătărie, `navMeniu` (comanda rapidă) doar la ospătar. Managerul rămâne cu
Comenzi (modifică ✏️ prin modalul `modalEditComanda`, care nu depinde de tabul
Meniu; anulează ✕), Sala, Istoric, Șef. Turul ghidat sare peste pașii Meniu /
Stoc pentru rolurile care nu le au. Anularea fără cod pentru manager exista
deja (client: `anCodBloc` ascuns și `p_cod: null`; server:
`anuleaza_comanda` sare verificarea când `v_rol = 'manager'`, migrația 13) —
verificat în harness că modalul se deschide fără câmpul de cod.

## Runda 21 — perioada din două butoane, Setări tab separat la manager

Cerința: „în loc de luna trecută spune altceva, 30 de zile în urmă, sau fă-le
din 2 butoane; Setări să fie alt tab jos, nu în panoul de șef".

- Perioada statisticilor (Sinteza și Personal): **Azi / 30 de zile**.
  `statsMode` = `today | zile30`; `inceput30Zile()` = închiderea zilei de
  lucru de acum `ZILE_STATS` (30) zile, deci 30 de zile de lucru cu azi
  inclusiv; textul „Ultimele 30 de zile — 18 august → azi, 16 septembrie".
  `inceputLuna` / `inceputLunaTrecuta` au dispărut; Excel-ul se numește
  `Raport_comenzi_30_zile_…`. Retenția (migrația 21: luna în curs + luna
  trecută) acoperă mereu cele 30 de zile.
- Managerul are `navSefSetari` în bară (ca directorul), `body.rol-manager
  .adm-tabs { display: none }` — în „Șef" îi rămâne Sinteza; `switchTab`
  aprinde tabul potrivit pentru orice `esteConducere()`. Pe telefon bara de
  jos are 5 taburi: Comenzi, Sala, Istoric, Sef, Setari. Turul are pași
  proprii pentru manager.

## Runda 22 — clopoțel, codul folosit, „rămân la masă", meniul zilei multiplu

Cerințe (lotul mare): iconiță de notificare care nu mai e pătrat alb;
managerul și directorul anunțați când se folosește codul lunii; mesaj clar
cu bifă înainte de comandă pentru mutarea la altă masă (taxă setabilă);
meniul zilei cu mai multe produse, reducere afișată, interval orar.

- **Insigna notificării**: Android folosește doar canalul alfa al `badge`;
  `icon-192.png` (opac) ieșea un pătrat alb. `icons/badge-96.png` /
  `badge-192.png` = clopoțel alb pe transparent (generat cu PIL,
  `sigla`/`badge.py`), `sw.js` cache v3.
- **Migrația 23** (`23_cod_folosit_push.sql`, ambele proiecte):
  `trimite_mesaj_push` trece prin `trimite_push` (cheia de rezervă
  `cheie_backup`); trigger `trg_notifica_cod_folosit` pe
  `jurnal_activitate` (INSERT `pedido_cancelado` cu `cod_validat` sau
  `cod_anulare_gresit`) → push la `['manager','director']` cu numele ales,
  masa, totalul, motivul. Directorul se abonează de acum la push
  (`ensureNotificationPermission` fără excepția lui; textul modalului
  spune ce primește: doar codul folosit și dispozitiv nou).
- **Acordul „rămân la masă"**: `setari_mutare` {activ, taxa} (director,
  Setări → Siguranță), citibil de anon (policy `select public config`,
  migrația 24). Client: `#acordMasa` în modalul comenzii, doar la masă, cu
  textul RO/EN (`acordTitlu`, `acordText(masa, taxa)`); fără bifă
  `sendOrderBtn` dă `acordCere` și scutură cutia; bifa se ține în
  `sessionStorage` (`acord`) pe durata vizitei.
- **Meniul zilei multiplu** (migrația 24): coloane `zilei_de_la`,
  `zilei_zilnic`; `oferta_activa(p)` (zilnic: doar ora, Europe/Bucharest;
  altfel intervalul exact), `pret_curent` o folosește; `pune_oferta(id,
  pret, de_la, pana_la, zilnic)`, `scoate_oferta(id|null)`;
  `seteaza_meniul_zilei` rămâne (compatibilitate). Cron `oferte-expirate`
  (orar) curăță ofertele de o zi expirate de peste o zi. Client:
  `ofertaActiva(r)` în JS (oglinda serverului), `#meniulZilei` devine listă
  (`.mz-lista`, card per ofertă, `−N%` în `.mz-reducere` și în panglica din
  listă), semnătura ofertelor la 30 s reîncarcă meniul când una începe /
  se termină. Panou: lista `#mzLista` cu ✕ per produs, formular de la /
  până la / zilnic, „Scoate toate".

## Runda 23 — pozele produselor din panou

Cerința: „să-l pui pe el să dea upload". **Migrația 25**: bucket Storage
`poze` (public la citire, 3 MB, webp/jpeg/png), politici pe
`storage.objects` doar pentru `current_staff_rol() = 'director'`. Panou:
în fereastra produsului, „Alege poza" → `pregatestePoza()` (canvas, max
1000 px, WebP 0.84) → `storage.from('poze').upload('produse/<uuid>.webp')`
→ `mpPoza` = URL public → `p.imagine` la „Salvează produsul"; poza veche
din bucket se șterge la înlocuire / „Scoate poza". Clientul folosea deja
`item.imagine || images/<id>.webp`. Fără login de director nu s-a putut
testa urcarea reală; fluxul (redimensionare, conversie, ștergerea celei
vechi) e verificat cu un Storage fals în harness.

## Runda 24 — rezervări

**Migrația 26**: tabela `rezervari` (mesa, de_la, pana_la, persoane, nume,
telefon, nota, status activa/sosita/anulata, creat_de), RLS doar pentru
staff (bar/ospatar/manager/director scriu; anon nimic), realtime;
`setari_rezervari()` {minute_inainte: 10, durata_minute: 120} din jurnal
(`setari_rezervari`, director + manager — policy `insert log staff`
rescrisă cu excepția); `mese_rezervate()` (anon): mesele blocate (`now()`
în `[de_la − minute_inainte, de_la)`) sau începute (`[de_la, pana_la)`),
fără nume; trigger `trg_refuza_masa_rezervata` BEFORE INSERT pe `comenzi`
refuză comenzile anon pe o masă blocată; cron `rezervari-vechi` șterge la 2
zile după `pana_la`. Panou: `#modalRezervari` (listă + formular) din Sală,
`rezervareMesei(mesa)` → blocată / începută / urmează; `getTableStatus`
întoarce `status: 'rezervata'` pentru masa fără comenzi dar cu rezervare
(teal, `📅 HH:MM` pe card); `#taRez` în fereastra mesei cu „Au sosit" /
„Anulează"; harta se reface la minut. Client: `rezervariClient` (declarat
sus, lângă `allItems` — `applyLanguage()` îl citește la pornire; un `let`
mai jos dădea TDZ), `loadRezervariClient()` în `refreshTablesStatus` (30 s)
și înainte de trimitere; `#rezBanner` când masa scanată e blocată;
`isTableFreeClient` scoate mesele rezervate din „mese libere".

## Runda 25 — Sweet & Sour devine ZeN Lounge Garden

Folderul `sweetandsour/` (redenumit `zen/` în runda 30) și adresa `/s/…` rămân (codurile QR tipărite,
aplicațiile instalate și abonamentele push sunt legate de ele; un domeniu
propriu rezolvă adresa vizibilă). S-au schimbat: `config.js` (NUME,
SUBTITLU, TAGLINE RO/EN — textul clientului, INSTAGRAM, CULORI verzi),
`index.html` (titlu, meta, culori de rezervă, h1, subsol cu Instagram și ©
din config), `dashboard.html` (titlu, paletă: accent `#8fc26c`),
`sw.js`, `manifest.json`, `404.html`. Sigla e redesenată vectorial după
poza clientului (`scratchpad/sigla_zen.py`, PIL): `logo.png` (crem + verde,
pentru fundal închis), `logo-print.png` (culorile originale), `mark.png`,
iconițele 192/512/maskable/favicon. **Runda 28**: clientul a trimis sigla
originală ca SVG de Canva (PNG-uri incorporate + mască); `scratchpad/svg_logo.py`
le compune (culoare + alfa din mască) → `logo.png` / `logo-print.png` exact
originalul (litere verde închis), `mark.png` doar literele, iconițele pe fundal
alb; `config.js` `LOGO_FUNDAL: '#ffffff'` pune sigla pe card alb în meniu, în
onboarding, în panou și pe 404.

## Runda 26 — harta sălii

`config_mese` păstrează forma veche (`zones[].mese[].{numar, scaune}`) și
primește în plus: `zones[].plan = {w, h, pereti: [{x1,y1,x2,y2}]}` (unități:
lățimea încăperii = 100; 100×70 / 100×100 / 70×100) și pe masă `x, y,
forma ('patrata'|'rotunda'), marime ('mica'|'normala'|'mare'|'lunga'),
unita_cu`. `renderTablesGrid()` desenează `#tablesGrid.plan-sala`
(aspect-ratio din plan, `min-width: 640px` într-un `.plan-scroll`), SVG cu
pereții și legăturile meselor unite, cardurile absolute (`left/top/width/
height` în %). Mesele fără coordonate primesc un loc (`asazaMeseleFaraLoc`).
Editare (`isEditingMap`): bară `#planBara` (➕ Masa, 🧱 Perete, 🧹 Șterge
perete, forma încăperii), pointer events pe grid (tragere cu prag de 6 px,
perete prin tragere pe gol, atingere simplă → `#modalMasa`: număr, locuri,
formă, mărime, unită cu). Clientul și `ospatari_pentru_masa` citesc doar
`numar`, deci nu sunt afectate. Fereastra mesei arată „🔗 Unită cu masa X —
împreună N lei".

## Runda 27 — GDPR „cea mai tare", contract v2, cercetare poze angajați

- Politica din meniu (RO/EN) și informarea personalului aduse la zi:
  rezervări, acordul „rămân la masă" (doar pe telefon), pozele produselor
  (Supabase Storage, Irlanda), notificarea conducerii la codul folosit,
  ANSPDCP cu telefon și e-mail, „fără biometrie / video", data 17.09.2026.
- `config.js`: `PLATFORMA: 'Ospia'` (numele produsului; până pe 17 septembrie 2026 a fost „Ospi" — ospi.ro era luat, ospia.ro era liber la verificarea DNS; documentele Word au fost regenerate cu numele nou).
- `Contract_licenta_mentenanta_Ospia.docx` (în `Downloads/Platforma/`, în
  afara repo-ului): art. 3.2 (uneltele din panou), 6.3.1 (limitele
  mentenanței: funcții noi, conținut, date șterse, echipamente, integrări
  = separat), 8.3 (furnizorii de infrastructură pot fi schimbați cu alții
  din UE cu anunț de 30 de zile — nu trebuie contract nou), Anexa 1 la zi
  (Irlanda; GitHub fără date personale — copiile din `backup/` conțin doar
  meniul și setările, deci criptarea nu e necesară), **Anexa 2 — acordul de
  prelucrare** (art. 28 alin. 3 complet).
- `Pachet_GDPR_Ospia.docx`: registrul art. 30, afiș clienți, consultarea
  salariaților, procedura cereri (+ model răspuns), procedura incident
  (72 h), sub-împuterniciți, DPO/DPIA/camere, poze angajați (nu),
  checklist.
- Cercetare poze la anulare: Legea 190/2018 art. 5 (monitorizarea
  salariaților): interes legitim care prevalează, informare completă,
  consultarea salariaților, fără alternativă mai puțin intruzivă, păstrare
  max. 30 de zile. Alternativa există deja → nu se implementează;
  recomandare: PIN personal pe angajat dacă e nevoie.

## Runda 28 — reducere pe produs, mese cu scaune, etichete automate

- **Migrația 27** (`27_reducere_produs.sql`, ambele proiecte): coloana
  `meniu_produse.reducere` (0–90 %); `pret_curent` = preț special al zilei
  (în interval) > preț redus (`round(pret*(100-reducere)/100, 2)`) > preț;
  `meniu_ca_json` adaugă `reducere` doar când > 0 (ciornele vechi rămân
  „publicate"); `aplica_meniu` scrie coloana. Panou: câmp „Reducere (%)" în
  fereastra produsului; `produsCiorna` pune `reducere` doar când > 0.
  Client: `promo` + `reducere` pe item, panglică roșie `🏷️ −20%`, preț
  vechi tăiat; `select` include `reducere` și `nume_variante`.
- Etichete noi `cu_alcool`, `cald`, `rece` (RO/EN); butonul „✨ Etichete
  automate" în editor (`eticheteAutomate(p)`, regex `CUV` pe nume + categorie
  + ingrediente, fără diacritice; nu suprascrie ce e bifat). Căutarea
  clientului caută și în `nume_variante` și categorie.
- Taxa la mutare: pastilă roșie separată (`#acordMasaTaxa`, `acordTaxa(t)`).
- Harta: mesele au scaune desenate în jur (`scauneHtml`, `.scaun` — rotundă:
  pe cerc; dreptunghiulară: laturile lungi, apoi capetele), mărimea
  implicită vine din locuri (`marimeImplicita`: ≤2 mică, ≤4 normală, ≤6
  mare, 7+ lungă; „Mărime" în modal are opțiunea „după locuri"), pereții
  sunt doar drepți (`capatDrept`: se aliniază pe axa dominantă). Modalul
  de rezervări: inputurile `width:100%; min-width:0` (ieșeau din chenar).
- Ofertele zilei: „de la" pornește de la ora curentă (rotunjită la 5 min),
  „până la" 23:00; lista spune explicit când clienții NU văd oferta (în
  afara orelor / expirată / începe la). Confuzia raportată („nu apare meniul
  zilei") = ofertele erau puse cu 11:30–16:30 și verificate seara — pe site
  Negroni (11:30–21:30) apărea; verificat live.
- Sigla pe fundal deschis: `config.js` `LOGO_FUNDAL: '#fff'` pune sigla pe
  un card (`.pe-fundal`) în meniu, onboarding și panou — pentru sigla
  originală ZeN (litere închise). Se activează când clientul trimite
  fișierul original.

## Runda 29 — mese rotunde cu scaune, „ține apăsat" pe masă, editor simplificat, sigla vectorială

- **Migrația 28** (`28_mese_azi.sql`, ambele proiecte): politica
  `select jurnal staff` include acțiunea `mese_azi` în lista rândurilor
  vizibile întregului personal (nu doar autorului). Nicio tabelă nouă.
- **Aranjarea „pe azi"** (`mese_azi`): oricine din personal ține apăsat
  ~0,45 s pe o masă din Sală (`pointerdown` → `tinere.timer`; se anulează
  dacă degetul se mișcă > 8 px înainte) — masa se „ridică" (`.ridicata`,
  `pointerEvents: none`, vibrație scurtă), o trage și: **peste altă masă**
  (`mesaSub(cx, cy)` — test pe dreptunghiuri, nu `elementFromPoint`, care
  vedea cardul tras) → se unesc pe azi (`{mesa, cu, x: lângă țintă, y}`);
  **în alt loc** → se mută pe azi (`{mesa, cu: cea de azi sau null, x, y}`).
  Ținere fără mișcare pe o masă deja unită → `confirm('Desparti mesele …?
  Revin la locul lor.')` → rânduri `{mesa, reset: true}` pentru toate
  partenerele. Totul se scrie cu `logActivity('mese_azi', …)` în
  `jurnal_activitate` — harta de bază a directorului (`config_mese`) nu se
  atinge; `loadMeseAzi()` citește rândurile de la `inceputulTurei()` și
  construiește `meseAzi = { nr: {cu, x, y} }`; `perecheaMesei(nr)` combină
  partenerii de azi cu `unita_cu` din hartă (nota mesei, liniile punctate,
  clasa `.unita-azi`). A doua zi rândurile ies din fereastră (și se șterg
  la 3 zile, ca restul jurnalului) — mesele revin singure.
  Realtime: INSERT cu `actiune = 'mese_azi'` → `loadMeseAzi()` la toți.
- **Mesele arată ca mese**: cardul e rotund (`.plan-sala .table-card
  {border-radius:50%}`, `.patrata` → 22 %), fără chenar pătrat; numărul de
  locuri nu se mai scrie (`.t-seats {display:none}`), îl arată scaunele din
  jur (`scauneHtml` — 2/4/6/8…); în cerc rămân doar numărul mesei și timerul.
- **Editorul de meniu, mai simplu**: „🚀 Publică" salvează ciorna în tăcere
  și publică; „💾 Păstrează fără să publici" e singurul buton secundar;
  „🕘 Versiuni" și „📂 Din copia de siguranță" sunt ascunse
  (`display:none`, codul rămâne — RPC-urile `restaureaza_meniu` /
  `restaureaza_din_backup` sunt tot acolo, iar copia de siguranță se face
  în continuare pe GitHub). Fereastra produsului: obligatorii doar numele și
  categoria; „Activ" e în partea de sus; restul (descriere, volum,
  ingrediente, alergeni, etichete, engleză) stă pliat sub „▸ Mai multe
  detalii" (`arataDetalii()` — deschis automat când produsul are deja
  detalii, pliat la produs nou).
- **Sigla ZeN vectorială**: clientul a trimis `zenn.svg` (două `<path>`,
  fără imagini incorporate) → `zen/icons/logo.svg`, `config.js`
  `LOGO: 'icons/logo.svg'`. PNG-urile (`logo.png` 1400 px, `logo-print.png`
  2000 px, `mark.png` = doar literele, iconițele 192/512/maskable pe alb,
  `favicon.png`) au fost randate din SVG în browserul panoului (canvas pe o
  pagină HTML — pe un document SVG `createElement('canvas')` nu merge) și
  trimise pe disc printr-un mic receptor Python local (`primeste.py`,
  127.0.0.1:8766, 60 s). Panoul folosește tot `icons/logo.png`.

## Runda 30 — folderul `zen/`, filtrele într-o fereastră

- **`sweetandsour/` → `zen/`** (git mv, la fel `backup/sweetandsour/` →
  `backup/zen/`). Linkurile scurte din `_redirects` (`/s/:masa/:cheie`)
  duc acum la `/zen/?m=…&k=…` — codurile QR tipărite rămân valabile
  (adresa din cod e cea scurtă). Adresele vechi sar cu 301:
  `/sweetandsour/*  /zen/:splat`. Paginile de start (`index.html`,
  `404.html` din rădăcină) au cardul ZeN (nume, descriere, sigla pe alb);
  `zen/404.html` folosește căile noi; `zen/sw.js` are cache nou
  (`zen-cache-v4`). Unealta locală `qr/index.html` are `folder: 'zen'`.
  Numele worker-ului Cloudflare (`sweet-sour`, în `wrangler.jsonc`) NU se
  schimbă — e în adresa `…workers.dev` din codurile QR. Consecințe pe
  telefoanele personalului: aplicația instalată de la `/sweetandsour/`
  deschide `/zen/` prin redirect, dar iese din „scope"-ul ei — se
  reinstalează o dată din noul link (abonarea push se reface singură la
  prima intrare). `localStorage`-ul clienților are prefix nou (din folder),
  deci coșurile vechi și consimțământul se cer din nou — normal.
- **Filtrele pe etichete** (cu alcool, fără alcool, calde, reci, vegan…)
  nu mai stau toate sub căutare: un buton-pâlnie (`#btnFiltre`, lângă
  căutare, apare doar dacă meniul are etichete) deschide fereastra
  `#filtreOverlay` cu chip-urile; bulina `#filtreNr` arată câte sunt
  bifate, butonul principal spune „Arată N produse" (numărat live), „Șterge
  filtrele" le scoate. Sub căutare rămân doar filtrele bifate, fiecare cu ✕
  (`#filtreEtichete`). Logica de filtrare (`activeEtichete`, toate trebuie
  să se potrivească) e neschimbată; I18N `filtreTitlu/filtreDesc/
  filtreSterge/filtreTot/filtreArata(n)`. Chip-urile de categorii rămân la
  locul lor.

## Runda 31 — mesele unite se lipesc, sigla transparentă, filtre automate

- **Unirea = lipire.** Când o masă e lăsată peste alta (ținere + tragere în
  modul normal, tragere simplă în „Editează harta"), se așază **lipită** de
  țintă pe latura dinspre care a venit degetul (`locLanga`: dreapta / stânga /
  jos / sus; dacă latura nu încape în încăpere sau e ocupată de altă masă, se
  ia următoarea liberă; dacă niciuna nu e liberă, rămâne pe latura preferată,
  peste ce e acolo). Un grup lipit (`grupurileMeselor` = componente conexe
  ale legăturilor, `laturaAtingere` cu toleranță 1,5 unități) se desenează
  ca **o singură masă**: `.grup-mese` (stadion — `border-radius: 9999px`,
  sau dreptunghi rotunjit dacă vreo masă e pătrată) în spatele cardurilor,
  care devin transparente (`.in-grup`); scaunele de pe laturile lipite dispar
  (`scauneHtml(m, s, ascunse)`); culoarea grupului e starea cea mai urgentă
  dintre mese (`PRIORITATE_STARE`: mov > roșu > portocaliu > albastru >
  verde > rezervată > liberă). Mesele unite dar depărtate rămân cu linia
  punctată. **Tragerea unei mese departe de partenere o desparte** (pe azi:
  rânduri `mese_azi` cu `cu: null`, partenerele rămase se leagă între ele;
  în editare: `unita_cu` șters). `perecheaMesei` întoarce acum tot grupul,
  nu doar vecina directă (nota mesei adună tot grupul).
- **Editarea hărții ignoră aranjarea „pe azi"** (`dreptunghiMesei`, `unitaCu`
  citesc `meseAzi` doar în modul normal), iar „Salvează harta" scrie
  `{mesa, reset: true}` pentru toate rândurile de azi — harta salvată e cea
  pe care o vede toată lumea. Fereastra mesei: forma implicită e **rotundă**
  (înainte, orice masă deschisă în fereastră devenea pătrată la salvare —
  de aici mesele pătrate „apărute" după unire).
- **Sigla ZeN transparentă**: `zen/icons/logo-inchis.svg` = același desen cu
  literele în crem (`#f3f1e8`, frunza rămâne `#82ad6b`), pentru fundalul
  închis al meniului și panoului; `config.js` `LOGO: 'icons/logo-inchis.svg'`,
  `LOGO_FUNDAL: ''` (fără card). `logo.svg` / `logo-print.png` rămân
  originalul (litere verde închis) pentru print și fundal deschis. PNG-urile
  (`logo.png` 1400 px crem, `mark.png` 800 px crem, `logo-print.png` 2000 px
  original) sunt randate cu `sharp` (librsvg) din SVG, tăiate la conținut
  (`trim`), transparente. Iconițele aplicației rămân pe alb. Paginile de
  start au marca ZeN pe fundal verde închis; `zen/404.html` fără card alb.
- **Filtrele apar fără să bifeze directorul nimic**: `eticheteAutomate(r)`
  (aceleași regexuri `CUV` ca butonul din panou) rulează și în meniul
  clientului, în `dbToItem`: `etichete = etichetele directorului +
  automatele` (ce e bifat are prioritate, nu se contrazice). Butonul-pâlnie
  apare deci pe orice meniu cu băuturi. Raportat: „nu apare meniul de
  filtrare" — apărea doar dacă directorul apăsa „Etichete automate" și
  publica.

## Runda 32 — toate filtrele într-un loc, scaunele grupului pe contur, meniul zilei la Meniu

- **Fereastra de filtre acoperă tot**: și categoriile (Toate / Semnătura
  casei / Cocktailuri…) au intrat în fereastra deschisă din butonul-pâlnie,
  secțiunea „Categorie" (o singură alegere) deasupra secțiunii „Etichete"
  (mai multe). Rândul vechi de categorii de sub căutare (`#tagFilters`) a
  dispărut; sub căutare rămân doar filtrele alese, cu ✕ (`#filtreEtichete`,
  chip-uri `data-cat` / `data-eticheta`). Bulina de pe buton numără
  categoria + etichetele; „Arată N produse" numără la fel. `renderFiltre()`
  desenează tot (fereastra, rândul activ, bulina); `resetFiltre()` întoarce
  la „Toate" și golește etichetele (și după trimiterea comenzii).
  Coșul („Comanda mea") nu mai e o categorie în rând — se deschide din
  butonul de jos și are butonul **„← Înapoi la meniu"** (`#cartBack`) în
  antet. Antetul coșului: „1 produs ales" / „3 produse alese"
  (`cartItemLabel1` / `cartItemsLabel`).
- **Scaunele unui grup lipit stau pe conturul comun**, nu la mesele din
  grup: `scauneGrupHtml(x1, y1, x2, y2, n, r)` împarte perimetrul
  stadionului / dreptunghiului rotunjit (8 segmente: 4 laturi + 4 arce, raza
  `r` în unități) în `n` bucăți egale și pune câte un scaun la mijlocul
  fiecăreia, cu 0,5 unități în afara conturului (ca la mesele singure) și
  rotit după normală (`--rot`). `n` = suma scaunelor rămase meselor din grup
  (`numarScaune(m, s, ascunse)` = câte scaune desenează `scauneHtml` după ce
  laturile lipite le pierd). Cardurile din grup nu mai desenează scaune
  proprii (înainte, la mese de mărimi diferite, scaunele de pe laturile
  nelipite rămâneau înăuntrul conturului comun — raportat: „scaunele intră
  una în alta"). Raza conturului se calculează în unități și se pune inline
  (`border-radius` în px, din lățimea grilei / `plan.w`), ca scaunele să
  urmeze exact același contur.
- **Meniul zilei la director stă în tabul „Meniu"**, deasupra editorului de
  produse (panoul `#panelMeniulZilei` primește `data-grup="meniu"` la
  `setupUserEnvironment` pentru director și e mutat înaintea editorului;
  `admArata('meniu')` încarcă și meniul zilei). La manager rămâne în Setări
  (nu are editor de produse). Ghidul rapid: pasul „Meniu" pomenește meniul
  zilei, pasul „Setări" nu.
- **Etichete automate mai deștepte** (aceleași reguli în panou și în meniul
  clientului): băuturile cu alcool sunt **reci** dacă nu au un cuvânt sigur
  de cald (`cald_sigur`: vin fiert, ciocolată caldă, fierbinte, grog, hot
  toddy, irish coffee, supă, ciorbă) — înainte „Old Fashioned" rămânea fără
  cald/rece, iar „Espresso Martini" ieșea cald; la egalitate câștigă
  cuvintele sigure (`rece_sigur`: iced, frappe, cold brew, gheață,
  smoothie, limonadă… — un „iced latte" e rece). `whisk(?:e?y)?` — înainte
  `\bwhisk\b` nu prindea „whisky" / „whiskey" (un whisky simplu, fără alt
  cuvânt de alcool, nu era „cu alcool").
- `zen/sw.js` → `zen-cache-v6`, `m3/sw.js` → `m3-cache-v4`.

## Runda 33 — o singură notificare, ospătarul vede doar ce e gata, nota mesei, harta pe telefon

- **Notificarea dublă** („🍽️ Masa 10 — comanda e gata" + „🍽️ Comanda gata")
  venea din două surse: push-ul trimis de bază (`trg_notifica_gata` →
  `notifica-comanda`, tag `gata-<id>`) și notificarea pusă de pagina
  deschisă în fundal (`showBackgroundAlert`, tag fix `zen-alert`). Acum
  `continutNotificare(c, tip)` din panou produce **același titlu, text și
  tag** ca funcția Edge (`continut()` din `notifica-comanda/index.ts`):
  `comanda-<id>` / `gata-<id>` / `alerta-<masă>`. `showBackgroundAlert(title,
  body, tag)` nu mai arată nimic dacă există deja o notificare cu tag-ul
  (`reg.getNotifications({tag})`), iar `sw.js` (`push`) — dacă pagina a
  apucat să o pună prima — o **înlocuiește în liniște** (`renotify:false`,
  fără `vibrate`). Chrome cere ca fiecare push să arate ceva, de aceea nu se
  sare peste `showNotification`, doar se face tăcută. Badge-ul paginii e acum
  tot `badge-96.png`. Cache SW: zen v7, m3 v5, skyfall v4.
- **Ospătarul nu mai vede comenzile în lucru** (`noua` / `acceptata`) —
  raportat: „nu vreau să-mi apară la ospătari ce am comandat imediat, trebuie
  să-mi zică barul că e gata". Filtrul din `renderOrders` pentru `ospatar`:
  doar cererile de la mese, `gata` și `gataDeDus` (finalizată de sub 10
  minute — `GATA_DE_DUS_MS`); cardurile dispar unul câte unul la re-randare
  (`resincronizeaza` la 60 s). Consecință: butonul „✏️ Modifică comanda" nu
  mai apare la ospătar (o comandă în lucru se modifică de la bar / manager);
  cererea „vrea să schimbe comanda" ajunge tot la el, ca cerere. Push-ul
  către ospătari era deja doar pentru `gata` și cereri (migrarea 22). Textele
  ghidului actualizate.
- **Istoric = note de plată, nu comenzi.** `noteleZilei(comenzi, eliberari)`
  grupează comenzile finalizate pe masă și le taie în **note**: granița e
  eliberarea mesei (jurnal `mesa_liberada` — `eliberariRecente` din
  `loadFreedTables` + realtime pentru azi, `istoricZi.eliberari` citit din
  jurnal pentru ziua aleasă; jurnalul le ține 3 zile), un bon deja confirmat
  înainte de comanda următoare (`bon_scos_la < created_at`) sau o pauză de
  peste 2 ore (zilele fără jurnal). Cererile de la masă (nota cash/card,
  ajutor) intră în nota mesei ca rânduri „🔔 01:30 · Nota (cash)"; comenzile
  anulate rămân carduri separate; o „notă" doar cu cereri, fără comenzi, își
  arată cererile ca înainte. `cardNota(n)`: produsele **adunate** pe nume
  (`3× Bere fără alcool`), notițele 📝, **Total**, interval orar, personalul,
  un `<details>` „Comenzile, una câte una" cu ora, produsele, 🧾 dacă are
  bonul și ✕ (retur, doar pe ziua curentă, bar/manager), și **un singur
  „🧾 Confirmă bonul · 194.00 lei"** → `toggleBonNota(ids, stare)`: update pe
  toate comenzile notei (plus părțile-pereche `grup_comanda`), o singură
  confirmare cu totalul și numărul de comenzi, jurnal `ticket_confirmado` cu
  lista `comenzi`, „Înapoi" pe fiecare (`revino(id,'bon')`). Parțial
  confirmat: „Confirmă bonul · 2 din 6 confirmate" (bifează restul);
  managerul poate scoate confirmarea. `renderOrders` a fost împărțit:
  `cardComanda(order)` (cardul de până acum) + `randeazaIstoricNote(container,
  comenzi, cardComanda)` pentru tabul Istoric; contorul de sus: „3 note · 9
  comenzi · 1 anulate".
- **Harta pe telefon** încape pe lățimea ecranului (fără derulare
  laterală — `min-width:640px` a dispărut) și **totul se scalează** cu
  mărimea hărții: `.panel-harta { container-type: inline-size }`, iar
  `.plan-sala` definește `--u: calc(100cqw / var(--plan-w))` = pixeli pe
  unitate (`--plan-w` pus din JS, 100 sau 70). Numărul mesei
  `clamp(11px, 2.6u, 22px)`, timpul `clamp(8px, 1.55u, 13px)`, scaunele
  `2.2u × 1.4u` (7–16 px), raza conturului grupului `calc(r * var(--u))`
  (nu mai e nevoie de `upx`). Pe hartă mică (`@container (max-width:480px)`)
  dispare eticheta zonei din plan și rândul „⏱" de pe masa mov (rămâne
  numărătoarea). Pe telefon panoul hărții are padding 8 px și iese 12 px în
  marginile paginii (`.panel-harta`), pereții au 4 px. Pe un telefon de
  390 px o masă normală are ~43 px, una mare ~54 px.

## Runda 34 — după code review: notificări, fereastra mesei, ANPC

- **Dedublarea notificărilor era prea lacomă.** `showBackgroundAlert` sărea
  peste orice notificare cu același tag deja pe ecran, iar tag-ul cererilor
  e pe masă (`alerta-<masă>`), nu pe comandă; cum notificările au
  `requireInteraction`, o cerere veche neatinsă din tavă înghițea următoarea
  cerere de la aceeași masă (și push-ul o înlocuia în liniște, fără
  vibrație). Acum „dublură" înseamnă doar o notificare cu același tag din
  **ultimul minut** (`n.timestamp`, `NOTIFICARE_DUBLA_MS = 60000`), în pagină
  și în `sw.js`; una mai veche e înlocuită cu sunet (`renotify:true`).
- **Fereastra mesei arată unirea și fără comenzi.** Raportat: „când le unesc
  cu drag and drop și apăs pe ele nu apare ca fiind unite" — linia „🔗 Unită
  cu masa…" se construia doar dacă masa atinsă avea comenzi *și* partenerele
  aveau comenzi. Acum `openTableAction`: titlul devine „Masa 20 + 40", iar
  caseta notei apare oricum, cu „🔗 Unită cu masa 40 (pe azi) — nimic
  comandat încă" sau „— împreună 76.00 lei" (totalul tuturor meselor din
  grup, chiar dacă cea atinsă n-a comandat). „(pe azi)" = unire făcută de
  personal (`meseAzi`), altfel e din harta directorului.
- **Nota mesei**: o cerere venită înaintea primei comenzi a unei vizite
  (ex. „cheamă ospătarul") nu mai desparte nota — și cererile actualizează
  „ultimul eveniment" al notei în `noteleZilei`.
- **ANPC**: în subsolul meniului clientului (toate localurile + `exemplu/`)
  e pictograma oficială **SAL** (`anpc-sal.png` la rădăcină, 201×50, luată
  de pe anpc.ro), cu link la `https://anpc.ro/sal` — cerută de Ordinul ANPC
  449/2022 pentru site-urile prin care se vând produse consumatorilor
  (comerciantul e localul, de aceea stă în meniul clienților, nu în panou și
  nu pe site-ul Ospia, care e B2B). Pictograma **SOL** nu se mai pune:
  platforma europeană de soluționare online a litigiilor s-a închis pe
  20 iulie 2025 (Regulamentul (UE) 2024/3228) și obligația de a afișa
  link-ul a dispărut odată cu ea. Vechiul link `anpc.ro/ce-este-sal/` dă 404
  — pagina actuală e `/sal`.
- Contractul regenerat: termenul definit nu mai e „Platforma", ci **Ospia**
  (`Contract_licenta_mentenanta_Ospia.docx`, generator
  `scratchpad/contract_ospia.js`).
- Cache SW: zen v8, m3 v6, skyfall v5.

## Runda 35 — grupul se mută întreg, fereastra mesei mai simplă, nimic mai vechi de 5 minute

- **Fereastra mesei** (editare) a rămas cu: numărul, locurile, „unită cu".
  „Forma" și „Mărimea" au dispărut din UI: la salvare `forma = 'rotunda'`,
  `marime` se șterge (mărimea vine din `marimeImplicita` după locuri: ≤2
  mică 9, ≤4 normală 12, ≤6 mare 15, peste — lungă 22×12). Mesele pătrate
  vechi din config rămân desenate pătrate până sunt deschise și salvate.
- **Un grup lipit se mută ca o singură masă.** `membriiGrupului(zone, mesa)`
  = masa + `perecheaMesei` cu cardurile și locul de plecare;
  `deltaInIncapere` limitează alunecarea ca toți membrii să rămână în plan;
  `asazaMembrii` mută cardurile și conturul (`.grup-mese` are acum
  `data-mese`, `data-x1/y1`, ca să alunece și el în timpul tragerii).
  Ținere (mod normal): la ridicare toți membrii primesc `.ridicata`;
  lăsat în gol → `scrieMeseAzi([...])` un rând `mese_azi` pe membru, cu
  legăturile păstrate (o masă singură se mută ca înainte); lăsat peste altă
  masă → masa trasă se lipește de țintă (`locLanga` ignoră membrii grupului,
  `ignora`), restul vin după ea cu același deplasament, iar membrii care nu
  arătau spre nimeni arată spre ea (altfel grupul s-ar fi rupt când masa
  trasă își schimbă `cu`). **Tragerea deoparte nu mai desparte**: despărțirea
  e doar prin ținere pe loc („Desparți mesele…?", toate revin). În editare la
  fel: grupul se mută cu `mesa.x/y` pe toți membrii; despărțirea din
  fereastra mesei („— nu e unită —"). `mesaSub(cx, cy, excluse)` primește
  acum un Set (toate cardurile trase).
- **Nimic mai vechi de 5 minute**: (1) `loadOrders` la resincronizare
  (revenire în prim-plan, net revenit, la 60 s) anunță ca „noi" doar
  comenzile din ultimele 5 minute (`ALERTA_VECHE_MS`) — înainte, la
  întoarcerea în aplicație suna și arăta notificarea unei comenzi de acum o
  oră; comanda rămâne pe tablă, roșie. (2) Funcția Edge `notifica-comanda`
  (v10 pe wnwl, v7 pe cjav): `TTL: 300` (serviciul de push renunță la
  mesajul pe care nu-l poate livra în 5 minute) și `trimisLa` în conținut;
  `urgency: high` era deja (trezește telefonul din economisire).
  (3) `sw.js`: un push cu `trimisLa` mai vechi de 5 minute se arată fără
  sunet (`silent`) și se închide imediat (Chrome cere o notificare la fiecare
  push, altfel afișează el una generică).
- „Rulează în fundal": o pagină web nu poate rula în fundal; notificările
  vin prin push cu aplicația închisă — pe Android din Chrome (dacă întârzie:
  bateria → fără optimizare pentru Chrome), pe iPhone doar cu aplicația pusă
  pe ecranul principal (iOS 16.4+) și notificările permise.
- Cache SW: zen v9, m3 v7, skyfall v6.

## Runda 36 — fără al doilea factor, despărțirea aduce mesele la loc, spații > zone

- **Al doilea factor a fost scos** (cererea localului). Din panou au dispărut
  fereastra de cod de după login (`verificaMfa`, `#mfaOverlay`) și panoul
  „Al doilea factor" din Setări → Siguranță (secțiunea a rămas doar pentru
  director: cod unic pe masă, limite, mutare). Migrația 29 (aplicată pe
  ambele proiecte): `mfa_ok()` răspunde mereu `true` (rămâne, pentru că o
  cheamă `is_staff`, `current_staff_rol`, politica pe `staff_roles` și
  trigger-ul comenzilor) și `delete from auth.mfa_factors` (pe wnwl era un
  factor neverificat, rămas de la o înrolare neterminată). TOTP din
  Authentication → Multi-Factor poate rămâne pornit — nu-l mai folosește nimic.
- **Despărțirea aduce mesele unde erau.** Raportat: după ce a lipit 20 de 10 în
  „Editează harta" și a salvat, ținerea pe loc nu le mai despărțea (un „reset"
  `mese_azi` lasă unirea din harta de bază), iar din fereastra mesei („nu e
  unită") rămâneau una lângă alta. Acum, la lipire în editare, masa trasă (și
  ce vine cu ea) își ține minte locul de dinainte în `mese[].liber = {x, y}`
  (salvat în `config_mese`); la mutarea grupului în gol, `liber` se mută cu
  același deplasament. Despărțirea: **în editare**, ținere pe loc (0,45 s,
  `tragere.tinut`) pe o masă unită → „Desparți mesele…?" →
  `desparteGrupul` (fiecare la `liber`, fără `unita_cu`/`liber`); din
  fereastra mesei, „nu e unită" → `desparteDe` (masa și componenta care
  rămâne lipită de ea, `componentaFara`, revin cu același deplasament).
  **Pe azi** (mod normal): pentru mesele unite în harta de bază
  (`inGrupBaza`) se scrie `mese_azi {mesa, cu: null, x, y}` la locul liber
  (`loculLiber` = `liber` mutat cu cât s-a mutat masa azi), pentru cele
  unite azi rămâne `reset`. Locurile trebuie să existe deja în hartă; nu se
  ocolesc mesele care s-au așezat între timp acolo.
- Locurile nu se schimbă la unire/despărțire: grupul arată scaunele tuturor
  meselor, minus cele de pe laturile lipite; la despărțire fiecare masă își
  arată iar locurile ei din hartă. (Masa 20 avea 8 locuri salvate în harta
  de azi, față de 6 aseară — schimbate din fereastra mesei, nu de cod.)
- **Spații > zone.** Taburile de sus ale hărții sunt acum *spații*
  (interior, terasă, etaj — butoanele „➕ Spațiu nou" / „🗑️ Sterge spațiul";
  cheia din `config_mese` rămâne `zones[]`), iar **zona unui ospătar se
  scrie pe mese**: `mese[].zona` (text, max 30). Regula unică
  (`zonaMesei` în panou, `ospatari_pentru_masa` în bază, migrația 29):
  zona mesei = `zona` scrisă pe ea, altfel numele spațiului — deci hărțile
  fără zone pe mese merg ca înainte (spațiul = zona). `zoneleSalii()`
  întoarce toate zonele derivate ({nume, spatii, explicita}); fereastra
  „Zona mea" le listează pe toate (cu spațiul în mic când diferă), iar
  întrebarea automată la prima intrare / taburile „Zona mea · Cereri · Alte
  zone" apar când sunt ≥ 2 zone derivate. **Pe hartă**: toate mesele
  spațiului se văd deodată; scaunele unei mese cu zonă sunt în culoarea zonei
  (`--zc`, `culorileZonelor()` — 8 culori după ordinea primei apariții;
  conturul unui grup ia culoarea primei mese cu zonă), sub număr scrie zona
  (`.t-zona`, ascunsă pe hărți sub 480 px), iar deasupra hărții e legenda
  (`#zoneLegenda`, `randeazaLegendaZone`): zonele spațiului, cine le acoperă
  azi (`zoneOspatari`: cine a ales zona sau „toate", „tu" pentru ospătar) și,
  dacă există mese fără zonă, „<spațiu> (mesele fără zonă)". **Cum se dau
  zonele**: în „Editează harta", unealta „📍 Zone" (`uneltaPlan = 'zona'`,
  `zonaPensula`): chip-uri cu zonele existente, „⌀ Fără zonă", „➕ Zona nouă"
  (prompt; `zoneNoi` până primesc mese) — atingi mesele și le dai zona
  (a doua atingere o scoate); sau din fereastra mesei, câmpul „Zona" cu
  `datalist` din zonele existente.
- Harness: `__t.zone / culori / zonaMesei / esteZonaMea / setZoneOspatari /
  setZoneMele / legenda / bara / unelte / deschideZona / deschideMasa`.

## Înainte de deschidere

1. Authentication → Providers → Email: **Allow new users to sign up** = oprit.
   (Nu „Enable email provider" — acela e logarea însăși.) Pe 14 septembrie
   2026 era pornit pe ambele proiecte; baza refuză oricum înregistrările
   (migrația 18), dar setarea trebuie oprită.
2. **Leaked password protection** e doar pe planul Pro; până atunci, pune
   parola minimă la 10 caractere din aceeași pagină.
3. GitHub → Settings → Secrets and variables → Actions → `CHEIE_BACKUP`
   (cheia din Vault `cheie_backup`), altfel copiile nu se fac.
4. (Al doilea factor a fost scos în runda 36 — nu mai e nimic de activat.)
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
