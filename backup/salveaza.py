"""Copia de siguranta zilnica + tinut treaz.

Ruleaza din GitHub Actions (.github/workflows/backup.yml), o data pe zi:
  1. Intra pe fiecare proiect Supabase (o cerere la meniu, cu cheia publica).
     Planul gratuit pune proiectul pe pauza dupa o saptamana fara nicio
     cerere; cererea asta il tine treaz.
  2. Daca exista secretul CHEIE_BACKUP (GitHub -> Settings -> Secrets and
     variables -> Actions), descarca copia de siguranta (`export_backup`):
     meniul, ciorna, setarile, stocul epuizat. Fara nume de angajati, fara
     coduri de anulare, fara cheile meselor. O salveaza in backup/<local>/
     si pastreaza ultimele 30 de zile.

Localurile se iau singure din folderele care au config.js cu un proiect
Supabase real (nu demonstratia, nu sablonul).
"""
import json, os, re, sys, urllib.request, urllib.error
from datetime import datetime, timezone

RADACINA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTREAZA_ZILE = 30


def localuri():
    for nume in sorted(os.listdir(RADACINA)):
        cfg = os.path.join(RADACINA, nume, 'config.js')
        if not os.path.isfile(cfg):
            continue
        text = open(cfg, encoding='utf-8').read()
        url = re.search(r"SUPABASE_URL:\s*'(https://[a-z0-9]+\.supabase\.co)'", text)
        cheie = re.search(r"SUPABASE_KEY:\s*'([^']+)'", text)
        if not url or not cheie or 'INLOCUIESTE' in cheie.group(1):
            continue
        yield nume, url.group(1), cheie.group(1)


def cerere(url, apikey, body=None):
    date = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=date, method='POST' if date else 'GET', headers={
        'apikey': apikey, 'Authorization': 'Bearer ' + apikey,
        'Content-Type': 'application/json', 'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode() or 'null')


def main():
    cheie_backup = os.environ.get('CHEIE_BACKUP', '').strip()
    azi = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    esecuri = 0
    for nume, url, apikey in localuri():
        # 1. tinut treaz
        try:
            cerere(url + '/rest/v1/meniu_produse?select=id_produs&limit=1', apikey)
            print(f'[{nume}] proiectul raspunde OK')
        except Exception as e:
            esecuri += 1
            print(f'[{nume}] NU raspunde: {e}')
            continue
        # 2. copia de siguranta
        if not cheie_backup:
            print(f'[{nume}] fara CHEIE_BACKUP: doar tinut treaz (adauga secretul in GitHub ca sa ai si copii)')
            continue
        try:
            date = cerere(url + '/rest/v1/rpc/export_backup', apikey, {'p_cheie': cheie_backup})
        except urllib.error.HTTPError as e:
            esecuri += 1
            corp = e.read().decode()[:200]
            if 'Cheie invalida' in corp:
                print(f'[{nume}] cheia CHEIE_BACKUP din GitHub nu e aceeasi cu secretul `cheie_backup` din Vault-ul proiectului')
            else:
                print(f'[{nume}] copia a esuat ({e.code}): {corp}')
            continue
        except Exception as e:
            esecuri += 1
            print(f'[{nume}] copia a esuat: {e}')
            continue
        folder = os.path.join(RADACINA, 'backup', nume)
        os.makedirs(folder, exist_ok=True)
        cale = os.path.join(folder, azi + '.json')
        with open(cale, 'w', encoding='utf-8') as f:
            json.dump(date, f, ensure_ascii=False, indent=1, sort_keys=True)
        with open(os.path.join(folder, 'ultimul.json'), 'w', encoding='utf-8') as f:
            json.dump(date, f, ensure_ascii=False, indent=1, sort_keys=True)
        n = len(date.get('meniu') or [])
        print(f'[{nume}] copie salvata: {n} produse -> backup/{nume}/{azi}.json')
        # pastram ultimele 30 de zile (istoricul mai vechi ramane in git)
        zile = sorted(x for x in os.listdir(folder) if re.fullmatch(r'\d{4}-\d{2}-\d{2}\.json', x))
        for vechi in zile[:-PASTREAZA_ZILE]:
            os.remove(os.path.join(folder, vechi))
    if esecuri:
        print(f'{esecuri} problema(e). GitHub trimite email cand rularea esueaza.')
        sys.exit(1)


if __name__ == '__main__':
    main()
