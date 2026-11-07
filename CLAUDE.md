# CalorieTracker — kontext projektu

Osobní PWA aplikace na zapisování kalorií a maker (ve stylu iOS). Používá ji **jen autor** (jeden uživatel, registrace na invite kód), hlavně jako PWA na iPhonu přidanou na plochu. UI, komentáře v kódu i komunikace jsou **česky**.

- Produkce: https://calorie-tracker-jirotkins.duckdns.org (Swagger: `/api/docs`)
- Repo: GitHub `Jirotkins/CalorieTracker`, větev `main`

## Stack

**Backend** (kořen repa): Python 3.14, FastAPI, SQLAlchemy 2 (`Mapped`), Pydantic 2, Alembic, SQLite, JWT (python-jose) + bcrypt (passlib), Pillow (zmenšování fotek), Open Food Facts API (čárové kódy).
- `models/` → `schemas/` → `crud/` → `api/endpoints/` (+ `services/openfoodfacts.py`, `core/` config/db/security)
- Routery: `/users`, `/login`, `/foods`, `/logs`, `/recipes`, `/upload`

**Frontend** (`frontend/`): React 19 + TypeScript, Vite, Tailwind CSS v4 (barevné tokeny v `src/index.css`, tmavý režim přes třídu `.dark`), React Router 7, Axios (`src/services/api.ts`), lucide-react ikony, vite-plugin-pwa (workbox), `barcode-detector` (zxing-cpp WASM) pro skener.
- `pages/` (Dashboard, Foods, Stats, Settings, AddFood = nové i úprava jídla, FoodDetail, RecipeForm, RecipeDetail, BarcodeScanner, Login)
- `components/ui/` (sheety, karty, graf, skeletony, toasty…), `hooks/`, `types/`, `utils/`

**Infrastruktura**: Docker. Produkce na Oracle Cloud serveru: `docker-compose.prod.yml` = Caddy (HTTPS, caddy-docker-proxy) → frontend kontejner (nginx se SPA + proxy `/api/` a `/static/` na backend) → backend (uvicorn). DB a fotky jsou volumes `./data` a `./static`.

## Hotové funkce
- Přihlášení (JWT), registrace jen s `invite_code` (= `REGISTRATION_TOKEN`)
- Dashboard: výběr dne, kolečko kalorií, makra, 5 jídel dne (snídaně…večeře), přidání/úprava/přesun/smazání záznamu
- Logování v **gramech nebo porcích** (kus, balení, talíř… s počtem po 0,5), quick-pick nejčastějších jídel
- Katalog jídel (globální + vlastní), přidání ručně / skenerem (OFF), úprava jídla, porce, fotky
- **Recepty**: ingredience, váha po uvaření, porce, živý přepočet, logování receptu
- **Statistiky**: týden/měsíc, sloupcový graf kalorií s čárou cíle (vlastní SVG), průměry maker, proklik na den
- Denní cíle v Nastavení, tmavý režim, verze buildu v Nastavení
- PWA: vlastní tmavá ikona, iOS meta tagy, automatická aktualizace (i při návratu z pozadí), offline čtení (workbox NetworkFirst pro `GET /api/*`, CacheFirst pro fotky), skeletony, toasty místo `alert()`

## Důležitá rozhodnutí a záludnosti (nerozbít!)
- **`root_path="/api"`** v `main.py` (kvůli Swaggeru za proxy). Důsledek: StaticFiles servíruje fotky jen pod `/api/static/...` → nginx (`frontend/nginx.conf`) i Vite proxy přepisují `/static/` → `/api/static/`. URL fotek v DB zůstávají `/static/photos/...`.
- **Pořadí rout ve FastAPI**: statické cesty (`/foods/frequent`, `/foods/barcode/{…}`, `/logs/date/{…}`, `/logs/stats`) musí být **před** `/{id}`, jinak 422.
- **Datum**: frontend posílá `date_consumed` jako `YYYY-MM-DD` vybraného dne z `toLocalDateString()` (`utils/date.ts`) — **nikdy `toISOString()`** (UTC posun dne). Souhrn i statistiky seskupují podle data (`func.date`).
- **Gramy jsou zdroj pravdy**: `meal_log.amount_grams` má přednost, `portion_id`/`recipe_portion_id` je jen popisek („1,5× kus“). Úprava/smazání porce tak nemění historii. Migrace `3c7e1b9a4d52` doplnila gramy starým záznamům.
- **Recept**: makra se ukládají jako snapshot na 100 g (přepočet při změně ingrediencí / `final_weight_grams`) — `crud/recipe.py::_recalculate_macros`. Porce jídla i receptu synchronizuje `crud/portion.py::sync_portions` (s `id` = úprava, bez = nová, chybějící = smazat + odpojit z logů).
- Souhrn dne i statistiky používají sdílené helpery v `api/endpoints/meal_log.py` (`_resolve_log`, `_nutrients_for`, `_user_goals`) — stejná čísla všude.
- **Migrace** běží automaticky při startu produkčního kontejneru (`alembic upgrade head` v `Dockerfile.prod`). Nová změna schématu = nová revize v `alembic/versions/`.
- **Fotky**: frontend je zmenší v telefonu (`utils/image.ts`, max 1600 px, JPEG — řeší i HEIC), server na 800 px. nginx `client_max_body_size 12m` (default 1 MB dělal 413). Sdílená logika: `hooks/usePhotoUpload.ts` + `components/ui/PhotoPicker.tsx` (úklid nepoužitých fotek, stará fotka se maže až po uložení).
- **Sheety** jsou pořád připojené a jen odsunuté pod obrazovku → mají `inert={!isOpen}` a **žádný `autoFocus`** (jinak iOS po návratu do appky otevře klávesnici).
- **Motiv**: inline skript v `index.html` nastaví `.dark` a `theme-color` před vykreslením; `useTheme` drží stejné barvy (při změně upravit obojí). Status bar = `default` + `theme-color` (ne `black-translucent`).
- **PWA ikona** je záměrně tmavá (iOS tónovaný vzhled PWA ikonu jen převede do šedi). Po změně ikony je nutné appku na iPhonu znovu přidat na plochu.
- Formulářové sekce porcí: `components/ui/PortionsEditor.tsx` + helpery v `utils/portions.ts`.
- Vyhledávací sheet (`SearchFoodSheet`) má i režim výběru ingredience (`onSelectFood`) a ve výsledcích ukazuje i recepty.

## Známé dluhy (zatím vědomě neřešené)
- **Žádná kontrola vlastníka** u PUT/DELETE jídel, záznamů a receptů; `GET /logs/{user_id}` vrací cizí deníček (jeden uživatel → nízká priorita).
- `SECRET_KEY` a `REGISTRATION_TOKEN` mají v `core/config.py` / `api/endpoints/user.py` výchozí hodnoty, pokud chybí v `.env`.
- Každý endpoint soubor má vlastní kopii `get_db` (sjednotit na `core/database.py`); `datetime.utcnow` je deprecated.
- Smazané jídlo (soft delete) si nechává fotku na disku; fotky z OFF jsou jen externí odkazy.
- U zalogovaného záznamu nejde změnit datum (jen gramy, porce a jídlo dne).
- Žádné automatické testy; smíšené konce řádků (CRLF/LF, `core.autocrlf=true`).

## Jak se pracuje (preference autora)
- Práce **po malých krocích**: každý krok = jeden commit, který jde samostatně otestovat. Po kroku se zastavit a počkat na test.
- U každého kroku navrhnout **commit zprávu**: Conventional Commits, anglicky, malými písmeny, jeden řádek (`feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:`, `test:`).
- **Commituje a deployuje autor sám.** Na konci kroku uvést, jak testovat (ideálně na iPhonu v PWA) a co nasadit.
- Kód: komentáře česky, stejný styl jako okolní kód (Tailwind utility třídy, iOS-like karty `rounded-3xl`, sekce s popiskem `text-xs uppercase`).

## Ověřování změn
- Frontend: `cd frontend && npx tsc -b && npx oxlint src && npx vite build`
- Backend: v `venv/` chybí Pillow, takže `main.py` nejde importovat. Logiku ověřovat skriptem s in-memory SQLite (`Base.metadata.create_all`) a přímým voláním funkcí z `crud/` a `api/endpoints/…` (bez `upload`). Migrace: `DATABASE_URL=sqlite:///<tmp>.db venv/Scripts/python.exe -m alembic upgrade head`.
- Vývoj lokálně: `docker compose up` (Vite s HTTPS na `:5173`, funguje i z telefonu v LAN).
- Windows/Git Bash: dlouhé heredocy s Pythonem občas spadnou na parsování → úpravy dělat přes Edit/Write nebo skript v souboru.

## Nasazení
```bash
# na serveru (projekt je v ~/app, git bez sudo)
cd ~/app
git pull
docker compose -f docker-compose.prod.yml up -d --build            # nebo jen frontend / backend
docker compose -f docker-compose.prod.yml logs backend --tail 30    # kontrola migrací
```
Po deployi frontendu se PWA aktualizuje sama; verze (čas buildu) je vidět dole v Nastavení. `oracle.key`, `.env`, `*.db` jsou v `.gitignore` — nikdy je necommitovat.

---
