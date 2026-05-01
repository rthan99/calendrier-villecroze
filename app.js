(function () {
  "use strict";

  const YEAR = 2026;

  /** Live Server / « Go Live » (127.0.0.1, localhost) : clé dédiée pour ne pas réutiliser les réservations d’un autre mode d’ouverture (ex. fichier). */
  function calendarStorageKey() {
    try {
      const h = String(window.location.hostname || "");
      if (h === "127.0.0.1" || h === "localhost") {
        return "villecroze.shared-calendar.v5.live";
      }
    } catch (_) {
      /* ignore */
    }
    return "villecroze.shared-calendar.v5";
  }

  const STORAGE_KEY = calendarStorageKey();
  const OLD_CALENDAR_KEYS = [
    "villecroze.shared-calendar.v1",
    "villecroze.shared-calendar.v2",
    "villecroze.shared-calendar.v3",
    "villecroze.shared-calendar.v4",
  ];

  /**
   * Endpoint API partagé (Vercel) pour synchroniser les réservations.
   * Priorité:
   *  1) window.VILLECROZE_BOOKINGS_API (override manuel)
   *  2) même origine si site sur vercel.app
   *  3) endpoint Vercel public depuis GitHub Pages
   *  4) null => localStorage uniquement
   */
  function bookingsApiUrl() {
    try {
      const manual = window.VILLECROZE_BOOKINGS_API;
      if (typeof manual === "string" && manual.trim()) return manual.trim();
      const host = String(window.location.hostname || "").toLowerCase();
      if (host.endsWith(".vercel.app")) return assetUrl("api/bookings");
      if (host.endsWith(".github.io"))
        return "https://villecroze-github-io.vercel.app/api/bookings";
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  const BOOKINGS_API_URL = bookingsApiUrl();

  /**
   * Résout une URL relative à celle de la page (ex. GitHub Pages : https://user.github.io/nom-du-repo/).
   * @param {string} path ex. "content/families.json" ou "icons/…"
   */
  function assetUrl(path) {
    const rel = String(path).replace(/^\//, "");
    try {
      return new URL(rel, document.baseURI).href;
    } catch (_) {
      return rel;
    }
  }

  const SITE_DEFAULT_PAGE_LANDING = {
    documentTitle: "Calendrier Villecroze — Qui Vient ?",
    hero: {
      title: "Calendrier Villecroze",
      tagline: "Qui Vient ?",
    },
    familyStep: {
      srHeading: "Choisir une famille ou l’invité",
    },
    gateIntro: {
      line1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      line2:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    guestTile: {
      title: "Accès invité",
      meta: "",
    },
    calendarBrowseButton: "Accéder au calendrier",
  };

  const SITE_DEFAULT_FAMILIES = [
    {
      id: "fam-hetreau-ronget",
      name: "Hetreau-Ronget",
      members: [
        { id: "hro-thierry", name: "Thierry", initials: "TH" },
        { id: "hro-quentin", name: "Quentin", initials: "QU" },
        { id: "hro-mathilde", name: "Mathilde", initials: "MH" },
        { id: "hro-baptiste", name: "Baptiste", initials: "BA" },
        { id: "hro-pauline", name: "Pauline", initials: "PA" },
        { id: "hro-helene", name: "Hélène", initials: "HÉ" },
      ],
    },
    {
      id: "fam-hetreau-muller",
      name: "Hetreau-Muller",
      members: [
        { id: "hmu-gilles", name: "Gilles", initials: "GI" },
        { id: "hmu-ute", name: "Ute", initials: "UT" },
        { id: "hmu-carla", name: "Carla", initials: "CA" },
        { id: "hmu-kim", name: "Kim", initials: "KI" },
      ],
    },
    {
      id: "fam-hetreau-pottier",
      name: "Hetreau-Pottier",
      members: [
        { id: "hpo-christophe", name: "Christophe", initials: "CH" },
        { id: "hpo-aline", name: "Aline", initials: "AL" },
        { id: "hpo-thomas", name: "Thomas", initials: "TH" },
        { id: "hpo-nathan", name: "Nathan", initials: "NA" },
      ],
    },
  ];
  const CUSTOM_INVITE_FAMILY_ID = "fam-invite-custom";

  const SITE_DEFAULT_PAGE_PROFILES = {
    srHeading: "Choisir les profils de la famille",
    stepTitle: "Avec qui venez-vous à Villecroze ?",
    stepLead:
      "Sélectionnez les personnes avec qui vous venez et rajoutez des +1 en bas si vous avez des invités.",
    backToFamilies: "← Familles",
    selectWholeFamily: "Sélectionner toute la famille",
    inviteLabel: "Invités (avec les profils surlignés)",
    guestMinusAria: "Moins d’invités",
    guestPlusAria: "Plus d’invités",
    footnote:
      "Un seul nombre d’invités pour tout le groupe sélectionné ; il s’applique à chaque profil au calendrier.",
    continueCalendar: "Ouvrir le calendrier",
  };

  const SITE_DEFAULT_PAGE_CALENDAR = {
    defaultCalHint:
      "Tous les profils cochés à l’étape précédente : chaque clic sur un jour les fait tous avancer d’un cran (présent → peut-être avec trait noir → effacé). La barre de pastilles sert surtout à l’aide au survol (profil surligné). Le « +N » invités est réglé à l’étape profils.",
    guestCalHint:
      "Vue invité : seuls les jours réservés ressortent. Aucun nom ni détail sur qui a réservé. Lecture seule.",
    guestCalContext:
      "Vue invité : seuls les jours déjà réservés sont mis en évidence. Aucun nom ni famille n’est affiché.",
    browseCalHint:
      "Consultation du calendrier : vous voyez les inscriptions avec noms et couleurs. Aucun clic ne modifie les dates.",
    browseCalContext:
      "Mode lecture seule : survolez un jour pour le détail. Pour réserver, choisissez une famille puis vos profils.",
    calHeading: "Disponibilités",
    switchQuitGuest: "Quitter la vue invité",
    switchQuitBrowse: "Quitter la consultation",
    switchChangeProfiles: "Changer de profils",
    sessionGuestViewLabel: "Vue invité · anonyme",
    sessionBrowseViewLabel: "Consultation du calendrier · lecture seule",
    sessionJoinWord: " et ",
    sessionNamesThreeTemplate: "{{a}}, {{b}} et {{n}} autre{{suffix}}",
    sessionOthersPluralSuffix: "s",
    sessionNameSeparator: " · ",
    calContextMulti:
      "Chaque clic avance d’un cran tous les profils cochés avant le calendrier (présent → peut-être → effacé). Pastille surlignée : {{activeName}} (aide au survol).{{invSuffix}} Survolez un jour pour le détail.",
    calContextSingle:
      "Trois clics sur un jour : présent → peut-être (trait) → effacé.{{invSuffix}} Survolez un jour pour le détail.",
    invSuffixTemplate: " Commun pour la sélection : +{{eg}} par clic.",
    bookerChipsAriaLabel: "Profil pour l’aide au survol",
    legend: {
      free: "Libre",
      mine: "Votre sélection",
      other: "Autres",
      mixed: "Mixte",
    },
    weekDays: ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"],
    monthLabels: {
      5: "mai",
      6: "juin",
      7: "juillet",
      8: "août",
      9: "sept.",
    },
    fallbackMemberName: "Quelqu’un",
    dayTips: {
      guestEmpty: {
        headline: "Vue invité",
        bodyPlain:
          "Ce jour est libre. Les jours sans réservation sont à peine visibles.",
      },
      guestBooked: {
        headline: "Jour réservé",
        bodyPlain:
          "Du monde est inscrit ce jour-là. En vue invité, les noms ne sont pas affichés.",
      },
      browseEmpty: {
        headline: "Jour libre",
        bodyPlain:
          "Consultation seule : vous ne pouvez pas ajouter ni retirer d’inscription depuis cet accès.",
      },
      browseHasEntries: {
        headline: "Prévus pour ce jour",
        footHtml:
          '<p class="day-hover-foot">Consultation seule — impossible de modifier les inscriptions depuis ce mode.</p>',
        footPlain:
          "Consultation seule — impossible de modifier les inscriptions depuis ce mode.",
      },
      signedInEmptyWithActive: {
        headline: "Inscriptions par clic",
        bodyHtml:
          '<p class="day-hover-p">Personne pour l’instant.</p><p class="day-hover-p">Chaque clic avance d’un cran <strong>tous</strong> les profils cochés à l’étape précédente (présent → peut-être → effacé). Invités : {{plusGuestsHtml}} (réglage à l’étape profils). Surlignage pour l’aide : {{activeHtml}}.</p>',
        bodyPlain:
          "Personne pour l’instant. Chaque clic : tous les profils cochés avancent d’un cran (présent → peut-être → effacé). Invités {{plusGuestsPlain}}. Aide au survol : {{activePlain}}.",
      },
      signedInEmptyNoActive: {
        headline: "Inscriptions par clic",
        bodyPlain:
          "Personne pour l’instant. Choisissez une pastille surlignée (barre ci-dessus) pour l’aide au survol, puis cliquez sur le jour : tous les profils cochés avant le calendrier avancent d’un cran.",
      },
      signedInHasEntriesWithActive: {
        headline: "Ont cliqué pour s’inscrire sur ce jour",
        footHtml:
          '<p class="day-hover-foot">Chaque clic avance d’un cran <strong>tous</strong> les profils cochés avant le calendrier. Surlignage pour l’aide au survol : {{activeHtml}}.</p>',
        footPlain:
          "Chaque clic : tous les profils cochés avancent d’un cran. Aide au survol : {{activePlain}}.",
      },
      signedInHasEntriesNoActive: {
        headline: "Ont cliqué pour s’inscrire sur ce jour",
        footHtml:
          '<p class="day-hover-foot">Chaque clic sur le jour avance d’un cran tous les profils sélectionnés à l’étape précédente (présent → peut-être → effacé).</p>',
        footPlain:
          "Chaque clic avance d’un cran tous les profils sélectionnés (présent → peut-être → effacé).",
      },
    },
    dayAriaGuestReserved:
      "Jour réservé. En vue invité, les personnes qui ont cliqué pour réserver ne sont pas indiquées.",
    dayAriaGuestFree: "Jour libre, affichage discret en vue invité.",
    dayNativeGuestReserved:
      "Réservé — vue invité : qui a réservé n’est pas affiché",
    dayNativeListPrefix: "Inscrit·e·s : ",
    maybeLabel: "Peut-être :",
    maybeShort: "peut-être",
  };

  const MONTH_LAYOUT = [
    { month: 5, mode: "peek" },
    { month: 6, mode: "peek" },
    { month: 7, mode: "hero" },
    { month: 8, mode: "hero" },
    { month: 9, mode: "faint" },
  ];

  /** Données familles (éditer surtout content/families.json). */
  let families = [];

  function ensureCustomInviteFamily() {
    const existing = families.find((f) => f.id === CUSTOM_INVITE_FAMILY_ID);
    if (existing) return existing;
    const inviteFamily = {
      id: CUSTOM_INVITE_FAMILY_ID,
      name: "Invité",
      members: [],
    };
    families.push(inviteFamily);
    return inviteFamily;
  }

  function inviteInitialsFromName(name) {
    const parts = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "IN";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  function encodeInviteNameForMemberId(name) {
    return encodeURIComponent(String(name || "").trim());
  }

  function decodeInviteNameFromMemberId(memberId) {
    const raw = String(memberId || "");
    if (!raw.startsWith("invite:")) return "";
    const parts = raw.split(":");
    if (parts.length < 3) return "";
    try {
      return decodeURIComponent(parts[1] || "").trim();
    } catch (_) {
      return "";
    }
  }

  function addInviteMember(nameRaw) {
    const inviteFamily = ensureCustomInviteFamily();
    const name = String(nameRaw || "").trim();
    if (!name) return false;
    const encName = encodeInviteNameForMemberId(name);
    const memberId = `invite:${encName}:${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    inviteFamily.members.push({
      id: memberId,
      name,
      initials: inviteInitialsFromName(name),
    });
    profileMemberIds = [...new Set([...profileMemberIds, memberId])];
    return true;
  }

  function hydrateInviteFamilyMembersFromBookings(rawBookings) {
    const inviteFamily = ensureCustomInviteFamily();
    const existing = new Map(
      (inviteFamily.members || []).map((m) => [m.id, m])
    );
    const bookingsObj =
      rawBookings && typeof rawBookings === "object" ? rawBookings : {};
    for (const entries of Object.values(bookingsObj)) {
      if (!Array.isArray(entries)) continue;
      for (const e of entries) {
        if (!e || e.familyId !== CUSTOM_INVITE_FAMILY_ID) continue;
        if (typeof e.memberId !== "string" || existing.has(e.memberId)) continue;
        const decodedName = decodeInviteNameFromMemberId(e.memberId).trim();
        if (!decodedName) continue;
        existing.set(e.memberId, {
          id: e.memberId,
          name: decodedName,
          initials: inviteInitialsFromName(decodedName),
        });
      }
    }
    inviteFamily.members = Array.from(existing.values());
  }

  /** Textes UI chargés depuis content/page-*.json */
  let siteText = /** @type {{ landing: any; profile: any; calendar: any } | null} */ (
    null
  );

  function tpl(str, vars) {
    if (!str) return "";
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ""
    );
  }

  async function loadSiteContent() {
    const paths = [
      "content/page-landing.json",
      "content/families.json",
      "content/page-profiles.json",
      "content/page-calendar.json",
    ];
    try {
      const out = await Promise.all(
        paths.map((url) =>
          fetch(assetUrl(url), { cache: "no-store" }).then((r) => {
            if (!r.ok) throw new Error(url + " " + r.status);
            return r.json();
          })
        )
      );
      siteText = {
        landing: out[0],
        profile: out[2],
        calendar: out[3],
      };
      families = Array.isArray(out[1]) ? out[1] : [];
      ensureCustomInviteFamily();
    } catch (err) {
      console.warn(
        "[Villecroze] Chargement des JSON impossible (file:// ou erreur réseau) — contenu intégré utilisé.",
        err
      );
      siteText = {
        landing: SITE_DEFAULT_PAGE_LANDING,
        profile: SITE_DEFAULT_PAGE_PROFILES,
        calendar: SITE_DEFAULT_PAGE_CALENDAR,
      };
      families = [...SITE_DEFAULT_FAMILIES];
      ensureCustomInviteFamily();
    }
  }

  function applyStaticContentToDom() {
    if (!siteText) return;
    const L = siteText.landing;
    const P = siteText.profile;
    const C = siteText.calendar;
    document.title = L.documentTitle;
    const heroTitle = document.getElementById("heroTitle");
    const heroTagline = document.getElementById("heroTagline");
    if (heroTitle) heroTitle.textContent = L.hero.title;
    if (heroTagline) heroTagline.textContent = L.hero.tagline;
    const fh = document.getElementById("familyHeading");
    if (fh) fh.textContent = L.familyStep.srHeading;
    const gi1 = document.getElementById("familyGateIntroLine1");
    const gi2 = document.getElementById("familyGateIntroLine2");
    const gIntro = L.gateIntro;
    if (gi1 && gIntro && typeof gIntro.line1 === "string") gi1.textContent = gIntro.line1;
    if (gi2 && gIntro && typeof gIntro.line2 === "string") gi2.textContent = gIntro.line2;
    const ph = document.getElementById("profileHeading");
    if (ph)
      ph.textContent =
        typeof P.stepTitle === "string" && P.stepTitle.trim()
          ? P.stepTitle
          : P.srHeading;
    const pLead = document.getElementById("profileStepLead");
    if (pLead)
      pLead.textContent =
        typeof P.stepLead === "string" ? P.stepLead : "";
    const back = document.getElementById("backToFamilies");
    if (back) back.textContent = P.backToFamilies;
    const whole = document.getElementById("selectWholeFamilyBtn");
    if (whole) whole.textContent = P.selectWholeFamily;
    const pil = document.getElementById("profileInviteLabel");
    if (pil) pil.textContent = P.inviteLabel;
    const gMinus = document.getElementById("guestGlobalMinus");
    if (gMinus) gMinus.setAttribute("aria-label", P.guestMinusAria);
    const gPlus = document.getElementById("guestGlobalPlus");
    if (gPlus) gPlus.setAttribute("aria-label", P.guestPlusAria);
    const pfn = document.getElementById("profileFootnote");
    if (pfn) pfn.textContent = P.footnote;
    const cont = document.getElementById("profileContinueBtn");
    if (cont) cont.textContent = P.continueCalendar;
    const ch = document.getElementById("calHeading");
    if (ch) ch.textContent = C.calHeading;
    const chips = document.getElementById("bookerChips");
    if (chips) chips.setAttribute("aria-label", C.bookerChipsAriaLabel);
    const hint = document.getElementById("calHint");
    if (hint) hint.textContent = C.defaultCalHint;
    document.querySelectorAll("[data-legend]").forEach((el) => {
      const k = el.getAttribute("data-legend");
      const lab = k && C.legend[k];
      const span = el.querySelector(".legend-text");
      if (lab && span) span.textContent = lab;
    });
  }

  /**
   * Ronget : palette [Color Hunt](https://colorhunt.co/palette/ebf4dd90ab8b5a78633b4953)
   * (#3b4953 → #5a7863 → #90ab8b → #ebf4dd) + deux tons intermédiaires pour 6 profils.
   */
  const RONGET_PALETTE = [
    "#3b4953",
    "#4b615b",
    "#5a7863",
    "#759177",
    "#90ab8b",
    "#ebf4dd",
  ];

  /** Muller : palette [Color Hunt](https://colorhunt.co/palette/281c594e8d9c85c79aedf7bd) (fort → doux). */
  const MULLER_PALETTE = [
    "#281c59",
    "#4e8d9c",
    "#85c79a",
    "#edf7bd",
  ];

  /** Pottier : palette [Color Hunt](https://colorhunt.co/palette/ffedceffc193ff8383ff3737) (fort → doux, comme Ronget/Muller). */
  const POTTIER_PALETTE = [
    "#ff3737",
    "#ff8383",
    "#ffc193",
    "#ffedce",
  ];

  /**
   * @param {string} hex #rrggbb
   * @returns {number | null}
   */
  function relativeLuminanceFromHex(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  /**
   * @param {HTMLElement} btn
   * @param {string} pickHex
   */
  function setMemberPickContrastVars(btn, pickHex) {
    const L = relativeLuminanceFromHex(pickHex);
    if (L == null || L <= 0.62) {
      btn.style.removeProperty("--pick-face-fg");
      btn.style.removeProperty("--pick-name-fg");
      return;
    }
    btn.style.setProperty("--pick-face-fg", "#1f1a18");
    btn.style.setProperty("--pick-name-fg", "#4a2c2a");
  }

  /**
   * @param {string[]} palette
   * @param {number} idx
   * @param {number} n
   */
  function paletteMemberHex(palette, idx, n) {
    const p = palette;
    if (!p.length) return "#555555";
    if (n <= 1) return p[0];
    if (n <= p.length) return p[Math.min(idx, n - 1)];
    const t = idx / (n - 1);
    return p[Math.round(t * (p.length - 1))];
  }

  /** @param {number} deg 0–360 */
  function wrapHue(deg) {
    let h = deg % 360;
    if (h < 0) h += 360;
    return h;
  }

  /** Accueil familles : SVG Illustrator (fonds noirs → masque CSS + couleur famille). */
  const FAMILY_GATE_ASSET_SVG = {
    "fam-hetreau-ronget": "icons/Asset 1familles.svg",
    "fam-hetreau-muller": "icons/Asset 2familles.svg",
    "fam-hetreau-pottier": "icons/Asset 3familles.svg",
  };

  /** Accueil invité : picto champignon inline. */
  const FAMILY_GATE_MUSHROOM_INNER = {
    guest: `<path d="M5 12.5c0-4 3.3-7 7-7s7 3 7 7"/><path d="M10 12.5V20h4v-7.5"/><path d="M7 7l10 10" stroke-dasharray="1.8 1.2"/>`,
  };

  function carlaMushroomSvgUrl() {
    return assetUrl("icons/noun-mushrooms-4644483.svg");
  }

  function invitePineconePngUrl() {
    return assetUrl("icons/noun-pinecone-8023365.png");
  }

  function makeInvitePineconeImgEl(cls) {
    const img = document.createElement("img");
    img.className = cls;
    img.src = invitePineconePngUrl();
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.loading = "lazy";
    return img;
  }

  function memberHue(familyId, memberId) {
    const fam = families.find((f) => f.id === familyId);
    const rawIdx = fam?.members.findIndex((m) => m.id === memberId);
    const idx = rawIdx >= 0 ? rawIdx : 0;
    return Math.round(wrapHue(170 + idx * 22));
  }

  function memberNameColor(familyId, memberId) {
    const fam = families.find((f) => f.id === familyId);
    const n = Math.max(1, fam?.members.length ?? 1);
    const rawIdx = fam?.members.findIndex((m) => m.id === memberId);
    const idx = rawIdx >= 0 ? rawIdx : 0;

    if (familyId === "fam-hetreau-ronget") {
      if (memberId === "hro-helene") return "#B5E18B";
      return paletteMemberHex(RONGET_PALETTE, idx, n);
    }
    if (familyId === "fam-hetreau-muller") {
      if (memberId === "hmu-carla") return "#2563eb";
      if (memberId === "hmu-kim") return "#0ea5e9";
      return paletteMemberHex(MULLER_PALETTE, idx, n);
    }
    if (familyId === "fam-hetreau-pottier") {
      return paletteMemberHex(POTTIER_PALETTE, idx, n);
    }

    const h = memberHue(familyId, memberId);
    return `hsl(${h}, 70%, 27%)`;
  }

  function getMemberDisplayName(familyId, memberId) {
    const fam = families.find((f) => f.id === familyId);
    const m = fam?.members.find((x) => x.id === memberId);
    if (m?.name && String(m.name).trim()) return m.name;
    if (familyId === CUSTOM_INVITE_FAMILY_ID) {
      const decoded = decodeInviteNameFromMemberId(memberId);
      if (decoded) return decoded;
      return "Invité";
    }
    return siteText?.calendar?.fallbackMemberName ?? "Quelqu’un";
  }

  function coloredNameHtml(familyId, memberId) {
    const name = getMemberDisplayName(familyId, memberId);
    const col = memberNameColor(familyId, memberId);
    return `<strong class="day-hover-name" style="color:${col}">${escapeHtml(name)}</strong>`;
  }

  const els = {
    globalBackBtn: document.getElementById("globalBackBtn"),
    stepFamily: document.getElementById("stepFamily"),
    stepProfile: document.getElementById("stepProfile"),
    stepCalendar: document.getElementById("stepCalendar"),
    familyGrid: document.getElementById("familyGrid"),
    profileGrid: document.getElementById("profileGrid"),
    profileFamilyLabel: document.getElementById("profileFamilyLabel"),
    profileContinueBtn: document.getElementById("profileContinueBtn"),
    selectWholeFamilyBtn: document.getElementById("selectWholeFamilyBtn"),
    backToFamilies: document.getElementById("backToFamilies"),
    monthsRoot: document.getElementById("monthsRoot"),
    sessionSlot: document.getElementById("sessionSlot"),
    sessionName: document.getElementById("sessionName"),
    switchProfileBtn: document.getElementById("switchProfileBtn"),
    calContext: document.getElementById("calContext"),
    bookerBar: document.getElementById("bookerBar"),
    bookerChips: document.getElementById("bookerChips"),
    guestGlobalMinus: document.getElementById("guestGlobalMinus"),
    guestGlobalPlus: document.getElementById("guestGlobalPlus"),
    guestGlobalCount: document.getElementById("guestGlobalCount"),
    profileInviteRow: document.getElementById("profileInviteRow"),
    profileFootnote: document.getElementById("profileFootnote"),
    profileStepLead: document.getElementById("profileStepLead"),
    dayHoverTip: document.getElementById("dayHoverTip"),
    dayHoverTipTitle: document.getElementById("dayHoverTipTitle"),
    dayHoverTipBody: document.getElementById("dayHoverTipBody"),
    dayHoverTipFoot: document.getElementById("dayHoverTipFoot"),
    calHint: document.getElementById("calHint"),
    calLegend: document.getElementById("calLegend"),
  };

  /** @typedef {{ familyId: string; memberId: string; guests?: number; status?: "maybe" }} DayEntry */

  /**
   * @type {null | { guestView: true } | { calendarBrowse: true } | { guestView?: false; familyId: string; memberIds: string[]; extraGuests: number; guestCounts?: Record<string, number> }}
   */
  let session = null;
  /** @type {string | null} */
  let selectedFamilyId = null;
  let profileMemberIds = [];
  /** Invités supplémentaires communs à tous les profils surlignés (écran sélection + session). */
  let profileExtraGuests = 0;
  let profileInviteControlsBound = false;
  /**
   * @type {null | {
   *   raf: number;
   *   grid: HTMLElement;
   *   bubbles: { el: HTMLElement; x: number; y: number; vx: number; vy: number; r: number }[];
   *   W: number;
   *   H: number;
   *   lastT: number;
   *   mouse: { x: number; y: number; active: boolean };
   *   onMove: (e: PointerEvent) => void;
   *   onLeave: () => void;
   *   ro: ResizeObserver;
   * }}
   */
  let memberPhysics = null;
  let activeBookerMemberId = null;

  /** @type {Record<string, DayEntry[]>} */
  let bookings = {};
  let remoteWriteInFlight = false;
  let remoteSaveTimer = 0;
  let pendingRemoteBookings = null;
  let currentStep = "family";

  function resetToFamilyStep() {
    selectedFamilyId = null;
    profileMemberIds = [];
    profileExtraGuests = 0;
    session = null;
    activeBookerMemberId = null;
    if (els.calHint) els.calHint.textContent = siteText.calendar.defaultCalHint;
    if (els.calLegend) els.calLegend.hidden = false;
    showStep("family");
  }

  function goBackOneStep() {
    if (currentStep === "calendar") {
      if (session && (isGuestSession() || isCalendarBrowseSession())) {
        resetToFamilyStep();
        return;
      }
      if (selectedFamilyId) {
        const fam = families.find((f) => f.id === selectedFamilyId);
        if (fam) {
          renderProfiles(fam);
          showStep("profile");
          return;
        }
      }
      resetToFamilyStep();
      return;
    }
    if (currentStep === "profile") {
      resetToFamilyStep();
    }
  }

  function ensureInviteNameEditor() {
    let wrap = document.getElementById("inviteNameEditor");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "inviteNameEditor";
      wrap.className = "invite-name-editor";
      wrap.innerHTML =
        '<input id="inviteNameInput" class="invite-name-editor__input" type="text" placeholder="Nom de l’invité" autocomplete="off" />' +
        '<button id="inviteNameAddBtn" class="btn btn-ghost invite-name-editor__btn" type="button">Ajouter</button>';
      els.profileGrid.parentNode.insertBefore(wrap, els.profileGrid);
      const input = wrap.querySelector("#inviteNameInput");
      const addBtn = wrap.querySelector("#inviteNameAddBtn");
      const onAdd = () => {
        if (selectedFamilyId !== CUSTOM_INVITE_FAMILY_ID) return;
        if (!input) return;
        const ok = addInviteMember(input.value);
        if (!ok) return;
        input.value = "";
        const fam = families.find((f) => f.id === CUSTOM_INVITE_FAMILY_ID);
        if (fam) renderProfiles(fam);
      };
      addBtn?.addEventListener("click", onAdd);
      input?.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          onAdd();
        }
      });
    }
    return wrap;
  }
  let remoteLoadInFlight = null;

  function purgeOldCalendarKeys() {
    OLD_CALENDAR_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (_) {
        /* ignore */
      }
    });
  }

  /** Efface toutes les réservations et met à jour l’affichage si besoin. */
  function clearAllBookings() {
    const next = {};
    saveBookings(next);
    if (session) renderCalendar();
  }

  /** Réinitialisation : ouvrir `index.html?reset=calendar` une fois (l’URL est nettoyée ensuite). */
  function maybeResetCalendarFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reset") !== "calendar") return;
      clearAllBookings();
      params.delete("reset");
      const q = params.toString();
      const clean =
        window.location.pathname + (q ? `?${q}` : "") + window.location.hash;
      window.history.replaceState({}, "", clean);
    } catch (_) {
      /* ignore */
    }
  }

  /** @param {unknown} rawBookings */
  function normalizeBookingsObject(rawBookings) {
    if (!rawBookings || typeof rawBookings !== "object") return {};
    /** @type {Record<string, DayEntry[]>} */
    const out = {};
    for (const [key, v] of Object.entries(rawBookings)) {
      if (Array.isArray(v)) {
        out[key] = v
          .filter(
            (e) =>
              e &&
              typeof e.familyId === "string" &&
              typeof e.memberId === "string"
          )
          .map((e) => {
            const g =
              typeof e.guests === "number" && !Number.isNaN(e.guests)
                ? Math.max(0, Math.floor(e.guests))
                : 0;
            const row = {
              familyId: e.familyId,
              memberId: e.memberId,
              guests: g,
            };
            if (e.status === "maybe") row.status = "maybe";
            return row;
          });
        collapseGuestsPerFamilyDayMigrate(out[key]);
      } else if (
        v &&
        typeof v === "object" &&
        "familyId" in v &&
        "memberId" in v
      ) {
        const o = /** @type {{ familyId: string; memberId: string; guests?: number; status?: string }} */ (
          v
        );
        const g =
          typeof o.guests === "number" ? Math.max(0, Math.floor(o.guests)) : 0;
        const row = { familyId: o.familyId, memberId: o.memberId, guests: g };
        if (o.status === "maybe") row.status = "maybe";
        out[key] = [row];
      }
    }
    return out;
  }

  /**
   * Anciennes données : +N dupliqué sur chaque membre → un seul +N (max observé) sur un membre stable.
   * @param {DayEntry[]} entries
   */
  function collapseGuestsPerFamilyDayMigrate(entries) {
    const byFam = new Map();
    for (const e of entries) {
      if (!byFam.has(e.familyId)) byFam.set(e.familyId, []);
      byFam.get(e.familyId).push(e);
    }
    for (const group of byFam.values()) {
      const maxG = Math.max(0, ...group.map((x) => x.guests ?? 0));
      for (const x of group) x.guests = 0;
      if (maxG > 0 && group.length) {
        group.sort((a, b) => a.memberId.localeCompare(b.memberId));
        group[0].guests = maxG;
      }
    }
  }

  /**
   * Invités : un seul montant +N par famille et par jour (porteur = premier profil dans l’ordre session).
   * @param {DayEntry[]} entries
   * @param {string} familyId
   * @param {string[]} memberOrderIds
   * @param {number} guestTotal
   */
  function assignGuestsOncePerFamily(
    entries,
    familyId,
    memberOrderIds,
    guestTotal
  ) {
    const g = Math.max(0, Math.floor(guestTotal));
    const fam = entries.filter((e) => e.familyId === familyId);
    for (const e of fam) e.guests = 0;
    if (g === 0 || fam.length === 0) return;
    const carrierId =
      memberOrderIds.find((id) => fam.some((e) => e.memberId === id)) ??
      fam[0].memberId;
    const carrier = fam.find((e) => e.memberId === carrierId);
    if (carrier) carrier.guests = g;
  }

  function loadLocalBookings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return normalizeBookingsObject(data.bookings || {});
    } catch (_) {
      return {};
    }
  }

  function saveLocalBookings() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 5, bookings })
      );
    } catch (_) {
      /* ignore */
    }
  }

  function clearLocalBookingsCache() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  async function loadRemoteBookings() {
    if (!BOOKINGS_API_URL) return null;
    const res = await fetch(BOOKINGS_API_URL, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`GET bookings ${res.status}`);
    const data = await res.json();
    return normalizeBookingsObject(data?.bookings || {});
  }

  async function loadBookings() {
    const local = loadLocalBookings();
    if (!BOOKINGS_API_URL) return local;
    if (remoteLoadInFlight) return remoteLoadInFlight;
    remoteLoadInFlight = loadRemoteBookings()
      .then((remote) => {
        const next = remote && typeof remote === "object" ? remote : {};
        bookings = next;
        hydrateInviteFamilyMembersFromBookings(next);
        clearLocalBookingsCache();
        return next;
      })
      .catch(() => {
        bookings = {};
        hydrateInviteFamilyMembersFromBookings({});
        clearLocalBookingsCache();
        return {};
      })
      .finally(() => {
        remoteLoadInFlight = null;
      });
    return remoteLoadInFlight;
  }

  function queueRemoteSave(nextBookings) {
    if (!BOOKINGS_API_URL) return;
    pendingRemoteBookings = normalizeBookingsObject(nextBookings || bookings);
    if (remoteSaveTimer) clearTimeout(remoteSaveTimer);
    remoteSaveTimer = window.setTimeout(flushRemoteSave, 2500);
  }

  async function flushRemoteSave() {
    if (!BOOKINGS_API_URL) return;
    if (remoteWriteInFlight) return;
    const payload = pendingRemoteBookings || normalizeBookingsObject(bookings);
    pendingRemoteBookings = null;
    remoteSaveTimer = 0;
    remoteWriteInFlight = true;
    try {
      const postRes = await fetch(BOOKINGS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 5, bookings: payload }),
      });
      if (!postRes.ok) {
        pendingRemoteBookings = payload;
        remoteSaveTimer = window.setTimeout(flushRemoteSave, 4000);
      }
    } catch (_) {
      pendingRemoteBookings = payload;
      remoteSaveTimer = window.setTimeout(flushRemoteSave, 4000);
    } finally {
      remoteWriteInFlight = false;
      if (pendingRemoteBookings && !remoteSaveTimer) {
        remoteSaveTimer = window.setTimeout(flushRemoteSave, 1200);
      }
    }
  }

  function saveBookings(nextBookings = bookings) {
    bookings = normalizeBookingsObject(nextBookings);
    if (!BOOKINGS_API_URL) {
      saveLocalBookings();
      return true;
    }
    clearLocalBookingsCache();
    queueRemoteSave(bookings);
    return true;
  }

  function dateKey(y, m, d) {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  /** @param {string} key */
  function getDayEntries(key) {
    const v = bookings[key];
    if (!v) return [];
    if (Array.isArray(v)) {
      return v.map((e) => {
        const row = {
          familyId: e.familyId,
          memberId: e.memberId,
          guests:
            typeof e.guests === "number"
              ? Math.max(0, Math.floor(e.guests))
              : 0,
        };
        if (e.status === "maybe") row.status = "maybe";
        return row;
      });
    }
    return [];
  }

  /** @param {DayEntry[]} arr */
  function dedupeEntries(arr) {
    const byKey = new Map();
    for (const e of arr) {
      const k = `${e.familyId}:${e.memberId}`;
      const g =
        typeof e.guests === "number" ? Math.max(0, Math.floor(e.guests)) : 0;
      const prev = byKey.get(k);
      if (prev) {
        prev.guests = Math.max(prev.guests ?? 0, g);
        if (e.status === "maybe") prev.status = "maybe";
      } else {
        const row = {
          familyId: e.familyId,
          memberId: e.memberId,
          guests: g,
        };
        if (e.status === "maybe") row.status = "maybe";
        byKey.set(k, row);
      }
    }
    return Array.from(byKey.values());
  }

  /** @param {string} key @param {DayEntry[]} arr */
  function setDayEntries(key, arr) {
    const d = dedupeEntries(arr);
    if (d.length === 0) delete bookings[key];
    else bookings[key] = d;
  }

  function isGuestSession() {
    return !!(session && session.guestView === true);
  }

  function isCalendarBrowseSession() {
    return !!(session && session.calendarBrowse === true);
  }

  /** @param {DayEntry[]} entries */
  function dayClassification(entries) {
    if (!session || !entries.length) {
      return /** @type {const} */ ({ kind: "free" });
    }
    if (session.calendarBrowse === true) {
      return /** @type {const} */ ({ kind: "other" });
    }
    let hasMine = false;
    let hasOther = false;
    for (const e of entries) {
      if (
        e.familyId === session.familyId &&
        session.memberIds.includes(e.memberId)
      ) {
        hasMine = true;
      } else {
        hasOther = true;
      }
    }
    if (hasMine && hasOther) return /** @type {const} */ ({ kind: "mixed" });
    if (hasMine) return /** @type {const} */ ({ kind: "mine" });
    return /** @type {const} */ ({ kind: "other" });
  }

  function ensureActiveBooker() {
    if (
      !session ||
      isGuestSession() ||
      isCalendarBrowseSession() ||
      !session.memberIds?.length
    )
      return;
    if (
      !activeBookerMemberId ||
      !session.memberIds.includes(activeBookerMemberId)
    ) {
      activeBookerMemberId = session.memberIds[0];
    }
  }

  function activeBookerName() {
    if (!session || isGuestSession() || isCalendarBrowseSession()) return "";
    const fam = families.find((f) => f.id === session.familyId);
    const m = fam?.members.find((x) => x.id === activeBookerMemberId);
    return m?.name ?? "";
  }

  function formatSessionLabel() {
    if (!session || !siteText) return "";
    const C = siteText.calendar;
    if (isGuestSession()) return C.sessionGuestViewLabel;
    if (isCalendarBrowseSession())
      return (
        C.sessionBrowseViewLabel ?? "Consultation du calendrier · lecture seule"
      );
    const fam = families.find((f) => f.id === session.familyId);
    const names = session.memberIds
      .map((id) => fam?.members.find((m) => m.id === id)?.name)
      .filter(Boolean);
    if (!fam || names.length === 0) return "";
    let people = /** @type {string} */ (names[0]);
    if (names.length === 2)
      people = `${names[0]}${C.sessionJoinWord}${names[1]}`;
    else if (names.length > 2) {
      const n = names.length - 2;
      people = tpl(C.sessionNamesThreeTemplate, {
        a: names[0],
        b: names[1],
        n: String(n),
        suffix: n > 1 ? C.sessionOthersPluralSuffix : "",
      });
    }
    return `${people}${C.sessionNameSeparator}${fam.name}`;
  }

  function formatSessionLabelHtml() {
    if (!session || !siteText || isGuestSession() || isCalendarBrowseSession())
      return escapeHtml(formatSessionLabel());
    const C = siteText.calendar;
    const fam = families.find((f) => f.id === session.familyId);
    if (!fam) return "";
    const ids = session.memberIds;
    if (ids.length > 1) {
      return `<span class="session-name-family">${escapeHtml(fam.name)}</span>`;
    }
    if (ids.length === 1) {
      const m = fam.members.find((x) => x.id === ids[0]);
      if (!m) return escapeHtml(fam.name);
      const c = memberNameColor(fam.id, ids[0]);
      const sep = escapeHtml(C.sessionNameSeparator);
      return `<span class="session-name-pill" style="--session-ring:${c}"><strong class="session-name-pill__text">${escapeHtml(m.name)}</strong></span><span class="session-name-sep">${sep}</span><span class="session-name-family">${escapeHtml(fam.name)}</span>`;
    }
    return escapeHtml(fam.name);
  }

  /** Texte court pour titre natif / aria : « Prénom » ou « Prénom +2 ». */
  function entryShortPlain(entry) {
    const n = getMemberDisplayName(entry.familyId, entry.memberId);
    const g = entry.guests ?? 0;
    const maybeSfx =
      entry.status === "maybe"
        ? ` (${siteText?.calendar?.maybeShort ?? "peut-être"})`
        : "";
    if (g <= 0) return `${n}${maybeSfx}`;
    return `${n}${maybeSfx} +${g}`;
  }

  function dayMaybePrefixHtml() {
    const raw = siteText?.calendar?.maybeLabel ?? "Peut-être :";
    return `<span class="day-hover-maybe">${escapeHtml(raw)}</span> `;
  }

  /** Ligne infobulle : prénom en gras coloré, puis +N si besoin. */
  function entryLineHtml(entry) {
    const nameHtml = coloredNameHtml(entry.familyId, entry.memberId);
    const g = entry.guests ?? 0;
    const plus =
      g > 0
        ? ` <span class="day-hover-plus">+${g}</span>`
        : "";
    const maybePfx = entry.status === "maybe" ? dayMaybePrefixHtml() : "";
    const cls =
      entry.status === "maybe"
        ? "day-hover-line day-hover-line--maybe"
        : "day-hover-line";
    return `<div class="${cls}">${maybePfx}${nameHtml}${plus}</div>`;
  }

  /** @param {DayEntry[]} entries */
  function formatDayTipContent(entries) {
    if (!siteText) {
      return {
        headline: "",
        bodyPlain: "",
        bodyHtml: "",
        foot: "",
        footHtml: "",
        footPlain: "",
      };
    }
    const DT = siteText.calendar.dayTips;
    if (isGuestSession()) {
      if (!entries.length) {
        return {
          headline: DT.guestEmpty.headline,
          bodyPlain: DT.guestEmpty.bodyPlain,
          bodyHtml: "",
          foot: "",
          footHtml: "",
          footPlain: "",
        };
      }
      return {
        headline: DT.guestBooked.headline,
        bodyPlain: DT.guestBooked.bodyPlain,
        bodyHtml: "",
        foot: "",
        footHtml: "",
        footPlain: "",
      };
    }
    if (isCalendarBrowseSession()) {
      const be = DT.browseEmpty ?? {
        headline: "Jour libre",
        bodyPlain:
          "Consultation seule : vous ne pouvez pas modifier les inscriptions.",
      };
      const bh = DT.browseHasEntries ?? {
        headline: "Prévus pour ce jour",
        footHtml:
          '<p class="day-hover-foot">Consultation seule — impossible de modifier les inscriptions.</p>',
        footPlain:
          "Consultation seule — impossible de modifier les inscriptions.",
      };
      if (!entries.length) {
        return {
          headline: be.headline,
          bodyPlain: be.bodyPlain,
          bodyHtml: "",
          foot: "",
          footHtml: "",
          footPlain: "",
        };
      }
      const bodyHtml = entries.map((e) => entryLineHtml(e)).join("");
      const bodyPlain = entries.map((e) => entryShortPlain(e)).join(", ");
      return {
        headline: bh.headline,
        bodyHtml,
        bodyPlain,
        foot: "",
        footHtml: bh.footHtml,
        footPlain: bh.footPlain,
      };
    }
    const active = activeBookerName();
    const eg =
      session && !isGuestSession() && !isCalendarBrowseSession()
        ? Math.max(0, session.extraGuests ?? 0)
        : 0;
    if (!entries.length) {
      if (active && session && activeBookerMemberId) {
        const nh = coloredNameHtml(session.familyId, activeBookerMemberId);
        const plusGuestsHtml =
          eg > 0 ? ` <span class="day-hover-plus">+${eg}</span>` : "";
        const plusGuestsPlain = eg > 0 ? ` +${eg}` : "";
        const tmpl = DT.signedInEmptyWithActive;
        return {
          headline: tmpl.headline,
          bodyHtml: tpl(tmpl.bodyHtml, {
            activeHtml: nh,
            plusGuestsHtml: plusGuestsHtml,
          }),
          bodyPlain: tpl(tmpl.bodyPlain, {
            activePlain: active,
            plusGuestsPlain: plusGuestsPlain,
          }),
          foot: "",
          footHtml: "",
          footPlain: "",
        };
      }
      const tmplNA = DT.signedInEmptyNoActive;
      return {
        headline: tmplNA.headline,
        bodyPlain: tmplNA.bodyPlain,
        bodyHtml: "",
        foot: "",
        footHtml: "",
        footPlain: "",
      };
    }
    const bodyHtml = entries.map((e) => entryLineHtml(e)).join("");
    const bodyPlain = entries.map((e) => entryShortPlain(e)).join(", ");
    if (active && session && activeBookerMemberId) {
      const nh = coloredNameHtml(session.familyId, activeBookerMemberId);
      const tmplA = DT.signedInHasEntriesWithActive;
      return {
        headline: tmplA.headline,
        bodyHtml,
        bodyPlain,
        foot: "",
        footHtml: tpl(tmplA.footHtml, { activeHtml: nh }),
        footPlain: tpl(tmplA.footPlain, { activePlain: active }),
      };
    }
    const tmplN = DT.signedInHasEntriesNoActive;
    return {
      headline: tmplN.headline,
      bodyHtml,
      bodyPlain,
      foot: "",
      footHtml: tmplN.footHtml,
      footPlain: tmplN.footPlain,
    };
  }

  /** @param {DayEntry[]} entries */
  function dayAriaLabel(entries) {
    if (isGuestSession()) {
      const C = siteText?.calendar;
      if (!C) return "";
      return entries.length ? C.dayAriaGuestReserved : C.dayAriaGuestFree;
    }
    const t = formatDayTipContent(entries);
    const main = `${t.headline}. ${t.bodyPlain || ""}`.trim();
    const foot = t.footPlain || t.foot || "";
    return foot ? `${main} ${foot}` : main;
  }

  /** Infobulle native (ex. appareil tactile) : liste courte sans HTML. */
  function dayNativeTitle(entries) {
    if (isGuestSession()) {
      return entries.length
        ? siteText?.calendar?.dayNativeGuestReserved ?? ""
        : "";
    }
    if (!entries.length) {
      const t = formatDayTipContent(entries);
      return `${t.headline} — ${t.bodyPlain || ""}`.slice(0, 420);
    }
    const list = entries.map((e) => entryShortPlain(e)).join(" · ");
    const pfx = siteText?.calendar?.dayNativeListPrefix ?? "Inscrit·e·s : ";
    return `${pfx}${list}`.slice(0, 420);
  }

  function hideDayHoverTip() {
    if (!els.dayHoverTip || els.dayHoverTip.hidden) return;
    els.dayHoverTip.hidden = true;
    if (els.dayHoverTipBody) els.dayHoverTipBody.innerHTML = "";
    if (els.dayHoverTipFoot) els.dayHoverTipFoot.innerHTML = "";
  }

  /** @param {HTMLElement} anchor @param {DayEntry[]} entries */
  function showDayHoverTip(anchor, entries) {
    if (!els.dayHoverTip || !els.dayHoverTipTitle) return;
    const t = formatDayTipContent(entries);
    els.dayHoverTipTitle.textContent = t.headline;
    if (t.bodyHtml) {
      els.dayHoverTipBody.innerHTML = t.bodyHtml;
    } else {
      els.dayHoverTipBody.textContent = t.bodyPlain || "";
    }
    if (els.dayHoverTipFoot) {
      if (t.footHtml) els.dayHoverTipFoot.innerHTML = t.footHtml;
      else els.dayHoverTipFoot.textContent = t.foot || "";
    }
    els.dayHoverTip.hidden = false;
    els.dayHoverTip.style.visibility = "hidden";
    els.dayHoverTip.style.left = "0px";
    els.dayHoverTip.style.top = "0px";
    requestAnimationFrame(() => {
      const r = anchor.getBoundingClientRect();
      const pad = 10;
      const tw = els.dayHoverTip.offsetWidth;
      const th = els.dayHoverTip.offsetHeight;
      let top = r.bottom + 8;
      if (top + th > window.innerHeight - pad) top = r.top - th - 8;
      let left = r.left + r.width / 2 - tw / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
      top = Math.max(pad, top);
      els.dayHoverTip.style.left = `${left}px`;
      els.dayHoverTip.style.top = `${top}px`;
      els.dayHoverTip.style.visibility = "visible";
    });
  }

  /** @param {HTMLButtonElement} cell @param {DayEntry[]} entries */
  function bindDayHover(cell, entries) {
    const entriesSnap = entries.map((e) => {
      const row = {
        familyId: e.familyId,
        memberId: e.memberId,
        guests: e.guests ?? 0,
      };
      if (e.status === "maybe") row.status = "maybe";
      return row;
    });
    const show = () => showDayHoverTip(cell, entriesSnap);
    const hide = () => hideDayHoverTip();
    cell.addEventListener("mouseenter", show);
    cell.addEventListener("mouseleave", hide);
    cell.addEventListener("focus", show);
    cell.addEventListener("blur", hide);
  }

  function showStep(step) {
    currentStep = step;
    [els.stepFamily, els.stepProfile, els.stepCalendar].forEach((el) => {
      el.classList.remove("panel-enter");
    });
    els.stepFamily.hidden = step !== "family";
    els.stepProfile.hidden = step !== "profile";
    els.stepCalendar.hidden = step !== "calendar";
    const activePanel =
      step === "family"
        ? els.stepFamily
        : step === "profile"
          ? els.stepProfile
          : els.stepCalendar;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        activePanel.classList.add("panel-enter");
      });
    });
    const onCalendar = step === "calendar";
    if (els.globalBackBtn) {
      els.globalBackBtn.hidden = step === "family";
    }
    els.sessionSlot.hidden = !onCalendar || !session;
    if (onCalendar && session) {
      if (isGuestSession() || isCalendarBrowseSession()) {
        els.sessionName.textContent = formatSessionLabel();
      } else {
        els.sessionName.innerHTML = formatSessionLabelHtml();
      }
      if (siteText) {
        const Cb = siteText.calendar;
        els.switchProfileBtn.textContent = isGuestSession()
          ? Cb.switchQuitGuest
          : isCalendarBrowseSession()
            ? Cb.switchQuitBrowse ?? "Quitter la consultation"
            : Cb.switchChangeProfiles;
      }
    }
    if (step === "profile") {
      requestAnimationFrame(() => {
        if (memberPhysics) memberPhysics.lastT = performance.now();
        startMemberPhysics(els.profileGrid);
      });
    } else {
      stopMemberPhysics();
    }
  }

  function syncProfileContinue() {
    els.profileContinueBtn.disabled = profileMemberIds.length === 0;
  }

  function renderBookerBar() {
    if (!session || isGuestSession() || isCalendarBrowseSession()) {
      if (els.bookerBar) els.bookerBar.hidden = true;
      return;
    }
    ensureActiveBooker();
    const fam = families.find((f) => f.id === session.familyId);
    if (!fam) return;
    if (session.memberIds.length <= 1) {
      els.bookerBar.hidden = true;
      return;
    }
    els.bookerBar.hidden = false;
    els.bookerChips.innerHTML = "";
    els.bookerChips.setAttribute(
      "aria-label",
      siteText.calendar.bookerChipsAriaLabel
    );
    session.memberIds.forEach((mid) => {
      const m = fam.members.find((x) => x.id === mid);
      if (!m) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "booker-chip" +
        (mid === activeBookerMemberId ? " booker-chip--active" : "");
      const chipCol = memberNameColor(fam.id, mid);
      b.style.setProperty("--chip-ring", chipCol);
      b.innerHTML = `<span class="booker-chip__label">${escapeHtml(m.name)}</span>`;
      b.setAttribute("role", "radio");
      b.setAttribute(
        "aria-checked",
        mid === activeBookerMemberId ? "true" : "false"
      );
      b.addEventListener("click", () => {
        activeBookerMemberId = mid;
        renderCalendar();
      });
      els.bookerChips.appendChild(b);
    });
  }

  function renderFamilies() {
    els.familyGrid.innerHTML = "";
    els.familyGrid.className = "family-landing";
    const picker = document.createElement("div");
    picker.className = "family-picker";
    const guestSlot = document.createElement("div");
    guestSlot.className = "family-guest-slot";
    els.familyGrid.appendChild(picker);
    els.familyGrid.appendChild(guestSlot);

    families.forEach((fam) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "family-picker__btn";
      const color = familyFullIconColor(fam.id);
      btn.style.setProperty("--family-color", color);
      const maskUrl = familyGateAssetMaskUrl(fam.id);
      if (maskUrl) {
        btn.style.setProperty("--family-mask", `url("${maskUrl}")`);
      }

      const icon = document.createElement("span");
      icon.className = "family-picker__icon";
      icon.setAttribute("aria-hidden", "true");
      if (fam.id === CUSTOM_INVITE_FAMILY_ID) {
        icon.appendChild(makeInvitePineconeImgEl("family-picker__icon-img"));
      }

      const name = document.createElement("span");
      name.className = "family-picker__name";
      name.textContent = fam.name;

      btn.append(icon, name);
      btn.addEventListener("click", () => {
        selectedFamilyId = fam.id;
        session = null;
        profileMemberIds = [];
        profileExtraGuests = 0;
        if (els.calHint)
          els.calHint.textContent = siteText.calendar.defaultCalHint;
        if (els.calLegend) els.calLegend.hidden = false;
        renderProfiles(fam);
        showStep("profile");
      });
      picker.appendChild(btn);
    });

    guestSlot.classList.add("family-guest-slot--actions");

    const Lg = siteText?.landing?.guestTile ?? {
      title: "Accès invité",
      meta: "",
    };
    const browseLabel =
      siteText?.landing?.calendarBrowseButton ?? "Accéder au calendrier";

    const guestBtn = document.createElement("button");
    guestBtn.type = "button";
    guestBtn.className = "btn btn-ghost btn-landing-action";
    guestBtn.textContent = Lg.title;
    guestBtn.addEventListener("click", () => {
      selectedFamilyId = null;
      session = { guestView: true };
      profileMemberIds = [];
      profileExtraGuests = 0;
      activeBookerMemberId = null;
      if (els.calHint)
        els.calHint.textContent = siteText.calendar.guestCalHint;
      if (els.calLegend) els.calLegend.hidden = true;
      renderCalendar();
      showStep("calendar");
    });

    const calBrowseBtn = document.createElement("button");
    calBrowseBtn.type = "button";
    calBrowseBtn.className = "btn btn-primary btn-landing-action";
    calBrowseBtn.textContent = browseLabel;
    calBrowseBtn.addEventListener("click", () => {
      selectedFamilyId = null;
      session = { calendarBrowse: true };
      profileMemberIds = [];
      profileExtraGuests = 0;
      activeBookerMemberId = null;
      if (els.calHint)
        els.calHint.textContent =
          siteText.calendar.browseCalHint ??
          "Consultation du calendrier : lecture seule, sans modification des dates.";
      if (els.calLegend) els.calLegend.hidden = false;
      renderCalendar();
      showStep("calendar");
    });

    guestSlot.append(guestBtn, calBrowseBtn);
  }

  function hashLayoutSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h) || 1;
  }

  /**
   * Place statique (préférence utilisateur : moins d’animation).
   * @param {HTMLElement} grid
   */
  function layoutMemberPickerFloat(grid) {
    const famId = grid.dataset.floatFamily || "";
    const seed = hashLayoutSeed(famId);
    const btns = [...grid.querySelectorAll(".member-picker__btn")];
    const n = btns.length;
    if (!n) return;

    const rnd = (() => {
      let s = seed;
      return () => {
        s = (s * 48271) % 2147483647;
        return s / 2147483647;
      };
    })();

    const w = grid.clientWidth;
    const h = grid.clientHeight;
    if (w < 48 || h < 48) return;

    const pad = 10;
    const minP = pad;
    const maxP = 100 - pad;
    const rx = Math.min(44, 26 + n * 2.8);
    const ry = Math.min(40, 22 + n * 2.5);

    btns.forEach((btn, i) => {
      const base = ((i + rnd() * 0.4) / n) * Math.PI * 2 + (seed % 360) * 0.01;
      const wave = 0.72 + 0.28 * Math.sin(i * 1.4 + seed * 0.001);
      let cx = 50 + rx * wave * Math.cos(base + i * 0.15);
      let cy = 50 + ry * wave * Math.sin(base * 1.06);
      cx += (rnd() - 0.5) * 12;
      cy += (rnd() - 0.5) * 11;
      cx = Math.min(maxP, Math.max(minP, cx));
      cy = Math.min(maxP - 4, Math.max(minP + 6, cy));
      btn.style.left = `${cx}%`;
      btn.style.top = `${cy}%`;
    });
  }

  function stopMemberPhysics() {
    if (!memberPhysics) return;
    cancelAnimationFrame(memberPhysics.raf);
    memberPhysics.grid.removeEventListener("pointermove", memberPhysics.onMove);
    memberPhysics.grid.removeEventListener("pointerleave", memberPhysics.onLeave);
    memberPhysics.ro.disconnect();
    memberPhysics = null;
  }

  /**
   * Bulles en mouvement : inertie, rebonds murs & entre elles, répulsion souris.
   * @param {HTMLElement} grid
   */
  function startMemberPhysics(grid) {
    const famId = grid.dataset.floatFamily || "";
    const btns = [...grid.querySelectorAll(".member-picker__btn")];
    if (!btns.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopMemberPhysics();
      layoutMemberPickerFloat(grid);
      return;
    }

    if (memberPhysics && memberPhysics.grid === grid) {
      memberPhysics.lastT = performance.now();
      return;
    }

    stopMemberPhysics();

    const W = grid.clientWidth;
    const H = grid.clientHeight;
    if (W < 48 || H < 48) return;

    const seed = hashLayoutSeed(famId);
    const rnd = (() => {
      let s = seed;
      return () => {
        s = (s * 48271) % 2147483647;
        return s / 2147483647;
      };
    })();

    const r = Math.max(28, btns[0].offsetWidth / 2 || 56);
    const minSep = r * 2.05;
    /** @type {{ el: HTMLElement; x: number; y: number; vx: number; vy: number; r: number }[]} */
    const bubbles = [];

    for (let i = 0; i < btns.length; i++) {
      let x = 0;
      let y = 0;
      let ok = false;
      for (let t = 0; t < 80 && !ok; t++) {
        x = r + rnd() * (W - 2 * r);
        y = r + rnd() * (H - 2 * r);
        ok = bubbles.every(
          (b) => Math.hypot(b.x - x, b.y - y) >= minSep * (0.85 + rnd() * 0.15)
        );
      }
      if (!ok) {
        const ang = (i / btns.length) * Math.PI * 2;
        x = W / 2 + Math.cos(ang) * (W * 0.28) - r * 0.2;
        y = H / 2 + Math.sin(ang) * (H * 0.28);
      }
      const vx = (rnd() - 0.5) * 95;
      const vy = (rnd() - 0.5) * 95;
      bubbles.push({ el: btns[i], x, y, vx, vy, r });
      btns[i].style.left = `${x}px`;
      btns[i].style.top = `${y}px`;
    }

    const mouse = { x: 0, y: 0, active: false };
    const onMove = (e) => {
      const rect = grid.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    grid.addEventListener("pointermove", onMove);
    grid.addEventListener("pointerleave", onLeave);

    const rest = 0.88;
    const damp = 0.9972;
    const mouseK = 5200;
    const vMax = 200;

    const ro = new ResizeObserver(() => {
      if (!memberPhysics) return;
      const nw = grid.clientWidth;
      const nh = grid.clientHeight;
      memberPhysics.W = nw;
      memberPhysics.H = nh;
      for (const b of memberPhysics.bubbles) {
        b.x = Math.min(nw - b.r, Math.max(b.r, b.x));
        b.y = Math.min(nh - b.r, Math.max(b.r, b.y));
      }
    });
    ro.observe(grid);

    const state = {
      raf: 0,
      grid,
      bubbles,
      W,
      H,
      lastT: performance.now(),
      mouse,
      onMove,
      onLeave,
      ro,
    };
    memberPhysics = state;

    function tick(now) {
      const ph = memberPhysics;
      if (!ph) return;
      const dt = Math.min(0.045, Math.max(0.001, (now - ph.lastT) / 1000));
      ph.lastT = now;

      const { bubbles: B, W: w, H: h } = ph;
      const n = B.length;

      for (let i = 0; i < n; i++) {
        const b = B[i];
        let ax = 0;
        let ay = 0;
        if (ph.mouse.active) {
          const dx = b.x - ph.mouse.x;
          const dy = b.y - ph.mouse.y;
          const d2 = dx * dx + dy * dy + 1600;
          ax += (mouseK * dx) / d2;
          ay += (mouseK * dy) / d2;
        }
        b.vx += ax * dt;
        b.vy += ay * dt;
        b.vx *= damp;
        b.vy *= damp;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > vMax) {
          b.vx = (b.vx / sp) * vMax;
          b.vy = (b.vy / sp) * vMax;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      for (let i = 0; i < n; i++) {
        const b = B[i];
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * rest;
        } else if (b.x > w - b.r) {
          b.x = w - b.r;
          b.vx = -Math.abs(b.vx) * rest;
        }
        if (b.y < b.r) {
          b.y = b.r;
          b.vy = Math.abs(b.vy) * rest;
        } else if (b.y > h - b.r) {
          b.y = h - b.r;
          b.vy = -Math.abs(b.vy) * rest;
        }
      }

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const bi = B[i];
          const bj = B[j];
          const dx = bj.x - bi.x;
          const dy = bj.y - bi.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const minD = bi.r + bj.r;
          if (dist >= minD) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minD - dist + 0.5;
          bi.x -= nx * overlap * 0.5;
          bi.y -= ny * overlap * 0.5;
          bj.x += nx * overlap * 0.5;
          bj.y += ny * overlap * 0.5;
          const rv = (bi.vx - bj.vx) * nx + (bi.vy - bj.vy) * ny;
          if (rv < 0) {
            const imp = -(1 + rest) * rv * 0.5;
            bi.vx += imp * nx;
            bi.vy += imp * ny;
            bj.vx -= imp * nx;
            bj.vy -= imp * ny;
          }
        }
      }

      if (memberPhysics !== ph) return;

      for (const b of B) {
        b.el.style.left = `${b.x}px`;
        b.el.style.top = `${b.y}px`;
      }

      ph.raf = requestAnimationFrame(tick);
    }

    state.raf = requestAnimationFrame(tick);
  }

  function renderProfiles(fam) {
    if (session && session.familyId === fam.id && session.memberIds.length) {
      profileMemberIds = [...session.memberIds];
      if (typeof session.extraGuests === "number") {
        profileExtraGuests = Math.max(0, session.extraGuests);
      } else if (
        session.guestCounts &&
        typeof session.guestCounts === "object"
      ) {
        const vals = session.memberIds
          .map((id) => session.guestCounts[id])
          .filter((n) => typeof n === "number");
        profileExtraGuests = vals.length ? Math.max(0, ...vals) : 0;
      } else {
        profileExtraGuests = 0;
      }
    } else if (session && session.familyId !== fam.id) {
      profileMemberIds = [];
      profileExtraGuests = 0;
    }

    if (els.guestGlobalCount) {
      els.guestGlobalCount.textContent = String(profileExtraGuests);
    }

    const inviteMode = fam.id === CUSTOM_INVITE_FAMILY_ID;
    const inviteEditor = ensureInviteNameEditor();
    inviteEditor.hidden = !inviteMode;
    if (els.selectWholeFamilyBtn) els.selectWholeFamilyBtn.hidden = inviteMode;
    if (els.profileInviteRow) els.profileInviteRow.hidden = inviteMode;
    if (els.profileFootnote) els.profileFootnote.hidden = inviteMode;
    if (els.profileStepLead && siteText?.profile) {
      els.profileStepLead.textContent = inviteMode
        ? "Ajoutez un ou plusieurs invités, puis sélectionnez-les pour ouvrir le calendrier."
        : siteText.profile.stepLead;
    }

    els.profileFamilyLabel.textContent = fam.name;
    stopMemberPhysics();
    els.profileGrid.innerHTML = "";
    els.profileGrid.className = "member-picker";

    fam.members.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "member-picker__btn";
      const pick = memberNameColor(fam.id, m.id);
      btn.style.setProperty("--pick", pick);
      setMemberPickContrastVars(btn, pick);

      const face = document.createElement("span");
      face.className = "member-picker__face";
      if (fam.id === CUSTOM_INVITE_FAMILY_ID) {
        face.appendChild(makeInvitePineconeImgEl("member-picker__face-img"));
      } else if (m.id === "hmu-carla") {
        face.appendChild(
          makeCarlaMushroomIconEl(null, "member-picker__mask")
        );
      } else {
        face.textContent = m.initials;
      }

      const nameSp = document.createElement("span");
      nameSp.className = "member-picker__name";
      nameSp.textContent = m.name;

      btn.append(face, nameSp);
      btn.dataset.memberId = m.id;
      if (profileMemberIds.includes(m.id)) {
        btn.classList.add("member-picker__btn--selected");
      }
      btn.setAttribute(
        "aria-pressed",
        profileMemberIds.includes(m.id) ? "true" : "false"
      );
      btn.addEventListener("click", () => {
        const idx = profileMemberIds.indexOf(m.id);
        if (idx >= 0) profileMemberIds.splice(idx, 1);
        else profileMemberIds.push(m.id);
        const on = profileMemberIds.includes(m.id);
        btn.classList.toggle("member-picker__btn--selected", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        syncProfileContinue();
      });

      if (inviteMode) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "member-picker__remove";
        removeBtn.setAttribute("aria-label", `Retirer ${m.name}`);
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          fam.members = fam.members.filter((x) => x.id !== m.id);
          profileMemberIds = profileMemberIds.filter((id) => id !== m.id);
          if (session && session.familyId === fam.id) {
            session.memberIds = session.memberIds.filter((id) => id !== m.id);
            if (!session.memberIds.length) activeBookerMemberId = null;
          }
          renderProfiles(fam);
        });
        btn.appendChild(removeBtn);
      }

      els.profileGrid.appendChild(btn);
    });
    els.profileGrid.dataset.floatFamily = fam.id;
    syncProfileContinue();
    if (inviteMode) return;
    requestAnimationFrame(() => {
      startMemberPhysics(els.profileGrid);
      requestAnimationFrame(() => startMemberPhysics(els.profileGrid));
    });
  }

  function familyFullIconColor(familyId) {
    if (familyId === "fam-hetreau-ronget") return "#5a7863";
    if (familyId === "fam-hetreau-muller") return "#4e8d9c";
    if (familyId === "fam-hetreau-pottier") return "#ff8383";
    return "hsl(175, 65%, 32%)";
  }

  function familyGateAssetMaskUrl(familyId) {
    const rel = FAMILY_GATE_ASSET_SVG[familyId];
    if (!rel) return "";
    const i = rel.lastIndexOf("/");
    const dir = i >= 0 ? rel.slice(0, i + 1) : "";
    const file = i >= 0 ? rel.slice(i + 1) : rel;
    return assetUrl(dir + encodeURIComponent(file));
  }

  /**
   * @param {string} pathsInner balises path/circle/ellipse (statiques)
   * @param {string} color couleur currentColor si neutral faux
   * @param {boolean} neutral picto gris (vue invité)
   * @param {string} [rootClass="day-icon"] classe racine (ex. tile-mushroom)
   */
  function makeMushroomIconEl(pathsInner, color, neutral, rootClass) {
    const span = document.createElement("span");
    span.className = (rootClass || "day-icon") + (neutral ? " day-icon--neutral" : "");
    if (!neutral) span.style.color = color;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.65");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = pathsInner;
    span.appendChild(svg);
    return span;
  }

  /**
   * Carla : fichier icons/noun-mushrooms-4644483.svg (champignon seul, sans texte).
   * Masque CSS pour appliquer la couleur du membre.
   * @param {string | null} fillColor couleur du masque ; `null` sur l’écran profils (couleurs via CSS --pick)
   * @param {string} [rootClass="day-icon"]
   */
  function makeCarlaMushroomIconEl(fillColor, rootClass) {
    const span = document.createElement("span");
    span.className = (rootClass || "day-icon") + " mushroom-mask";
    span.setAttribute("aria-hidden", "true");
    if (fillColor != null && fillColor !== "") {
      span.style.backgroundColor = fillColor;
    }
    const mushUrl = carlaMushroomSvgUrl();
    span.style.webkitMaskImage = `url(${mushUrl})`;
    span.style.maskImage = `url(${mushUrl})`;
    return span;
  }

  /**
   * Pastilles pleines par réservation (membre). Rien en vue invité (anonymat).
   * @param {HTMLElement} container
   * @param {DayEntry[]} entries
   */
  function fillDayPeopleRow(container, entries) {
    container.replaceChildren();
    for (const e of entries) {
      const dot = document.createElement("span");
      dot.className =
        "day-person-dot" +
        (e.status === "maybe" ? " day-person-dot--maybe" : "");
      dot.style.backgroundColor = memberNameColor(e.familyId, e.memberId);
      dot.setAttribute("aria-hidden", "true");
      container.appendChild(dot);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCalendar() {
    if (!session || !siteText) return;
    hideDayHoverTip();

    const Ccal = siteText.calendar;
    if (isGuestSession()) {
      if (els.calHint) els.calHint.textContent = Ccal.guestCalHint;
      if (els.calLegend) els.calLegend.hidden = true;
      els.calContext.textContent = Ccal.guestCalContext;
      if (els.bookerBar) els.bookerBar.hidden = true;
    } else if (isCalendarBrowseSession()) {
      if (els.calHint)
        els.calHint.textContent =
          Ccal.browseCalHint ??
          "Consultation du calendrier : lecture seule, sans modification des dates.";
      if (els.calLegend) els.calLegend.hidden = false;
      els.calContext.textContent =
        Ccal.browseCalContext ??
        "Survolez un jour pour le détail. Pour réserver, passez par une famille et vos profils.";
      if (els.bookerBar) els.bookerBar.hidden = true;
    } else {
      if (els.calHint) els.calHint.textContent = Ccal.defaultCalHint;
      if (els.calLegend) els.calLegend.hidden = false;
      ensureActiveBooker();
      renderBookerBar();
      const n = session.memberIds.length;
      const eg = session.extraGuests ?? 0;
      const invSuffix =
        eg > 0 ? tpl(Ccal.invSuffixTemplate, { eg: String(eg) }) : "";
      els.calContext.textContent =
        n > 1
          ? tpl(Ccal.calContextMulti, {
              activeName: activeBookerName(),
              invSuffix: invSuffix,
            })
          : tpl(Ccal.calContextSingle, { invSuffix: invSuffix });
    }

    els.monthsRoot.innerHTML = "";
    const today = new Date();
    const todayKey =
      today.getFullYear() === YEAR
        ? dateKey(YEAR, today.getMonth(), today.getDate())
        : null;

    const wds = siteText.calendar.weekDays;
    const browseReadOnly = isCalendarBrowseSession();

    MONTH_LAYOUT.forEach(({ month, mode }) => {
      const wrap = document.createElement("div");
      wrap.className =
        "month" +
        (mode === "hero"
          ? " month--hero"
          : mode === "faint"
            ? " month--faint"
            : " month--peek");
      wrap.dataset.month = String(month);
      const labRaw =
        siteText.calendar.monthLabels[String(month)] ??
        siteText.calendar.monthLabels[month];
      const label = labRaw ?? String(month);
      const title = label.charAt(0).toUpperCase() + label.slice(1);
      wrap.innerHTML = `<div class="month-header"><h3 class="month-title">${title}</h3><span class="month-year">${YEAR}</span></div>`;
      const body = document.createElement("div");
      body.className = "month-body";

      const wdRow = document.createElement("div");
      wdRow.className = "weekday-row";
      wds.forEach((w) => {
        const c = document.createElement("div");
        c.className = "wd";
        c.textContent = w;
        wdRow.appendChild(c);
      });
      body.appendChild(wdRow);

      const first = new Date(YEAR, month - 1, 1);
      const lastDay = new Date(YEAR, month, 0).getDate();
      const lead = (first.getDay() + 6) % 7;
      const cells = [];
      for (let i = 0; i < lead; i++) {
        cells.push(null);
      }
      for (let d = 1; d <= lastDay; d++) {
        cells.push(d);
      }
      while (cells.length % 7 !== 0) {
        cells.push(null);
      }
      for (let r = 0; r < cells.length; r += 7) {
        const row = document.createElement("div");
        row.className = "week-row";
        for (let c = 0; c < 7; c++) {
          const d = cells[r + c];
          const cell = document.createElement(d ? "button" : "div");
          cell.className = "day";
          if (!d) {
            cell.setAttribute("aria-hidden", "true");
            row.appendChild(cell);
            continue;
          }
          const key = dateKey(YEAR, month - 1, d);
          const entries = getDayEntries(key);

          if (isGuestSession()) {
            const locked = entries.length > 0;
            const guestCell = document.createElement(locked ? "button" : "div");
            guestCell.className =
              "day day--in-month " +
              (locked ? "day--guest-locked" : "day--guest-empty");
            if (locked) guestCell.type = "button";
            if (key === todayKey) guestCell.classList.add("day--today");
            guestCell.title = dayNativeTitle(entries);
            guestCell.setAttribute("aria-label", dayAriaLabel(entries));
            if (locked) bindDayHover(guestCell, entries);
            guestCell.dataset.date = key;
            const numG = document.createElement("span");
            numG.className = "day-num";
            numG.textContent = String(d);
            guestCell.appendChild(numG);
            if (locked) {
              const headcountG = entries.reduce(
                (s, e) => s + 1 + (e.guests ?? 0),
                0
              );
              guestCell.classList.add("day--has-people");
              const rowG = document.createElement("div");
              rowG.className = "day-people day-people--guest";
              rowG.setAttribute("aria-hidden", "true");
              guestCell.appendChild(rowG);
              const totalG = document.createElement("span");
              totalG.className = "day-people-total";
              totalG.textContent = String(headcountG);
              guestCell.appendChild(totalG);
            }
            row.appendChild(guestCell);
            continue;
          }

          cell.type = "button";
          cell.classList.add("day--in-month");
          if (browseReadOnly) cell.classList.add("day--read-only");
          if (key === todayKey) cell.classList.add("day--today");
          const { kind } = dayClassification(entries);
          if (kind === "mine") cell.classList.add("day--mine");
          else if (kind === "other") cell.classList.add("day--other");
          else if (kind === "mixed") cell.classList.add("day--mixed");
          cell.title = dayNativeTitle(entries);
          cell.setAttribute("aria-label", dayAriaLabel(entries));
          bindDayHover(cell, entries);
          cell.dataset.date = key;
          if (browseReadOnly) {
            cell.setAttribute("aria-disabled", "true");
            cell.tabIndex = -1;
          }
          const num = document.createElement("span");
          num.className = "day-num";
          num.textContent = String(d);
          cell.appendChild(num);
          const headcount = entries.reduce(
            (s, e) => s + 1 + (e.guests ?? 0),
            0
          );
          if (entries.length > 0) {
            cell.classList.add("day--has-people");
            const peopleRow = document.createElement("div");
            peopleRow.className = "day-people";
            peopleRow.setAttribute("aria-hidden", "true");
            fillDayPeopleRow(peopleRow, entries);
            cell.appendChild(peopleRow);
            const total = document.createElement("span");
            total.className = "day-people-total";
            total.textContent = String(headcount);
            cell.appendChild(total);
          }
          if (!browseReadOnly) {
            cell.addEventListener("click", () => onDayClick(key));
          }
          row.appendChild(cell);
        }
        body.appendChild(row);
      }

      wrap.appendChild(body);
      els.monthsRoot.appendChild(wrap);
    });
  }

  function onDayClick(key) {
    if (!session || isGuestSession() || isCalendarBrowseSession()) return;
    const selectedIds = [...new Set(session.memberIds.filter(Boolean))];
    if (!selectedIds.length) return;
    const guests = Math.max(0, session.extraGuests ?? 0);
    const list = getDayEntries(key).map((e) => ({ ...e }));

    for (const mid of selectedIds) {
      const i = list.findIndex(
        (e) => e.familyId === session.familyId && e.memberId === mid
      );
      if (i < 0) {
        list.push({ familyId: session.familyId, memberId: mid, guests: 0 });
      } else if (list[i].status === "maybe") {
        list.splice(i, 1);
      } else {
        list[i] = { ...list[i], status: "maybe" };
      }
    }

    assignGuestsOncePerFamily(
      list,
      session.familyId,
      session.memberIds,
      guests
    );
    const nextBookings = normalizeBookingsObject(bookings);
    const nextEntries = dedupeEntries(list);
    if (nextEntries.length === 0) delete nextBookings[key];
    else nextBookings[key] = nextEntries;
    saveBookings(nextBookings);
    renderCalendar();
  }

  els.profileContinueBtn.addEventListener("click", () => {
    if (profileMemberIds.length === 0 || !selectedFamilyId) return;
    const fam = families.find((f) => f.id === selectedFamilyId);
    if (!fam) return;
    session = {
      familyId: fam.id,
      memberIds: [...profileMemberIds],
      extraGuests: Math.max(0, profileExtraGuests),
    };
    activeBookerMemberId = session.memberIds[0];
    if (els.calHint) els.calHint.textContent = siteText.calendar.defaultCalHint;
    if (els.calLegend) els.calLegend.hidden = false;
    renderCalendar();
    showStep("calendar");
  });

  els.backToFamilies.addEventListener("click", () => resetToFamilyStep());

  if (els.selectWholeFamilyBtn) {
    els.selectWholeFamilyBtn.addEventListener("click", () => {
      if (!selectedFamilyId) return;
      const fam = families.find((f) => f.id === selectedFamilyId);
      if (!fam) return;
      if (fam.id === CUSTOM_INVITE_FAMILY_ID) return;
      const allIds = fam.members.map((mm) => mm.id);
      const allSelected =
        allIds.length > 0 &&
        allIds.every((id) => profileMemberIds.includes(id)) &&
        profileMemberIds.length === allIds.length;
      if (allSelected) {
        profileMemberIds = [];
        if (session && session.familyId === fam.id) {
          session.memberIds = [];
        }
      } else {
        profileMemberIds = [...allIds];
        if (session && session.familyId === fam.id) {
          session.memberIds = [...allIds];
        }
      }
      const grid = els.profileGrid;
      if (grid && grid.dataset.floatFamily === fam.id) {
        const btns = [...grid.querySelectorAll(".member-picker__btn[data-member-id]")];
        const domIds = new Set(btns.map((b) => b.dataset.memberId));
        const want = new Set(allIds);
        if (
          btns.length === fam.members.length &&
          domIds.size === want.size &&
          [...want].every((id) => domIds.has(id))
        ) {
          for (const btn of btns) {
            const id = btn.dataset.memberId;
            const on = id ? profileMemberIds.includes(id) : false;
            btn.classList.toggle("member-picker__btn--selected", on);
            btn.setAttribute("aria-pressed", on ? "true" : "false");
          }
          syncProfileContinue();
          return;
        }
      }
      renderProfiles(fam);
    });
  }

  els.switchProfileBtn.addEventListener("click", () => goBackOneStep());
  els.globalBackBtn?.addEventListener("click", () => goBackOneStep());

  function initProfileInviteControls() {
    if (profileInviteControlsBound) return;
    profileInviteControlsBound = true;
    els.guestGlobalMinus?.addEventListener("click", (ev) => {
      ev.preventDefault();
      profileExtraGuests = Math.max(0, profileExtraGuests - 1);
      if (els.guestGlobalCount)
        els.guestGlobalCount.textContent = String(profileExtraGuests);
    });
    els.guestGlobalPlus?.addEventListener("click", (ev) => {
      ev.preventDefault();
      profileExtraGuests += 1;
      if (els.guestGlobalCount)
        els.guestGlobalCount.textContent = String(profileExtraGuests);
    });
  }

  window.addEventListener("storage", (e) => {
    if (BOOKINGS_API_URL) return;
    if (e.key === STORAGE_KEY) {
      bookings = loadLocalBookings();
      hydrateInviteFamilyMembersFromBookings(bookings);
      if (session) renderCalendar();
    }
  });

  window.addEventListener("scroll", () => hideDayHoverTip(), true);
  window.addEventListener("resize", () => hideDayHoverTip());

  async function boot() {
    await loadSiteContent();
    applyStaticContentToDom();
    purgeOldCalendarKeys();
    maybeResetCalendarFromUrl();
    initProfileInviteControls();
    bookings = await loadBookings();
    hydrateInviteFamilyMembersFromBookings(bookings);
    renderFamilies();
    showStep("family");
    window.villecrozeResetCalendar = () => {
      clearAllBookings();
    };
  }
  boot();
})();
