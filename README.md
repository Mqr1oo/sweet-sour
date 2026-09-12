# Meniu digital + panou de comenzi pentru localuri

> Explicat pe înțelesul oricui — fără termeni tehnici. Ce e scris cu **⭐** e
> partea care face diferența față de un meniu cu poze pe hârtie. Partea
> tehnică (cum e construit, baza de date, ce s-a schimbat de-a lungul
> timpului) e în [TEHNIC.md](TEHNIC.md).

---

## Pe scurt, în 30 de secunde

Clientul scanează un cod QR de pe masă, îi apare meniul pe telefon, alege ce
vrea și trimite comanda. **Fără aplicație de instalat, fără cont, fără să-și
dea numele.** Comanda ajunge în aceeași secundă la bar și la bucătărie, cu
sunet, iar clientul vede pe telefon, pas cu pas, ce se întâmplă cu ea:
„trimisă" → „acceptată — vine" → „preluată, poftă bună". Când vrea să
plătească, apasă un buton și barul aude „masa 4 cere nota, cash".

Personalul are propria aplicație (panoul), pe telefon sau pe calculatorul de
la bar: comenzile în timp real, harta sălii cu timere pe fiecare masă, cine ce
a făcut, încasările zilei. Fiecare rol vede doar ce e treaba lui.

Totul rulează în browser, pe orice telefon, iPhone sau Android, fără
instalare. Localul are nevoie doar de net.

---

## Cuprins

1. [Ce vede clientul](#1-ce-vede-clientul)
2. [Drumul unei comenzi](#2-drumul-unei-comenzi)
3. [Cine lucrează cu panoul: rolurile](#3-cine-lucrează-cu-panoul-rolurile)
4. [Panoul barului și al bucătăriei](#4-panoul-barului-și-al-bucătăriei)
5. [Aplicația ospătarului](#5-aplicația-ospătarului)
6. [Sala: harta meselor, cu timere](#6-sala-harta-meselor-cu-timere)
7. [Nota de plată](#7-nota-de-plată)
8. [Anularea unei comenzi](#8-anularea-unei-comenzi)
9. [Managerul și directorul](#9-managerul-și-directorul)
10. [Setările localului](#10-setările-localului)
11. [Închiderea zilei](#11-închiderea-zilei)
12. [Meniul și stocul](#12-meniul-și-stocul)
13. [Ce se întâmplă când pică netul](#13-ce-se-întâmplă-când-pică-netul)
14. [Datele personale și legea (GDPR)](#14-datele-personale-și-legea-gdpr)
15. [Ce nu face (încă)](#15-ce-nu-face-încă)
16. [Dicționar](#16-dicționar)

---

## 1. Ce vede clientul

Scanează codul QR de pe masă și îi apare meniul, în culorile localului.

- **Primul ecran**: un mesaj scurt despre faptul că telefonul lui ține minte
  limba și comanda (obligatoriu prin lege), apoi alege **limba** — română sau
  engleză — și gata, e în meniu. Un tur de 30 de secunde îi arată cum
  funcționează; îl poate sări.
- **Meniul**: categorii, poze, descrieri, ingrediente, alergeni, prețuri.
  Căutare. Produsele terminate apar marcate „Stoc epuizat", nu dispar pur și
  simplu — știe că există, dar nu sunt azi.
- **⭐ Meniul e mereu cel adevărat.** Dacă directorul schimbă un preț sau
  bucătăria marchează un produs ca terminat, clienții care au meniul deschis
  văd schimbarea în aceeași secundă, fără să dea refresh.
- **Coșul**: plus / minus pe fiecare produs, observații („fără zahăr"), apoi
  „Trimite comanda". Prima dată i se cere **numărul mesei** (scris pe cod).
- **⭐ Urmărirea comenzii**: sus pe ecran apare o bară „Comanda ta" care
  spune exact unde e: *trimisă — așteaptă să fie văzută* → *acceptată — vine*
  → *preluată, poftă bună*. Nu mai stă să se întrebe dacă i-a ajuns comanda.
- **Poate scoate ceva de pe telefon** cât timp comanda încă n-a fost
  acceptată de bar (s-a răzgândit, a greșit). După ce barul a acceptat-o,
  butoanele dispar și apare **„🙋 Cheamă ospătarul să schimbe comanda"** —
  la bar sună, ospătarul vine la masă.
- **Butonul „Plată / Ajutor"**: *Vreau să plătesc — cash*, *— card*, sau *Am
  nevoie de ajutor*. Barul aude imediat, cu voce, „Masa 4 cere nota, cash".
- **Împarte nota**: în părți egale sau fiecare ce a comandat, cu bacșiș —
  socoteala se face pe telefon, pe ce a comandat efectiv la vizita asta.
- **Când comanda e anulată de local**, telefonul vibrează și îi arată cine a
  anulat-o și de ce („Anulată de Andrei · Produs epuizat").
- **La final**, o întrebare de o secundă: cum a fost? 5 stele → e trimis să
  lase recenzie pe Google; mai puțin → părerea rămâne la director, privat.
- **Comenzi la pachet** (dacă localul le pornește): nume și telefon, șterse
  automat după 48 de ore.

Ce NU i se cere niciodată clientului: cont, nume, email, telefon (în afară de
pachet), locație, cameră. Nu există cookie-uri de reclame, urmărire sau
profilare.

---

## 2. Drumul unei comenzi

O comandă trece prin **trei stări**, iar clientul le vede pe toate:

| Starea | Cine o pune | Ce vede clientul |
|---|---|---|
| **Trimisă** | intră singură | „Trimisă — așteaptă să fie văzută" |
| **Acceptată** | barul / bucătăria apasă **„✓ Acceptă"** | „Acceptată — vine acum" |
| **Preluată** | barul apasă **„Gata"** (cu ospătari) sau **„Preluată"** (fără ospătari) | „Preluată. Poftă bună!" |

De ce doi pași și nu unul: „Acceptă" înseamnă *am văzut-o, o fac* — oprește
alarma și îl liniștește pe client. „Gata / Preluată" înseamnă *a plecat de la
bar* — comanda se închide, masa intră în istoric pentru bon. Dacă ar fi un
singur buton, clientul n-ar ști niciodată dacă l-a văzut cineva.

Băuturile merg la **bar**, mâncarea la **bucătărie**, ca două jumătăți ale
aceleiași comenzi. Fiecare panou vede doar partea lui. Dacă bucătăria e
închisă (setare), mâncarea ajunge tot la bar.

O comandă neacceptată **nu tace**: telefonul de la bar bipăie, spune masa cu
voce și apoi sună ding-dong până apasă cineva „Acceptă" — pe oricare dintre
dispozitive. Alarma nu se oprește singură.

---

## 3. Cine lucrează cu panoul: rolurile

Fiecare persoană intră cu contul ei (email + parolă). Contul are un **rol**, și
rolul decide ce vede și ce poate face — nu doar pe ecran, ci și în baza de
date: chiar dacă cineva ar umbla la aplicație, serverul refuză ce nu are voie.

| Rol | Ce face |
|---|---|
| **Bar** | primește comenzile de băuturi, le acceptă, le închide; aude cererile de la mese; confirmă bonurile; anulează cu codul lunii |
| **Bucătărie** | primește comenzile de mâncare, le acceptă, le închide; poate marca produse ca terminate |
| **Ospătar** | vede ce e de dus la masă și cererile de la mese; modifică sau anulează comenzi (cu codul lunii); ia comenzi în numele clientului; își alege zona |
| **Manager** | lucrează: modifică orice comandă, anulează fără cod, are **codul lunii**, pornește „ora de vârf", aranjează sala; **nu** vede jurnalul și datele personalului |
| **Director** | **⭐ doar observă**: nu e deranjat de nicio alarmă, nu confirmă, nu modifică, nu anulează. Are încasările, rapoartele, jurnalul complet, anulările, turele, setările, meniul |

Rolurile se dau doar de la consolă, nu din aplicație — nimeni nu-și poate da
singur alt rol.

---

## 4. Panoul barului și al bucătăriei

- **Comenzi**: carduri cu masa, ora, produsele, observațiile clientului.
  Roșu = neacceptată, galben = în lucru. Butoane: **✓ Acceptă**, **Gata /
  Preluată**, ✏️ modifică, ✕ anulează.
- **⭐ Alarma de comandă nouă**: bip, „Comandă nouă, masa 4" (cu voce, în
  română, cu diacritice ca să sune corect), apoi ding-dong continuu până
  acceptă cineva. Masa se spune o singură dată, chiar dacă comanda are și bar
  și bucătărie.
- **Cererile de la mese** („Masa 4 cere nota, cash", „Masa 6 cere ajutor",
  „Masa 3 vrea să schimbe comanda — trimite ospătarul") sună **doar la bar**,
  cu un sunet diferit de comandă, ca barmanul să știe fără să se uite.
- **Voce ON / OFF**: pornit, spune masa la fiecare comandă și cerere
  (bucătăria aude și produsele, barul observațiile). Oprit: doar bipurile și
  alarma. Butonul ține minte alegerea.
- **Dacă clientul scoate ceva** de pe telefon cât comanda e neacceptată,
  cardul clipește galben și telefonul spune ce s-a schimbat.
- **Notificări** și când telefonul e blocat sau aplicația e închisă (dacă le
  pornește).
- **Istoric**: comenzile terminate și anulate. Barul **confirmă bonul** pe
  fiecare — bifa rămâne pe numele lui, cu ora, și nu se mai poate scoate de
  la bar (doar managerul, dacă a fost o greșeală).
- **Stoc**: s-a terminat ceva? Îl blochezi și dispare pe loc din meniul
  clienților.
- **Comandă rapidă** (meniu): barul sau ospătarul trimite o comandă în numele
  clientului, exact ca de pe telefon.
- **Ghid rapid**: un tur de un minut, pe rol, care pornește singur prima dată
  și se poate relua oricând din „❓".

---

## 5. Aplicația ospătarului

Același panou, dar cu ce-l privește pe el:

- **Ce e de dus la masă**: când barul apasă „Gata", telefonul ospătarului
  bipăie, vibrează și spune masa. Cardul rămâne albastru câteva minute, apoi
  dispare singur.
- **Cererile de la mese**: nota (cash / card), ajutor, „vrea să schimbe
  comanda". Le preia cu **„Preluat"** — rămâne pe numele lui.
- **Calculatorul de rest**: pe cererea de notă vede totalul mesei, scrie cât
  a primit și îi arată restul.
- **Modifică comenzi**: scoate, adaugă, schimbă cantități — barul vede pe
  loc. Cât e neacceptată, oricând; după, în „fereastra de modificare" pusă de
  director.
- **⭐ Zona mea**: își bifează zonele de care răspunde (Terasă, Interior…).
  Comenzile din zona lui apar primele și îl anunță; cele din alte zone rămân
  vizibile, mai șterse, cu „📍 Interior · Maria" (cine le acoperă) — și le
  poate lua oricând dacă e nevoie (colegul e la fumat). I se cere zona la
  „Intru în tură".
- **Intru / Ies din tură**: apasă la venire și la plecare; directorul vede
  cine a fost în tură, cât, și pe ce zonă.

---

## 6. Sala: harta meselor, cu timere

Directorul desenează sala: zone (Terasă, Interior…) și mesele din fiecare.
Toată lumea vede aceeași hartă, live.

**⭐ Fiecare masă are timerul ei**, de când e ocupată și de când a comandat
ultima dată:

- **Verde** — ocupată, totul normal.
- **Portocaliu** — peste o oră fără nicio comandă: treci pe la ea.
- **Roșu** — peste două ore.
- **Albastru** — cere ajutor.
- **Mov** — a cerut nota; numărătoare inversă la secundă până se eliberează
  singură.

Atingi o masă și vezi **nota mesei**: totul de când e ocupată (de la ultima
eliberare) — total, câte comenzi, produsele adunate, zona și ospătarul ei.
Tot de aici: „Vezi comenzile", „Eliberează masa acum", sau pui cererea de
notă dacă clientul a cerut-o verbal (vezi mai jos).

Când „Sala plină", scrie mare.

---

## 7. Nota de plată

**Clientul apasă pe telefon** „Vreau să plătesc — cash / card" → la bar sună
și se aude „Masa 4 cere nota, cash" → cererea apare la bar și pe telefoanele
ospătarilor, cu totalul mesei și tot ce a consumat → cine scoate nota apasă
**„Preluat"** (rămâne pe numele lui) → masa e mov și **se eliberează singură
după N minute** (directorul alege: 5–60, implicit 15), sau barul o
eliberează pe loc din Sala.

**⭐ Clientul n-a apăsat nimic, a zis verbal unui ospătar — nu neapărat al
lui:** ospătarul (sau barul, de la calculatorul central) deschide masa în
Sala, vede nota mesei — total, comenzi, produse, zona, cine o acoperă — și
apasă „💵 Nota — cash" / „💳 Nota — card". Cererea intră în sistem ca și cum
ar fi apăsat clientul, marcată „cerută verbal, pusă de ospatar2", și merge pe
același drum. Dacă masa avea deja o cerere, fereastra o arată și nu lasă să
se pună a doua. Așa nu se încurcă ospătarii între ei: se vede pe fiecare masă
și pe fiecare cerere a cui e și cine a scos nota.

Comenzile anulate nu intră în total.

---

## 8. Anularea unei comenzi

Anularea înseamnă bani lipsă din casă, deci e cea mai păzită acțiune:

- **Cine**: barul, ospătarul, managerul. Bucătăria cere barului. Directorul
  nu anulează — observă.
- **Cum**: ✕ pe card → alegi **motivul** din listă (clientul s-a răzgândit,
  produs epuizat, comandă greșită, clientul a plecat, așteptare prea mare,
  greșeală la bar, retur, alt motiv scris) → alegi **numele tău** din lista
  pusă de director (contul de bar e comun, altfel nu s-ar ști cine a fost) →
  scrii **⭐ codul lunii**.
- **Codul lunii**: 6 cifre, altele în fiecare lună, pe care le vede **doar
  managerul** (și directorul) în panoul lui. Barul și ospătarul nu pot anula
  fără el — managerul îl spune când e de acord. Managerul anulează fără cod.
  Dacă s-a aflat, „Cod nou". **Un cod greșit nu anulează nimic și rămâne în
  istoricul directorului**, cu numele și masa.
- **Se poate anula și o comandă deja dusă la masă** (retur): ✕ e și în
  Istoric.
- **Ce rămâne**: cine (nume + cont), când, de ce, cu ce cod — în istoricul
  directorului, 30 de zile. Clientul vede pe telefon cine și de ce. Managerul
  aude pe loc fiecare anulare făcută de personal.
- Nu există nicio cale ocolită: chiar și direct în baza de date, o anulare
  fără motiv e refuzată.

---

## 9. Managerul și directorul

**Managerul** e cel care *lucrează*: modifică orice comandă, anulează fără
cod, are codul lunii și îl dă când e de acord, scoate confirmarea unui bon
greșit, pornește „ora de vârf" (avertisment pentru clienți), aranjează sala,
blochează produse din stoc. Nu e deranjat de comenzi noi, dar **aude fiecare
anulare** făcută de bar sau ospătari, cu numele și motivul. Ce **nu** vede:
jurnalul, rapoartele pe angajat, turele, feedback-ul clienților — și nu poate
șterge istoricul.

**Directorul** e cel care *observă*: nicio alarmă, niciun buton de lucru. Are
tot ce ține de bani și de oameni:

- **Sinteză**: încasări (după bonurile confirmate), comenzi finalizate, câte
  sunt fără bon, bar vs bucătărie, grafic pe ore (azi) sau pe zile (luna),
  top 5 produse, **⭐ harta orelor de vârf** (zi a săptămânii × oră, ultimele
  60 de zile — când să pui oameni în plus). Export Excel și CSV.
- **Meniu**: editorul de produse (nume, categorie, preț, descriere,
  ingrediente, alergeni, traducere în engleză, activ/inactiv).
- **Setări**: toate cele de mai jos.
- **Personal**: lista de angajați (numele pentru anulări), ture azi (cine,
  cât, pe ce zonă), raport pe angajat (comenzi, încasări, anulări, procent),
  **anulările: cine, când, de ce, cu ce cod** (și încercările cu cod greșit),
  bonuri neconfirmate pe angajat, bonuri confirmate pe barman, părerile
  clienților.
- **Jurnal**: fiecare acțiune din local, cu ora și cu cine — inclusiv ce au
  scos clienții din comenzi de pe telefon.
- **Zona de risc**: șterge tot istoricul (doar el).

---

## 10. Setările localului

Toate în Șef → Setări. **Doar directorul** le schimbă (managerul: doar „ora de
vârf"):

| Setare | Ce face |
|---|---|
| **Codul de anulare al lunii** | îl vede managerul și directorul; „Cod nou" dacă s-a aflat |
| **Ora de închidere, pe zile** | o oră pentru fiecare zi a săptămânii (vineri se închide mai târziu decât marți); vezi „Închiderea zilei" |
| **Cât stă masa după notă** | 5–60 de minute până se eliberează singură (implicit 15) |
| **Fereastra de modificare** | câte minute după acceptare mai poate modifica ospătarul o comandă |
| **Închide bucătăria** | mâncarea merge la bar; panoul barului își schimbă numele |
| **Ore de vârf** | avertisment roșu la clienți: așteptarea e mai mare |
| **Mod fără ospătari** | barul închide singur comenzile („Preluată") și preia cererile de la mese |
| **Comenzi la pachet** | pornit/oprit; oprit = clientul nici nu e întrebat |

---

## 11. Închiderea zilei

La ora de închidere a zilei respective (ora e a zilei în care ai deschis:
„vineri 04:00" înseamnă sâmbătă dimineața la 4), o dată pe zi, automat:

- se eliberează toate mesele;
- comenzile rămase deschise se închid (nu apar în rapoarte);
- cererile de la mese se șterg;
- **⭐ toate conturile de personal ies din aplicație.** A doua zi fiecare
  intră cu contul lui — așa se știe cine e pe tură, chiar dacă telefonul de
  la bar e același. Panourile deschise se deloghează singure, cu mesaj.

Tot de la ora asta începe „Azi" din rapoarte: dacă localul închide la 3,
comenzile de la 1 noaptea sunt ale serii, nu ale zilei următoare.

---

## 12. Meniul și stocul

- Meniul e **într-un singur loc** (baza de date): ce scrie directorul acolo
  văd clienții, și tot de acolo calculează serverul fiecare comandă — nu se
  pot desincroniza prețurile. Clientul nu poate trimite un preț inventat:
  serverul recalculează totul.
- Produsele au: nume, categorie, bar/bucătărie, preț (sau „preț variabil"),
  volum, ingrediente, alergeni, descriere, traducere în engleză, poză,
  „semnătura casei", activ/inactiv.
- **Stocul**: barul, bucătăria sau șefii blochează un produs terminat —
  apare pe loc „Stoc epuizat" la clienți, revine când îl deblochezi.
- Categoriile se fac singure din produse, în ordinea lor.
- **Coduri QR**: un generator (separat) face codul fiecărei mese cu numele
  localului pe el, la orice dimensiune, gata de print.

---

## 13. Ce se întâmplă când pică netul

- Panoul arată o bară galbenă „fără conexiune" și se reia singur când revine
  netul; comenzile intrate între timp sunt anunțate ca și cum ar fi intrat
  atunci.
- Telefonul clientului reîncarcă starea comenzii când revine pe ecran.
- Fiecare local are propria bază de date, separată — un local nu poate
  ajunge la comenzile sau banii altuia, nici prin greșeală.
- Datele stau în centre de date din Uniunea Europeană, pe conexiune
  criptată.

---

## 14. Datele personale și legea (GDPR)

**Pentru clienți**: nu se cere nimic personal. Se rețin masa, produsele,
observațiile și ora — și se șterg singure la 2 zile după închiderea comenzii
(pachet: numele și telefonul, 48 de ore). Primul ecran cere acordul pentru
stocarea locală. Politica de confidențialitate și termenii sunt în meniu, în
română și engleză, cu localul ca **operator** (vânzătorul, răspunzător de
alergeni și de produse) și platforma ca **furnizor tehnic**. Nu se folosesc
camera, microfonul, locația, nu se fac poze.

**Pentru personal**: panoul are „Informare date personal (GDPR)" — cine
răspunde de date, ce se reține (jurnalul acțiunilor 30 de zile, numele la
anulare, codul folosit, zonele, turele), de ce, cât timp, cine vede, ce
drepturi au, unde se plâng. **⭐ Se printează cu loc de semnătură** —
angajatul semnează un exemplar înainte să folosească panoul, cum cere legea.

Localul trebuie să completeze o singură dată: denumirea firmei, adresa și un
email de contact (în `config.js`).

---

## 15. Ce nu face (încă)

- Nu emite bonuri fiscale și nu se leagă la casa de marcat (barul confirmă
  bonul în aplicație, ca evidență).
- Nu încasează cu cardul prin aplicație — clientul plătește la ospătar.
- Nu are rezervări, opțiuni pe produs („fără gheață"), evaluări pe produs sau
  email zilnic cu raportul.
- Nu are imprimantă de bonuri (localul are deja ecran în bucătărie).

Toate se pot adăuga când e nevoie.

---

## 16. Dicționar

- **Panou** — aplicația personalului (bar, bucătărie, ospătari, șefi).
- **Acceptă** — „am văzut comanda, o fac"; oprește alarma, liniștește
  clientul.
- **Gata / Preluată** — comanda a plecat de la bar; se închide.
- **Cerere de la masă** — nota (cash/card), ajutor, „vrea să schimbe
  comanda". Sună doar la bar.
- **Preluat** — un ospătar a luat cererea; rămâne pe numele lui.
- **Nota mesei** — totul consumat la o masă de când e ocupată.
- **Codul lunii** — cele 6 cifre ale managerului, fără de care barul și
  ospătarii nu pot anula.
- **Zona** — bucata din sală de care răspunde un ospătar.
- **Jurnal** — istoricul fiecărei acțiuni, cu ora și cu cine; doar
  directorul îl vede.
- **Ora de închidere** — când se resetează ziua: mesele se eliberează,
  conturile ies, „Azi" începe de aici.
