-- ============================================================================
-- Sweet & Sour — notificari Web Push (optional, ruleaza DUPA 01_schema.sql)
--
-- Precondiții:
--   1. Ai facut deploy la Edge Function-ul `notifica-comanda`
--      (supabase/functions/notifica-comanda/index.ts).
--   2. Ai pus in Edge Functions -> Secrets: VAPID_PUBLIC_KEY,
--      VAPID_PRIVATE_KEY, VAPID_SUBJECT.
--   3. Ai pus in Vault un secret numit `service_role_key`, cu valoarea
--      cheii service_role a proiectului.
--
-- Cheia service_role NU se pune niciodata in codul frontend si nu se salveaza
-- in fisierele din acest proiect. Sta doar in Vault.
-- ============================================================================

-- Ref-ul proiectului Sweet & Sour este deja completat mai jos.
create or replace function public.trimite_notificare_comanda()
returns trigger language plpgsql security definer
set search_path = 'public','extensions','pg_temp' as $$
declare
  v_key text;
  v_url text := 'https://cjavzdnsebbkiiefigvi.supabase.co/functions/v1/notifica-comanda';
begin
  if NEW.status is distinct from 'noua' then return NEW; end if;

  begin
    select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  exception when others then
    v_key := null;
  end;

  if v_key is null then
    raise log 'notifica-comanda: lipseste secretul service_role_key din Vault';
    return NEW;
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_key),
    body    := jsonb_build_object('record', to_jsonb(NEW)),
    timeout_milliseconds := 4000
  );
  return NEW;
exception when others then
  -- o notificare esuata nu trebuie sa impiedice intrarea comenzii
  raise log 'notifica-comanda a esuat: %', sqlerrm;
  return NEW;
end; $$;

drop trigger if exists trg_notifica_comanda on public.comenzi;
create trigger trg_notifica_comanda after insert on public.comenzi
  for each row execute function public.trimite_notificare_comanda();
