# Calendrier Villecroze

Application web statique pour organiser les disponibilites de familles sur un calendrier commun (mai -> septembre 2026).

## Fonctionnalites

- Selection d'une famille puis des profils participants.
- Bulles de profils animees (collision, rebond, interaction souris).
- Calendrier avec cycle en 3 etats par clic pour les profils selectionnes:
  - present
  - peut-etre (trait noir sur le disque)
  - efface
- Gestion d'un nombre commun d'invites `+N`.
- Mode invite (lecture seule anonymisee).
- Mode consultation calendrier (lecture seule avec details).

## Structure du projet

- `index.html` - structure de la page.
- `styles.css` - styles UI.
- `app.js` - logique metier (selection, calendrier, stockage local, animations).
- `content/` - contenu editable en JSON:
  - `page-landing.json`
  - `page-profiles.json`
  - `page-calendar.json`
  - `families.json`
- `icons/` - assets SVG.

## Lancer en local

Ne pas ouvrir en `file://` (les JSON sont charges via `fetch`).

```bash
cd Villecroze
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080/`.

## Deploiement GitHub Pages

Le projet contient deja:

- `.github/workflows/deploy-pages.yml` (deploiement automatique via GitHub Actions)
- `.nojekyll`

### Etapes

1. Pousser le projet sur GitHub.
2. Ouvrir `Settings -> Pages`.
3. Dans **Build and deployment**, choisir **Source: GitHub Actions**.
4. Push sur `main` (ou `master`) pour declencher le workflow.

Le site sera disponible sur une URL du type:
`https://<compte>.github.io/<repo>/`

## Persistance partagee (GitHub + Vercel)

Le projet supporte maintenant 2 couches:

- `localStorage` (fallback local, toujours actif)
- API partagee Vercel: `api/bookings` (source commune entre visiteurs)

### Comment ca fonctionne

- Sur `*.vercel.app`, le front appelle automatiquement `./api/bookings`.
- Sur `*.github.io`, le front appelle automatiquement:
  `https://villecroze-github-io.vercel.app/api/bookings`
- Vous pouvez forcer un endpoint avec:
  `window.VILLECROZE_BOOKINGS_API = "https://.../api/bookings"` avant chargement.

### Configuration Vercel KV (obligatoire pour stockage partage)

1. Dans Vercel, activer **Storage -> KV** pour le projet.
2. Verifier que les variables d'environnement KV sont presentes (Vercel les injecte):
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. (Optionnel) definir `BOOKINGS_KV_KEY` pour personnaliser la cle (sinon `villecroze:bookings:v1`).

Sans KV configure, l'API retournera une erreur et l'app restera sur `localStorage` local.

## Personnalisation rapide

- Textes UI: modifier les fichiers dans `content/`.
- Familles/profils: `content/families.json`.
- Couleurs des profils: `app.js` dans `memberNameColor(...)` et palettes associees.

