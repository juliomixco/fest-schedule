import type { Festival, Day, Stage, Act } from "../types";

// Deterministic IDs so the fixture is stable across reloads
const COLORS = {
  south: "#e11d48",
  north: "#2563eb",
  marquee: "#7c3aed",
  jupiler: "#d97706",
  dome: "#059669",
  cafe: "#db2777",
};

type RawAct = [string, string, string, string]; // [name, start, end, urlSlug]

function mkStage(id: string, name: string, color: string, dayId: string, rawActs: RawAct[]): Stage {
  const acts: Act[] = rawActs.map(([name, start, end, slug]) => ({
    id: `${dayId}-${id}-${slug}`,
    name,
    startTime: start,
    endTime: end,
    stageId: `${dayId}-${id}`,
    dayId,
    url: `https://www.graspop.be/en/bands/${slug}`,
  }));
  return { id: `${dayId}-${id}`, name, color, acts };
}

function mkDay(id: string, label: string, date: string, stages: Stage[]): Day {
  return { id, label, date, stages };
}

// ── THURSDAY 18 June 2026 ──────────────────────────────────────────────────

const thuSouth = mkStage("south", "SOUTH STAGE", COLORS.south, "thu", [
  ["EGO KILL TALENT",  "2026-06-18T12:45:00", "2026-06-18T13:30:00", "ego-kill-talent"],
  ["DANKO JONES",      "2026-06-18T14:35:00", "2026-06-18T15:25:00", "danko-jones"],
  ["ACCEPT",           "2026-06-18T16:35:00", "2026-06-18T17:25:00", "accept"],
  ["A DAY TO REMEMBER","2026-06-18T18:40:00", "2026-06-18T19:35:00", "a-day-to-remember"],
  ["WITHIN TEMPTATION","2026-06-18T21:10:00", "2026-06-18T22:25:00", "within-temptation"],
  ["THE OFFSPRING",    "2026-06-19T00:00:00", "2026-06-19T01:30:00", "the-offspring"],
]);

const thuNorth = mkStage("north", "NORTH STAGE", COLORS.north, "thu", [
  ["MANTAH",    "2026-06-18T12:00:00", "2026-06-18T12:40:00", "mantah"],
  ["STATIC-X",  "2026-06-18T13:35:00", "2026-06-18T14:25:00", "static-x"],
  ["WIND ROSE", "2026-06-18T15:35:00", "2026-06-18T16:25:00", "wind-rose"],
  ["TOM MORELLO","2026-06-18T17:35:00", "2026-06-18T18:30:00", "tom-morello"],
  ["MEGADETH",  "2026-06-18T19:45:00", "2026-06-18T21:00:00", "megadeth"],
  ["LIMP BIZKIT","2026-06-18T22:35:00", "2026-06-18T23:50:00", "limp-bizkit"],
]);

const thuMarquee = mkStage("marquee", "MARQUEE", COLORS.marquee, "thu", [
  ["DISTANT",                  "2026-06-18T12:00:00", "2026-06-18T12:40:00", "distant"],
  ["SNOT",                     "2026-06-18T13:15:00", "2026-06-18T14:00:00", "snot"],
  ["DYING WISH",               "2026-06-18T14:40:00", "2026-06-18T15:25:00", "dying-wish"],
  ["GATECREEPER",              "2026-06-18T16:05:00", "2026-06-18T16:55:00", "gatecreeper"],
  ["WOLVES IN THE THRONE ROOM","2026-06-18T17:35:00", "2026-06-18T18:25:00", "wolves-in-the-throne-room"],
  ["SEPTICFLESH",              "2026-06-18T19:10:00", "2026-06-18T20:00:00", "septicflesh"],
  ["CULT OF LUNA",             "2026-06-18T20:45:00", "2026-06-18T21:40:00", "cult-of-luna"],
  ["ANTHRAX",                  "2026-06-18T22:25:00", "2026-06-18T23:25:00", "anthrax"],
]);

const thuJupiler = mkStage("jupiler", "JUPILER STAGE", COLORS.jupiler, "thu", [
  ["SLAY SQUAD",              "2026-06-18T12:40:00", "2026-06-18T13:20:00", "slay-squad"],
  ["BLACKGOLD",               "2026-06-18T14:00:00", "2026-06-18T14:45:00", "blackgold"],
  ["THROWN",                  "2026-06-18T15:40:00", "2026-06-18T16:25:00", "thrown"],
  ["GRADE 2",                 "2026-06-18T17:25:00", "2026-06-18T18:10:00", "grade-2"],
  ["JOHN COFFEY",             "2026-06-18T19:10:00", "2026-06-18T20:00:00", "john-coffey"],
  ["PENNYWISE",               "2026-06-18T21:00:00", "2026-06-18T21:50:00", "pennywise"],
  ["THE DILLINGER ESCAPE PLAN","2026-06-18T23:00:00", "2026-06-19T00:00:00", "the-dillinger-escape-plan"],
]);

const thuDome = mkStage("dome", "METAL DOME", COLORS.dome, "thu", [
  ["MAGNOLIA PARK",     "2026-06-18T12:00:00", "2026-06-18T12:40:00", "magnolia-park"],
  ["ANKOR",             "2026-06-18T13:20:00", "2026-06-18T14:00:00", "ankor"],
  ["THE FUNERAL PORTRAIT","2026-06-18T14:50:00", "2026-06-18T15:35:00", "the-funeral-portrait"],
  ["SLEEP THEORY",      "2026-06-18T16:30:00", "2026-06-18T17:20:00", "sleep-theory"],
  ["LAKEVIEW",          "2026-06-18T18:15:00", "2026-06-18T19:05:00", "lakeview"],
  ["BLOODYWOOD",        "2026-06-18T20:05:00", "2026-06-18T20:55:00", "bloodywood"],
  ["PRESIDENT",         "2026-06-18T21:55:00", "2026-06-18T22:55:00", "president"],
  ["DJ NATHACHELET",    "2026-06-19T00:00:00", "2026-06-19T00:50:00", "dj-nathachelet"],
  ["NIN UK",            "2026-06-19T00:50:00", "2026-06-19T01:20:00", "nin-uk"],
  ["DEAFTONES",         "2026-06-19T01:40:00", "2026-06-19T02:10:00", "deaftones"],
  ["SPOUKY KIDS",       "2026-06-19T02:30:00", "2026-06-19T03:00:00", "spouky-kids"],
  ["KORN AGAIN",        "2026-06-19T03:20:00", "2026-06-19T03:50:00", "korn-again"],
]);

const thuCafe = mkStage("cafe", "CLASSIC ROCK CAFÉ", COLORS.cafe, "thu", [
  ["THRASH ATTACK","2026-06-18T14:00:00", "2026-06-18T14:45:00", "thrash-attack"],
  ["POWERSLAVE",   "2026-06-18T15:15:00", "2026-06-18T16:30:00", "powerslave"],
  ["THRASH ATTACK","2026-06-18T17:00:00", "2026-06-18T17:45:00", "thrash-attack"],
  ["DJ CARL",      "2026-06-19T00:00:00", "2026-06-19T04:00:00", "dj-carl"],
]);

// ── FRIDAY 19 June 2026 ────────────────────────────────────────────────────

const friSouth = mkStage("south", "SOUTH STAGE", COLORS.south, "fri", [
  ["QUICKSAND",                       "2026-06-19T12:55:00", "2026-06-19T13:40:00", "quicksand"],
  ["TRIGGERFINGER",                   "2026-06-19T14:45:00", "2026-06-19T15:35:00", "triggerfinger"],
  ["CAVALERA \"CHAOS A.D.\"",         "2026-06-19T16:45:00", "2026-06-19T17:35:00", "cavalera-chaos-a-d"],
  ["SEX PISTOLS FEAT. FRANK CARTER",  "2026-06-19T18:45:00", "2026-06-19T19:45:00", "sex-pistols-featuring-frank-carter"],
  ["ALTER BRIDGE",                    "2026-06-19T21:10:00", "2026-06-19T22:25:00", "alter-bridge"],
  ["VOLBEAT",                         "2026-06-20T00:00:00", "2026-06-20T01:30:00", "volbeat"],
]);

const friNorth = mkStage("north", "NORTH STAGE", COLORS.north, "fri", [
  ["INFECTED RAIN",    "2026-06-19T12:00:00", "2026-06-19T12:45:00", "infected-rain"],
  ["DROWNING POOL",    "2026-06-19T13:50:00", "2026-06-19T14:35:00", "drowning-pool"],
  ["MAMMOTH",          "2026-06-19T15:45:00", "2026-06-19T16:35:00", "mammoth"],
  ["TRIVIUM",          "2026-06-19T17:45:00", "2026-06-19T18:35:00", "trivium"],
  ["BREAKING BENJAMIN","2026-06-19T19:55:00", "2026-06-19T21:00:00", "breaking-benjamin"],
  ["KNOCKED LOOSE",    "2026-06-19T22:35:00", "2026-06-19T23:50:00", "knocked-loose"],
]);

const friMarquee = mkStage("marquee", "MARQUEE", COLORS.marquee, "fri", [
  ["HULDER",          "2026-06-19T12:00:00", "2026-06-19T12:40:00", "hulder"],
  ["BARK",            "2026-06-19T13:20:00", "2026-06-19T14:05:00", "bark"],
  ["ASOMVEL",         "2026-06-19T14:45:00", "2026-06-19T15:30:00", "asomvel"],
  ["SUICIDAL ANGELS", "2026-06-19T16:10:00", "2026-06-19T17:00:00", "suicidal-angels"],
  ["OLD MAN'S CHILD", "2026-06-19T17:40:00", "2026-06-19T18:30:00", "old-man-s-child"],
  ["POSSESSED",       "2026-06-19T19:10:00", "2026-06-19T20:00:00", "possessed"],
  ["DEATH TO ALL",    "2026-06-19T20:45:00", "2026-06-19T21:45:00", "death-to-all"],
  ["CRADLE OF FILTH", "2026-06-19T22:45:00", "2026-06-20T00:00:00", "cradle-of-filth"],
]);

const friJupiler = mkStage("jupiler", "JUPILER STAGE", COLORS.jupiler, "fri", [
  ["THORNHILL",        "2026-06-19T12:40:00", "2026-06-19T13:20:00", "thornhill"],
  ["LETLIVE.",         "2026-06-19T14:05:00", "2026-06-19T14:45:00", "letlive"],
  ["GUILT TRIP",       "2026-06-19T15:40:00", "2026-06-19T16:25:00", "guilt-trip"],
  ["DRAIN",            "2026-06-19T17:25:00", "2026-06-19T18:10:00", "drain"],
  ["WE CAME AS ROMANS","2026-06-19T19:10:00", "2026-06-19T20:00:00", "we-came-as-romans"],
  ["KUBLAI KHAN TX",   "2026-06-19T21:00:00", "2026-06-19T21:50:00", "kublai-khan-tx"],
  ["LIONHEART",        "2026-06-19T23:00:00", "2026-06-20T00:00:00", "lionheart"],
]);

const friDome = mkStage("dome", "METAL DOME", COLORS.dome, "fri", [
  ["VOWER",               "2026-06-19T12:00:00", "2026-06-19T12:40:00", "vower"],
  ["TX2",                 "2026-06-19T13:20:00", "2026-06-19T14:05:00", "tx2"],
  ["ORANSSI PAZUZU",      "2026-06-19T14:50:00", "2026-06-19T15:35:00", "oranssi-pazuzu"],
  ["HARAKIRI FOR THE SKY","2026-06-19T16:30:00", "2026-06-19T17:20:00", "harakiri-for-the-sky"],
  ["ELDER",               "2026-06-19T18:15:00", "2026-06-19T19:05:00", "elder"],
  ["KADAVAR",             "2026-06-19T20:05:00", "2026-06-19T20:55:00", "kadavar"],
  ["LEPROUS",             "2026-06-19T21:55:00", "2026-06-19T22:55:00", "leprous"],
  ["DJ NATHACHELET",      "2026-06-20T00:30:00", "2026-06-20T01:30:00", "dj-nathachelet"],
  ["ST. JIMMY'S",         "2026-06-20T01:30:00", "2026-06-20T02:30:00", "st-jimmy-s"],
  ["PABLO HONEY",         "2026-06-20T02:50:00", "2026-06-20T03:50:00", "pablo-honey"],
]);

const friCafe = mkStage("cafe", "CLASSIC ROCK CAFÉ", COLORS.cafe, "fri", [
  ["AMÆZING SNÄKE","2026-06-19T14:00:00", "2026-06-19T14:45:00", "amaezing-snake"],
  ["AMÆZING SNÄKE","2026-06-19T15:15:00", "2026-06-19T16:00:00", "amaezing-snake"],
  ["AMÆZING SNÄKE","2026-06-19T16:30:00", "2026-06-19T17:15:00", "amaezing-snake"],
  ["ROLR",         "2026-06-19T19:00:00", "2026-06-19T19:45:00", "rolr"],
  ["ROLR",         "2026-06-19T20:15:00", "2026-06-19T21:00:00", "rolr"],
  ["ROLR",         "2026-06-19T21:30:00", "2026-06-19T22:15:00", "rolr"],
  ["DJ CARL",      "2026-06-20T00:00:00", "2026-06-20T04:00:00", "dj-carl"],
]);

// ── SATURDAY 20 June 2026 ──────────────────────────────────────────────────

const satSouth = mkStage("south", "SOUTH STAGE", COLORS.south, "sat", [
  ["FLEDDY MELCULY",      "2026-06-20T12:55:00", "2026-06-20T13:40:00", "fleddy-melculy"],
  ["MALEVOLENCE",         "2026-06-20T14:45:00", "2026-06-20T15:35:00", "malevolence"],
  ["HOLLYWOOD UNDEAD",    "2026-06-20T16:45:00", "2026-06-20T17:35:00", "hollywood-undead"],
  ["ICE NINE KILLS",      "2026-06-20T18:50:00", "2026-06-20T19:50:00", "ice-nine-kills"],
  ["ARCHITECTS",          "2026-06-20T21:10:00", "2026-06-20T22:25:00", "architects"],
  ["BRING ME THE HORIZON","2026-06-21T00:00:00", "2026-06-21T01:30:00", "bring-me-the-horizon"],
]);

const satNorth = mkStage("north", "NORTH STAGE", COLORS.north, "sat", [
  ["THE PRETTY WILD", "2026-06-20T12:00:00", "2026-06-20T12:45:00", "the-pretty-wild"],
  ["P.O.D.",          "2026-06-20T13:50:00", "2026-06-20T14:35:00", "p-o-d"],
  ["SEPULTURA",       "2026-06-20T15:45:00", "2026-06-20T16:35:00", "sepultura"],
  ["THREE DAYS GRACE","2026-06-20T17:45:00", "2026-06-20T18:40:00", "three-days-grace"],
  ["BABYMETAL",       "2026-06-20T20:00:00", "2026-06-20T21:00:00", "babymetal"],
  ["BAD OMENS",       "2026-06-20T22:35:00", "2026-06-20T23:50:00", "bad-omens"],
]);

const satMarquee = mkStage("marquee", "MARQUEE", COLORS.marquee, "sat", [
  ["EMBRYONIC AUTOPSY",      "2026-06-20T12:15:00", "2026-06-20T13:00:00", "embryonic-autopsy"],
  ["SINSAENUM",              "2026-06-20T13:40:00", "2026-06-20T14:25:00", "sinsaenum"],
  ["UADA",                   "2026-06-20T15:05:00", "2026-06-20T15:50:00", "uada"],
  ["TERRORIZER",             "2026-06-20T16:30:00", "2026-06-20T17:15:00", "terrorizer"],
  ["LACUNA COIL",            "2026-06-20T17:55:00", "2026-06-20T18:45:00", "lacuna-coil"],
  ["CORROSION OF CONFORMITY","2026-06-20T19:25:00", "2026-06-20T20:15:00", "corrosion-of-conformity"],
  ["MOONSPELL",              "2026-06-20T20:55:00", "2026-06-20T21:45:00", "moonspell"],
  ["SIX FEET UNDER",         "2026-06-20T22:35:00", "2026-06-20T23:35:00", "six-feet-under"],
]);

const satJupiler = mkStage("jupiler", "JUPILER STAGE", COLORS.jupiler, "sat", [
  ["VICIOUS RUMORS","2026-06-20T12:40:00", "2026-06-20T13:20:00", "vicious-rumors"],
  ["FEUERSCHWANZ",  "2026-06-20T14:00:00", "2026-06-20T14:45:00", "feuerschwanz"],
  ["PRIMAL FEAR",   "2026-06-20T15:40:00", "2026-06-20T16:25:00", "primal-fear"],
  ["ORDEN OGAN",    "2026-06-20T17:25:00", "2026-06-20T18:10:00", "orden-ogan"],
  ["SONATA ARCTICA","2026-06-20T19:10:00", "2026-06-20T20:00:00", "sonata-arctica"],
  ["QUEENSRŸCHE",   "2026-06-20T21:00:00", "2026-06-20T21:50:00", "queensryche"],
  ["AVATAR",        "2026-06-20T23:00:00", "2026-06-21T00:00:00", "avatar"],
]);

const satDome = mkStage("dome", "METAL DOME", COLORS.dome, "sat", [
  ["MOUTH CULTURE",          "2026-06-20T12:00:00", "2026-06-20T12:40:00", "mouth-culture"],
  ["FAETOOTH",               "2026-06-20T13:20:00", "2026-06-20T14:00:00", "faetooth"],
  ["RIVERS OF NIHIL",        "2026-06-20T14:50:00", "2026-06-20T15:35:00", "rivers-of-nihil"],
  ["LOATHE",                 "2026-06-20T16:30:00", "2026-06-20T17:20:00", "loathe"],
  ["CATCH YOUR BREATH",      "2026-06-20T18:15:00", "2026-06-20T19:05:00", "catch-your-breath"],
  ["UNCLE ACID & THE DEADBEATS","2026-06-20T20:05:00", "2026-06-20T20:55:00", "uncle-acid-the-deadbeats"],
  ["TESSERACT",              "2026-06-20T21:55:00", "2026-06-20T22:55:00", "tesseract"],
  ["DJ NATHACHELET",         "2026-06-21T00:30:00", "2026-06-21T01:30:00", "dj-nathachelet"],
  ["SLIP-NOT",               "2026-06-21T01:30:00", "2026-06-21T02:30:00", "slip-not"],
  ["CHOP SUEY",              "2026-06-21T02:50:00", "2026-06-21T03:50:00", "chop-suey"],
]);

const satCafe = mkStage("cafe", "CLASSIC ROCK CAFÉ", COLORS.cafe, "sat", [
  ["ULTIMATE OZZY","2026-06-20T14:00:00", "2026-06-20T15:00:00", "ultimate-ozzy"],
  ["SNAGGLETOOTH", "2026-06-20T16:00:00", "2026-06-20T17:00:00", "snaggletooth"],
  ["DJ CARL",      "2026-06-21T00:00:00", "2026-06-21T04:00:00", "dj-carl"],
]);

// ── SUNDAY 21 June 2026 ────────────────────────────────────────────────────

const sunSouth = mkStage("south", "SOUTH STAGE", COLORS.south, "sun", [
  ["BATTLE BEAST",      "2026-06-21T12:00:00", "2026-06-21T12:45:00", "battle-beast"],
  ["LIFE OF AGONY",     "2026-06-21T13:55:00", "2026-06-21T14:45:00", "life-of-agony"],
  ["EXTREME",           "2026-06-21T15:55:00", "2026-06-21T16:55:00", "extreme"],
  ["BLACK LABEL SOCIETY","2026-06-21T18:15:00", "2026-06-21T19:15:00", "black-label-society"],
  ["ELECTRIC CALLBOY",  "2026-06-21T20:45:00", "2026-06-21T21:55:00", "electric-callboy"],
  ["SABATON",           "2026-06-21T23:30:00", "2026-06-22T01:00:00", "sabaton"],
]);

const sunNorth = mkStage("north", "NORTH STAGE", COLORS.north, "sun", [
  ["EVERGREY",    "2026-06-21T12:55:00", "2026-06-21T13:45:00", "evergrey"],
  ["EUROPE",      "2026-06-21T14:55:00", "2026-06-21T15:45:00", "europe"],
  ["FOREIGNER",   "2026-06-21T17:05:00", "2026-06-21T18:05:00", "foreigner"],
  ["ALICE COOPER","2026-06-21T19:25:00", "2026-06-21T20:35:00", "alice-cooper"],
  ["DEF LEPPARD", "2026-06-21T22:05:00", "2026-06-21T23:20:00", "def-leppard"],
]);

const sunMarquee = mkStage("marquee", "MARQUEE", COLORS.marquee, "sun", [
  ["KILLUS",       "2026-06-21T12:00:00", "2026-06-21T12:40:00", "killus"],
  ["GAEREA",       "2026-06-21T13:15:00", "2026-06-21T14:00:00", "gaerea"],
  ["DECAPITATED",  "2026-06-21T14:40:00", "2026-06-21T15:30:00", "decapitated"],
  ["VLTIMAS",      "2026-06-21T16:10:00", "2026-06-21T17:00:00", "vltimas"],
  ["KANONENFIEBER","2026-06-21T17:40:00", "2026-06-21T18:40:00", "kanonenfieber"],
  ["THE GATHERING","2026-06-21T19:20:00", "2026-06-21T20:10:00", "the-gathering"],
  ["VENOM",        "2026-06-21T20:50:00", "2026-06-21T21:50:00", "venom"],
  ["MASTODON",     "2026-06-21T22:35:00", "2026-06-21T23:50:00", "mastodon"],
]);

const sunJupiler = mkStage("jupiler", "JUPILER STAGE", COLORS.jupiler, "sun", [
  ["KUAZAR",        "2026-06-21T12:40:00", "2026-06-21T13:20:00", "kuazar"],
  ["KING 810",      "2026-06-21T14:00:00", "2026-06-21T14:45:00", "king-810"],
  ["WARGASM",       "2026-06-21T15:40:00", "2026-06-21T16:25:00", "wargasm"],
  ["SET IT OFF",    "2026-06-21T17:25:00", "2026-06-21T18:10:00", "set-it-off"],
  ["LAGWAGON",      "2026-06-21T19:10:00", "2026-06-21T20:00:00", "lagwagon"],
  ["BURY TOMORROW", "2026-06-21T21:00:00", "2026-06-21T21:50:00", "bury-tomorrow"],
  ["THE PLOT IN YOU","2026-06-21T23:00:00", "2026-06-22T00:00:00", "the-plot-in-you"],
]);

const sunDome = mkStage("dome", "METAL DOME", COLORS.dome, "sun", [
  ["RETURN TO DUST","2026-06-21T12:00:00", "2026-06-21T12:40:00", "return-to-dust"],
  ["ZETRA",         "2026-06-21T13:20:00", "2026-06-21T14:00:00", "zetra"],
  ["RAIN CITY DRIVE","2026-06-21T14:50:00", "2026-06-21T15:35:00", "rain-city-drive"],
  ["FUTURE PALACE", "2026-06-21T16:30:00", "2026-06-21T17:20:00", "future-palace"],
  ["PERIPHERY",     "2026-06-21T18:15:00", "2026-06-21T19:05:00", "periphery"],
  ["SÓLSTAFIR",     "2026-06-21T20:05:00", "2026-06-21T20:55:00", "solstafir"],
  ["CARPENTER BRUT","2026-06-21T21:55:00", "2026-06-21T22:55:00", "carpenter-brut"],
  ["DJ CARL",       "2026-06-22T01:00:00", "2026-06-22T04:45:00", "dj-carl"],
]);

const sunCafe = mkStage("cafe", "CLASSIC ROCK CAFÉ", COLORS.cafe, "sun", [
  ["AMÆZING SNÄKE","2026-06-21T14:00:00", "2026-06-21T14:45:00", "amaezing-snake"],
  ["AMÆZING SNÄKE","2026-06-21T15:15:00", "2026-06-21T16:00:00", "amaezing-snake"],
  ["AMÆZING SNÄKE","2026-06-21T16:30:00", "2026-06-21T17:15:00", "amaezing-snake"],
  ["DJ NATHACHELET","2026-06-22T00:00:00", "2026-06-22T02:00:00", "dj-nathachelet"],
  ["ROCK THE FOX",  "2026-06-22T02:00:00", "2026-06-22T04:00:00", "rock-the-fox"],
]);

// ── Export ─────────────────────────────────────────────────────────────────

export function buildGraspop2026Fixture(): Festival {
  return {
    id: "graspop-2026",
    name: "Graspop Metal Meeting 2026",
    website: "https://www.graspop.be",
    importedAt: new Date().toISOString(),
    days: [
      mkDay("thu", "Thursday", "2026-06-18", [thuSouth, thuNorth, thuMarquee, thuJupiler, thuDome, thuCafe]),
      mkDay("fri", "Friday",   "2026-06-19", [friSouth, friNorth, friMarquee, friJupiler, friDome, friCafe]),
      mkDay("sat", "Saturday", "2026-06-20", [satSouth, satNorth, satMarquee, satJupiler, satDome, satCafe]),
      mkDay("sun", "Sunday",   "2026-06-21", [sunSouth, sunNorth, sunMarquee, sunJupiler, sunDome, sunCafe]),
    ],
  };
}
