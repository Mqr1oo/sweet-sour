#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sweet & Sour — creare conturi de personal.

Creeaza cele 10 conturi prin Admin API-ul Supabase. Este calea corecta: GoTrue
scrie si in `auth.identities`, iar fara acele randuri conturile arata bine in
consola dar esueaza la login cu parola. De aceea NU se insereaza direct in
`auth.users` prin SQL.

Parolele se genereaza local, cu `secrets` (generator criptografic), si se scriu
intr-un fisier cu drepturi 600. Nu se afiseaza pe ecran si nu pleaca nicaieri.

Nu are nevoie decat de Python 3.8+. Fara jq, fara pachete externe.

UTILIZARE
  1. Supabase -> Project Settings -> API -> service_role (secret)
  2. Linux / macOS:  export SUPABASE_SERVICE_KEY='eyJ...'
     Windows (PS):   $env:SUPABASE_SERVICE_KEY='eyJ...'
  3. python3 creeaza_conturi_staff.py

Optional:
  --domeniu sweetnsour.com    domeniul de email (implicit: sweetnsour.com)
  --dry-run                   arata ce ar face, fara sa creeze nimic
"""
import argparse
import json
import os
import secrets
import string
import sys
import urllib.error
import urllib.request
from datetime import datetime

PROJECT_REF = "cjavzdnsebbkiiefigvi"

# utilizator -> rol. Rolurile valide sunt: director, bar, bucatarie, ospatar.
CONTURI = [
    ("director", "director"),
    ("barman",   "bar"),      # exista deja bar@sweetnsour.com — vezi README
    ("bucatar",  "bucatarie"),
] + [("ospatar%d" % i, "ospatar") for i in range(1, 8)]

ALFABET = string.ascii_letters + string.digits + "!@#%^*_-"


def parola_noua(n=20):
    """Parola aleatorie, cu cel putin cate un caracter din fiecare clasa."""
    while True:
        p = ''.join(secrets.choice(ALFABET) for _ in range(n))
        if (any(c.islower() for c in p) and any(c.isupper() for c in p)
                and any(c.isdigit() for c in p)
                and any(c in "!@#%^*_-" for c in p)):
            return p


def creeaza_cont(base_url, key, email, parola):
    """Returneaza (uid, None) la succes, (None, mesaj_eroare) la esec."""
    req = urllib.request.Request(
        base_url + "/auth/v1/admin/users",
        data=json.dumps({
            "email": email,
            "password": parola,
            "email_confirm": True,
        }).encode(),
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r).get("id"), None
    except urllib.error.HTTPError as e:
        try:
            b = json.load(e)
            msg = b.get("msg") or b.get("message") or b.get("error_description") or str(b)
        except Exception:
            msg = "HTTP %s" % e.code
        return None, msg
    except Exception as e:
        return None, str(e)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--domeniu", default="sweetnsour.com",
                    help="domeniul de email (implicit: sweetnsour.com)")
    ap.add_argument("--dry-run", action="store_true",
                    help="nu creeaza nimic, doar arata planul")
    a = ap.parse_args()

    if "." not in a.domeniu:
        sys.exit("Domeniul '%s' nu are TLD. Un email fara punct in domeniu e\n"
                 "respins de Supabase, iar resetarea parolei n-ar functiona.\n"
                 "Foloseste ceva de forma: --domeniu sweetnsour.com" % a.domeniu)

    if a.dry_run:
        print("DRY RUN — nu se creeaza nimic.\n")
        for user, rol in CONTURI:
            print("  %-28s %s" % ("%s@%s" % (user, a.domeniu), rol))
        print("\n%d conturi." % len(CONTURI))
        return 0

    key = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    if not key:
        sys.exit("Lipseste SUPABASE_SERVICE_KEY.\n"
                 "  Supabase -> Project Settings -> API -> service_role (secret)\n"
                 "  export SUPABASE_SERVICE_KEY='eyJ...'")

    base_url = "https://%s.supabase.co" % PROJECT_REF
    fisier = "parole_staff_%s.txt" % datetime.now().strftime("%Y%m%d_%H%M")

    linii, roluri, esecuri = [], [], 0

    for user, rol in CONTURI:
        email = "%s@%s" % (user, a.domeniu)
        parola = parola_noua()
        uid, err = creeaza_cont(base_url, key, email, parola)
        if uid:
            print("  ✓ %-28s %s" % (email, rol))
            linii.append("%-28s %-12s %s" % (email, rol, parola))
            roluri.append((uid, rol))
        else:
            print("  ✗ %-28s %s" % (email, err[:70]))
            esecuri += 1

    if not roluri:
        sys.exit("\nNiciun cont creat. Verifica cheia service_role si domeniul.")

    # fisierul cu parole, citibil doar de tine
    with open(fisier, "w", encoding="utf-8") as f:
        f.write("Sweet & Sour — conturi de personal\n")
        f.write("Generat: %s\n" % datetime.now().strftime("%Y-%m-%d %H:%M"))
        f.write("Proiect: %s\n\n" % PROJECT_REF)
        f.write("Fiecare angajat isi schimba parola la prima logare.\n")
        f.write("-" * 66 + "\n")
        f.write("\n".join(linii) + "\n")
    try:
        os.chmod(fisier, 0o600)
    except Exception:
        pass  # Windows

    # Rolurile se scriu cu service_role: `staff_roles` n-are politica de scriere,
    # deci nici directorul nu si-l poate schimba din aplicatie.
    sql = ("insert into public.staff_roles (uid, rol) values\n"
           + ",\n".join("  ('%s', '%s')" % (u, r) for u, r in roluri)
           + "\non conflict (uid) do update set rol = excluded.rol;\n")
    with open("roluri_staff.sql", "w", encoding="utf-8") as f:
        f.write(sql)

    print("\n" + "=" * 62)
    print("Ruleaza in Supabase -> SQL Editor (salvat si in roluri_staff.sql):")
    print("=" * 62)
    print(sql)
    print("Parole: %s" % fisier)
    print("Da-le pe canal privat, apoi sterge fisierul.")
    if esecuri:
        print("\n⚠️  %d cont(uri) au esuat — vezi mai sus." % esecuri)
    return 1 if esecuri else 0


if __name__ == "__main__":
    sys.exit(main())
