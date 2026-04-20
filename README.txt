Contenu éditable (Villecroze)
=============================

Quatre fichiers JSON, chargés au démarrage par app.js :

  page-landing.json   — Titre du document, en-tête (héros), texte d’accessibilité
                        de l’écran familles, tuile « Invité », libellé des cartes
                        famille (« … profils »).

  families.json       — Liste des familles : id (ne pas modifier sans adapter le
                        code), noms affichés, membres (id, prénom, initiales).

  page-profiles.json  — Textes de l’écran « choix des profils » : retour, bouton
                        toute la famille, invités, pied de page, bouton calendrier.

  page-calendar.json  — Calendrier : titres, légende, jours de la semaine, noms
                        des mois, infobulles (dayTips), messages vue invité,
                        contexte sous le titre, etc.

Serveur local
-------------

Les fichiers sont chargés avec fetch() depuis le même dossier que index.html.
Ouvrir index.html en file:// peut échouer : utilisez par exemple :

  cd …/Villecroze && python3 -m http.server 8080

puis http://localhost:8080/

En cas d’échec du chargement, app.js utilise une copie intégrée (SITE_DEFAULT_*)
pour que l’application reste utilisable.

Synchronisation avec app.js
----------------------------

Si vous modifiez fortement la structure des JSON, mettez à jour les constantes
SITE_DEFAULT_* en tête de app.js pour garder le même schéma (secours file://).

GitHub Pages (dépôt GitHub)
---------------------------

  • Le workflow .github/workflows/deploy-pages.yml envoie la racine du dépôt
    sur GitHub Pages à chaque push sur la branche « main » (réglage Pages :
    source = « GitHub Actions »).

  • Les chemins content/… et icons/… sont résolus avec l’URL de la page
    (document.baseURI), ce qui fonctionne aussi si le site est servi sous un
    sous-chemin (ex. https://votre-compte.github.io/nom-du-repo/).

Réservations du calendrier et GitHub
--------------------------------------

  Les clics sur le calendrier sont enregistrés dans le navigateur (localStorage),
  pas dans les fichiers du dépôt. Un site 100 % statique ne peut pas écrire
  dans le repo de façon sûre sans serveur (il faudrait un secret côté serveur).

  Pour partager les mêmes réservations entre tout le monde : héberger une petite
  API (Vercel, Cloudflare Worker, etc.) ou une base (Supabase, Firebase), puis
  adapter app.js pour lire/écrire là au lieu de localStorage.

  Pour versionner des données à la main : exporter / copier le JSON des
  réservations depuis la console (ou un futur bouton « export ») et le
  committer — ce n’est pas synchronisé automatiquement avec chaque clic.
