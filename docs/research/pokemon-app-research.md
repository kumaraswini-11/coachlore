# A Pokémon web app: research and recommendation

> **A dated snapshot, not maintained.** This is the research that led to
> Draftboard, kept as it was written. Where it and a later document
> disagree, the later one wins: the [project doc](../project-doc.md), then
> the specs and decision records.

Research date: 20 October 2026. Every link was checked on that date; a page that
had gone links to its new address or a Wayback Machine copy.
YouTube links were checked against their own pages (title, channel, date,
length); none was watched in full. Reddit, Behance and some price sites
blocked automated access, so community opinion comes from forums, app-store
reviews and Reddit mirrors. **Secondhand** means a news or vendor report of
someone else's figure; **opinion** means a fan, forum or blog view.

---

## Contents

1. [The request](#1-the-request)
2. [The verdict, honestly](#2-the-verdict-honestly)
3. [Who the users are, and where](#3-who-the-users-are-and-where)
4. [What exists, and the gaps](#4-what-exists-and-the-gaps)
5. [Data sources and APIs](#5-data-sources-and-apis)
6. [The legal limits](#6-the-legal-limits)
7. [Product angles compared](#7-product-angles-compared)
8. [Recommended product](#8-recommended-product)
9. [Names](#9-names)
10. [The UI: principles, routes, pages, features](#10-the-ui-principles-routes-pages-features)
11. [Tech stack and architecture](#11-tech-stack-and-architecture)
12. [Roadmap](#12-roadmap)
13. [Setting up the new project](#13-setting-up-the-new-project)
14. [Tutorials and resources](#14-tutorials-and-resources)
15. [All sources](#15-all-sources)

---

## 1. The request

I want to make a Pokémon application. Find the resources, videos and other
material on the internet and YouTube that can give insight. Then set the
project's context, plan what we'll build, choose the application's name, and
decide how the working details are set (for example, only I commit), so the
project set-up saves time. Decide whether you give me a prompt to start in a
fresh folder and chat, or we create it from here.

Before that, do in-depth research on the project: its scope, how the UI should
look, which features to offer, which tech stack to use, how to make it
industry-standard, modern and helpful to people, in which part of the world
it's most popular, and which kinds of people use it. **Focus first on the
UI:** how many routes, what to show, user-friendliness, features.

If there's a better idea, or this won't bring better opportunities, say so.

---

## 2. The verdict, honestly

**A plain Pokédex is a weak portfolio project.** It's seen as a beginner rite
of passage: "every junior developer must prove that they can fetch Pikachu
from an API", and recruiters "have seen these projects before" (opinion,
[dev.to](https://dev.to/guilherme_galanti/stop-building-projects-that-exist-only-to-impress-other-beginners-nl8)).
The same source advises giving such a project "a specific user and purpose"
rather than dropping it.

**Pokémon can't be monetised, or published as an app.** The official terms
allow "personal, noncommercial home use only" and forbid ads
([pokemon.com terms](https://www.pokemon.com/us/legal/terms-of-use)).
PokémonDB's owner says apps get taken down from the app stores
([pokemondb.net/about](https://pokemondb.net/about)). So: a non-commercial
website, with no Stripe subscriptions. **If billing and payments are skills
you want to show, the invoicing project from the earlier research is the
better vehicle for them.**

**A Pokémon project with a sharp angle can still be excellent:**

- **It's fun, so you'll finish it.** Finishing matters more than the topic
  (section 7 of the earlier research, and the sources here).
- **The communities are real and reachable.** Draft leagues organise on
  Discord, and competitive players on Smogon and Showdown.
- **One angle has deep backend work and a real gap:** a draft league
  manager. Leagues still run on Google Sheets
  ([Smogon's beginner's guide to draft](https://www.smogon.com/articles/beginners-guide-draft)).
  It needs multi-tenant leagues, a live draft room, scheduling, a trade
  workflow, standings and a Discord bot, and it uses almost none of
  Pokémon's copyrighted images.

**Recommendation:** a polished Pokédex as the UI foundation, plus a **draft
league manager** as the backend core (section 8). Choose the invoicing
project instead if career value comes first and fun second.

---

## 3. Who the users are, and where

### The size of the audience

| Segment           | Figure                                                                                                                                | Source                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The franchise     | Secondhand: The Pokémon Company's fiscal 2026 sales about ¥531 bn (about $3.4 bn), up 29%                                             | [digitalcitizen](https://www.digitalcitizen.life/the-pokemon-company-posts-record-3-4-billion-in-fiscal-2026-sales/), [official figures page](https://corporate.pokemon.co.jp/en/aboutus/figures)                                                                             |
| Trading Card Game | Secondhand: about 10 bn cards printed in fiscal 2025/26, 85 bn+ in total, sold in 90 countries and regions in 16 languages            | [PokeGuardian](https://www.pokeguardian.com/3191786_pokemon-cards-continue-strong-sales-as-total-production-hits-85-billion), [ComicBook](https://comicbook.com/gaming/news/new-report-confirms-pokemon-tcg-massively-increased-production-in-2026-but-its-still-not-enough/) |
| TCG Pocket        | 200 M+ downloads (May 2026, secondhand)                                                                                               | [Nintendo Wire](https://nintendowire.com/news/2026/05/22/pokemon-tcg-pocket-tops-200-million-downloads-worldwide/)                                                                                                                                                            |
| Pokémon GO        | 20 M+ weekly active players (Scopely, March 2025), 190+ countries                                                                     | [Savvy Games](https://savvygames.com/news/scopely-to-acquire-niantics-games-business), [PocketGamer.biz](https://www.pocketgamer.biz/pokmon-go-has-20m-weekly-active-players-nearly-nine-years-after-its-global-launch)                                                       |
| Main-series games | Legends: Z-A sold 12.79 M by 31 December 2025; Generation 10, _Winds and Waves_, announced for Switch 2 in 2027                       | [RPG Site](https://www.rpgsite.net/news/20326-pokemon-legends-z-a-has-sold-1279-million-copies-as-of-march-31-2026), [GamesRadar](https://www.gamesradar.com/news/live/pokemon-presents-2026-everything-announced-pokemon-day)                                                |
| Competitive (VGC) | Moved to _Pokémon Champions_, released 8 April 2026 (mobile due later in 2026); 2025 Worlds drew about 2,500 competitors (secondhand) | [Nintendo Life](https://www.nintendolife.com/news/2026/03/pokemon-vgc-competitions-officially-transition-to-pokemon-champions), [KPBS](https://www.kpbs.org/news/2025/08/31/2025-pokemon-world-championships-show-how-competitive-the-game-still-is)                          |

### Where

- **The US and Japan spend the most.** Pokémon GO's lifetime revenue to
  2021: US 36.6%, Japan 32%, Germany 5.4%
  ([Sensor Tower](https://sensortower.com/blog/pokemon-go-five-billion-revenue)).
  TCG Pocket's revenue: Japan about 44%, US about 25% (secondhand,
  [WN Hub](https://wnhub.io/news/finance/item-47515)).
- **Downloads and searches spread wider.** TCG Pocket's downloads: US 29%,
  Brazil 10%, Japan 6% (secondhand,
  [MAF](https://web.archive.org/web/20260416112219/https://maf.ad/en/blog/pokemon-tcg-pocket-strategies-launch/)).
  Google Trends (2021) ranked Japan first, Peru and Chile close behind
  ([ComicBook](https://comicbook.com/anime/news/pokemon-anniversary-google-trends-history-data/?nb=1)).
- **India is a growth market:** an India marketing office since 2023, and
  Pokémon GO in Hindi
  ([Pokémon corporate](https://corporate.pokemon.co.jp/en/topics/detail/t-30/),
  [DT Next](https://www.dtnext.in/news/business/aim-to-grow-pokemon-go-game-users-in-india-10x-in-3-yrs-top-exec-738098)).
- **No official revenue split by region was found.**

**What it means for the build:** English first; Japanese and Spanish /
Portuguese as the next languages.

### Kinds of users

| Who                               | What they need                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| Casual fans and kids              | A fast, pretty Pokédex; "what's this Pokémon weak to?"                                 |
| Main-series players               | Where to catch it in my game version; evolution methods; a team that covers weaknesses |
| Completionists                    | Living-dex and shiny-hunt tracking across games                                        |
| Competitive players (VGC, Smogon) | Team building, damage calculation, usage statistics, the current meta                  |
| Draft leagues (on Discord)        | Running a league: draft, schedule, trades, standings, replays                          |
| TCG collectors                    | Collection value, variants, price history                                              |
| TCG Pocket players                | Deck building, trades, pack history                                                    |

---

## 4. What exists, and the gaps

| Tool                                       | Strengths                                                                          | Gaps and complaints                                                                                                                                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PokémonDB](https://pokemondb.net)         | About 29.6 M visits a month (Semrush); dense, ordered pages; one person, light ads | No app ("Nintendo/TPCi gets them taken down from all app stores"); new-game data lags ([report](https://pokemondb.net/pokebase/meta/55591/report-minor-site-errors-here?show=84528))                                                                                             |
| Serebii, Bulbapedia                        | Serebii: fastest news; Bulbapedia: depth                                           | Ads that follow you, heavy pages (opinion, [ResetERA](https://www.resetera.com/threads/so-whats-the-deal-with-bulbapedia-huh.272250/)); hard navigation, weak mobile (opinion, [Bulbagarden](https://bulbagarden.net/threads/suggestions-ideas-and-problems.39604/post-1070581)) |
| Pokémon Showdown, its calculator           | The standard battle simulator; added Champions formats in April 2026               | Team building on mobile called near unplayable (opinion, [Smogon](https://www.smogon.com/forums/threads/suggestions.3469608/post-4524618))                                                                                                                                       |
| [Pikalytics](https://www.pikalytics.com)   | Usage, win rates, cores, speed tiers, Champions damage calc, team builder          | Strong; a newcomer needs a sharp niche                                                                                                                                                                                                                                           |
| [Limitless TCG](https://limitlesstcg.com/) | Tournaments, deck rankings, cards, deck builder, Pocket, VGC                       | Supported by ads, Patreon, affiliate links                                                                                                                                                                                                                                       |
| [PvPoke](https://pvpoke.com/)              | Pokémon GO PvP simulation and rankings; open source                                | Dominant in its niche                                                                                                                                                                                                                                                            |
| [Collectr](https://www.getcollectr.com)    | Card portfolio value, scanning, price history                                      | Inaccurate prices and missing variants reported (opinion, [reviews](https://justuseapp.com/en/app/1603892248/collectr-tcg-collector-app/reviews), [PokeBeach](https://pokebeach.com/forums/threads/collection-tracking-apps-seeking-recommendations.154348/))                    |
| Pokémon HOME, trackers                     | Official storage                                                                   | Living-dex tracking lives in third-party tools and spreadsheets, often without sync ([PokedexTracker](https://pokedextracker.com/blog/pokemon-home-national-dex-support))                                                                                                        |
| Draft leagues                              | —                                                                                  | **Run on Google Sheets and Discord** ([Smogon](https://www.smogon.com/articles/beginners-guide-draft))                                                                                                                                                                           |

**The ten most-reported user complaints and requests:**

1. Ads that cover content
   ([ResetERA](https://www.resetera.com/threads/so-whats-the-deal-with-bulbapedia-huh.272250/),
   [Pokellector reviews](https://justuseapp.com/en/app/600580227/pokellector-card-collector/reviews)).
2. Heavy, slow pages (same thread).
3. Poor mobile experience in competitive tools
   ([Smogon](https://www.smogon.com/forums/threads/suggestions.3469608/post-4524618)).
4. Stale data for new games
   ([case study](https://dhdesigner.myportfolio.com/ultimate-pokedex-1)).
5. Where to catch it, by version, with exclusives marked
   ([PokéBase](https://pokemondb.net/pokebase/meta/51357/pokemon-version-exclusive-games-section-pokemons-profile?show=51368)).
6. Team weakness and coverage checkers: many standalone tools, a sign of
   demand ([PokeSynergy](https://pokesynergy.app/weakness-checker)).
7. Living-dex and shiny trackers ([PokéPC](https://pokepc.net),
   [PokeTools](https://www.poketools.com/shiny-tracker)).
8. Card variants that can't be tracked; wrong prices (the reviews above).
9. Small UX requests: a tappable evolution chain, regional forms, easy team
   swaps, a damage calculator
   ([PikaDex reviews](https://apps.apple.com/us/app/-/id1509561856)).
10. Offline use, without ads
    ([Pokéos](https://apps.apple.com/us/app/-/id6742274418)).

---

## 5. Data sources and APIs

| Source                                                           | Facts                                                                                                                                                                                            | Use it for                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [PokéAPI (REST)](https://pokeapi.co/docs/v2)                     | Free, no sign-in, no rate limit since 2018 (static files); fair use: "Locally cache resources", or risk a permanent IP ban; data from Veekun plus scraped Gen 8–9                                | Species, moves, abilities, types, evolutions, encounters: **mirror it into your own database** |
| [PokéAPI (GraphQL)](https://pokeapi.co/docs/graphql)             | Beta, `graphql.pokeapi.co/v1beta2`, 100 calls an hour per IP, restarts daily                                                                                                                     | Exploring only, not production                                                                 |
| PokéAPI's new-game data                                          | Z-A issues closed January and September 2026; a Z-A evolution bug still open on 15 October 2026 ([issues](https://github.com/PokeAPI/pokeapi/issues?q=is%3Aissue+legends+z-a))                   | Expect months of lag; fill gaps by hand                                                        |
| [Smogon usage stats](https://www.smogon.com/stats/)              | Monthly folders, for example `gen9championsuu-1500.json` ([2026-08](https://www.smogon.com/stats/2026-08/chaos/))                                                                                | Meta usage, monthly ingestion                                                                  |
| [@smogon/calc](https://github.com/smogon/damage-calc)            | MIT licence, all generations, the engine behind Showdown's calculator; Champions not mentioned in its README                                                                                     | Damage calculation                                                                             |
| [TCGdex](https://tcgdex.dev/)                                    | Free, open source, no key, GraphQL and SDKs, 10+ languages, Cardmarket and TCGplayer prices per card ([prices](https://tcgdex.dev/markets-prices))                                               | Card data, if cards are in scope                                                               |
| [pokemontcg.io](https://docs.pokemontcg.io/)                     | **Deprecated:** no new sign-ups; existing keys work until 1 March 2027; successor [Scrydex](https://scrydex.com/faq) is paid                                                                     | Avoid                                                                                          |
| [TCGplayer API](https://docs.tcgplayer.com/docs/getting-started) | "We are no longer granting new API access."                                                                                                                                                      | Not available                                                                                  |
| [PokéAPI sprites](https://github.com/PokeAPI/sprites)            | Repository under CC0, but "All image contents within are Copyright The Pokémon Company"; some sprites fan-made ([licence](https://raw.githubusercontent.com/PokeAPI/sprites/master/LICENCE.txt)) | Use small sprites sparingly, with credits; treat them as copyrighted                           |
| Languages                                                        | PokéAPI has 14 language codes, including ja, ko, zh-hans, zh-hant, fr, de, es, es-419, it, pt-br ([list](https://pokeapi.co/api/v2/language/))                                                   | Names in many languages from day one                                                           |

---

## 6. The legal limits

- **The official terms:** "personal, noncommercial home use only"; no
  derivative works, no implied association, no ads; permission requests are
  declined ([terms](https://www.pokemon.com/us/legal/terms-of-use)).
- **How enforcement works (secondhand):** a former Pokémon chief legal
  officer says the company acts once projects are funded or making money;
  "No one likes suing fans"
  ([GoNintendo](https://gonintendo.com/contents/33147-former-pokemon-lawyer-explains-how-the-company-handled-fan-projects)).
- **Known takedowns:** hundreds of fan games on Relic Castle (2024,
  [GGRecon](https://ggrecon.com/articles/hundreds-of-fan-made-pokemon-games-have-reportedly-been-culled),
  [Techdirt](https://www.techdirt.com/2024/03/28/site-that-listed-information-about-3rd-party-pokemon-fan-games-shuts-down-under-threat));
  the Prism ROM hack
  ([Vice](https://www.vice.com/en/article/nintendo-shuts-down-pokemon-prism-rom-hack-after-eight-years-of-development/));
  Pokémon GO map sites that scraped servers
  ([TechCrunch](https://techcrunch.com/2016/08/01/third-party-pokemon-go-tracking-services-get-shut-down/)).
  These targeted games and scraping, not data tools.
- **What fan sites do:** credit the owners ("Pokémon images & names ©
  Nintendo/Game Freak", PokémonDB); disclaim any affiliation (PvPoke,
  PokeBeach); stay open source. Many run ads or Patreon: tolerated, not
  permitted.

**The rules for this project:**

1. A website, not an app-store app.
2. No ads, subscriptions or paid tiers.
3. No fundraising, and don't seek press coverage.
4. A clear "not affiliated with Nintendo, Creatures, Game Freak or The
   Pokémon Company" disclaimer and copyright credits.
5. Don't scrape game servers.
6. Use as few official images as possible: small sprites with credits, your
   own icons and illustrations for everything else.
7. Keep "Pokémon" out of the product's name and logo (section 9).
8. Open source, MIT licence for your own code.

---

## 7. Product angles compared

Effort assumes one developer, part time (an estimate).

| Angle                                    | Who it's for          | Backend depth                                                                                                           | Real users                             | Competition                   | Legal risk                                     | Effort                   |
| ---------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------- | ---------------------------------------------- | ------------------------ |
| Plain Pokédex                            | Casual fans           | Low                                                                                                                     | Few (well served)                      | Very crowded                  | Medium (images)                                | 2–4 weeks                |
| **Draft league manager**                 | Discord draft leagues | **Very high:** multi-tenant leagues, live draft room, scheduling, trade state machine, standings, Discord bot, webhooks | **Reachable:** leagues still on Sheets | **Weak**                      | **Low:** almost no official images             | 8–12 weeks               |
| VGC / Champions team builder + meta      | Competitive players   | High: monthly stats ingestion, damage calculation, matchup analysis, sharing                                            | Yes                                    | Strong (Pikalytics, Showdown) | Low                                            | 6–10 weeks               |
| TCG collection and price tracker         | Collectors            | High: price ingestion, time series, alerts                                                                              | Yes                                    | Very strong (Collectr)        | Medium: price data paid or closed; card images | 8–12 weeks               |
| Living-dex / shiny tracker with sync     | Completionists        | Medium: sync, offline-first, conflicts                                                                                  | Yes                                    | Crowded and free              | Low–medium                                     | 4–6 weeks                |
| TCG Pocket deck builder + trade matching | Pocket players        | Medium–high: matching engine                                                                                            | Yes                                    | Existing apps                 | Medium: no official data                       | 6–8 weeks                |
| Pokémon GO PvP tools                     | GO players            | High: simulation                                                                                                        | Yes                                    | PvPoke dominates              | Medium                                         | 6–10 weeks               |
| AI assistant grounded in data            | Everyone              | Medium–high: tool calling, evals, cost control                                                                          | Maybe                                  | Emerging                      | Low–medium                                     | 4–6 weeks (as an add-on) |

**Best two:** the draft league manager (the deepest backend and a clear gap)
and the team builder with meta analysis (a ready calculation engine, low
risk, but needs a sharp niche against Pikalytics).

**Alternatives, if Pokémon feels too junior:** the same "fan data" fun with
more professional relevance comes from sports stats and fantasy leagues,
price tracking across all trading-card games, or a companion app for a game
with an official API. A draft league manager also reads well on a CV as "a
multi-tenant league platform with a Discord integration".

---

## 8. Recommended product

**One website, two layers:**

1. **The Dex (the UI showcase):** a fast, clean, ad-free Pokédex: search in
   many languages, type chart, team weakness and coverage checker, game
   filter, offline support. It answers the top complaints (ads, slow pages,
   weak mobile, version exclusives).
2. **Leagues (the backend core):** everything a Discord draft league needs:
   - create a league, invite coaches, set rules and the point-based tier
     list;
   - run a **live draft room** (snake order, a timer, picks in real time);
   - weekly schedule and match reporting (with Showdown replay links);
   - **trades** between coaches, with approval and limits;
   - standings and stats (kills, wins, differential);
   - a **Discord bot** posting picks, results and reminders.

**Why this combination:** the Dex gives the polished UI and the everyday
audience; Leagues gives the heavy backend and real users who'll ask for
features.

**Scope boundaries for v1:** no cards (TCG), no Pokémon GO, no battle
simulation (link to Showdown), no payments, no mobile app.

**What a reviewer will see:**

- a multi-tenant domain with real rules;
- real-time collaboration with fairness under concurrency (two coaches can't
  take the same pick);
- event-driven integrations (the Discord bot, webhooks);
- data pipelines (a PokéAPI mirror, monthly Smogon stats);
- a polished, accessible, fast UI, used by real people.

---

## 9. Names

**Rules:** no "Poké", "Pokémon" or "Pokédex" in the name or logo (they're
trademarks); avoid region and character names (Kanto, Pikachu). Check the
domain and GitHub name before choosing. Availability wasn't checked here.

| Name             | Feel                               |
| ---------------- | ---------------------------------- |
| **Draftboard**   | Plain: says what it does           |
| **Snakedraft**   | The draft format itself            |
| **Leaguewright** | A league-maker                     |
| **Tierlist**     | The heart of every draft league    |
| **Typecast**     | A play on types; fits the Dex side |
| **Metagame**     | Fits competitive play              |

**Recommended:** _Draftboard_ for the product, with "Dex" as a section name
(the word _dex_ alone is generic; _Pokédex_ isn't).

---

## 10. The UI: principles, routes, pages, features

### Principles

- **Fast and calm:** no ads, no layout shift, instant search; a virtualised
  grid for 1,025+ species; fixed-size, lazily loaded images.
- **Mobile-first:** the top complaint about competitive tools.
- **Accessible:** WCAG 2.2 AA.
  - Type colours: pick the text colour per type (white on Electric yellow
    `#F7D02C` is about 1.5:1, which fails; black is about 14:1), and always
    print the type's name, never colour alone
    ([WCAG 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)).
  - Keyboard: a list of links in normal tab order, or the
    [APG grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).
  - Search: the [APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
    with the result count announced.
- **Light and dark themes;** motion that respects `prefers-reduced-motion`
  (holo and tilt effects need a still fallback).
- **Multilingual names** (14 languages in PokéAPI); room for longer German
  and French text, and CJK fonts.
- **Works offline** for the Dex (a PWA), as
  [pokedex.org](https://pokedex.org) showed.

### Design references

| Reference                                                                                                                                         | The idea to take                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Saepul Nahwan's Pokédex concept](https://dribbble.com/shots/6545819-Pokedex-App) ([built in Flutter](https://github.com/hungps/flutter_pokedex)) | Type-coloured grid; About / Base Stats / Evolution tabs             |
| [skydoves/Pokedex](https://github.com/skydoves/Pokedex)                                                                                           | List-to-detail transitions; colours drawn from the artwork          |
| [pokedex.org](https://pokedex.org)                                                                                                                | Offline, web workers, lighter animation on weak devices             |
| [pokemon-cards-css](https://poke-holo.simey.me)                                                                                                   | Holofoil effect for featured cards (add reduced motion)             |
| [PKMN.help](https://www.pkmn.help)                                                                                                                | Type matchups, coverage, team planning, translations                |
| [Official Pokédex](https://www.pokemon.com/us/pokedex)                                                                                            | Filters: type, weakness, ability, size, number range, "Surprise me" |
| [PokémonDB](https://pokemondb.net/pokedex/pikachu)                                                                                                | The best single-page anatomy                                        |
| [Pikalytics](https://www.pikalytics.com)                                                                                                          | Usage, items, moves, cores, speed tiers                             |
| [PokéPC](https://pokepc.net)                                                                                                                      | Living-dex boxes with drag and drop                                 |
| [PvPoke](https://pvpoke.com)                                                                                                                      | Team builder showing threats and suggestions                        |

### Routes (21 in v1, plus later ones)

**The Dex (public):**

| Route                                  | Purpose                                         | Key components                                                               | Phase |
| -------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- | ----- |
| `/`                                    | Home: search, featured leagues, recently viewed | Combobox search, cards                                                       | v1    |
| `/dex`                                 | Browse and filter (`?game=`, `?type=`, `?gen=`) | Virtual grid, filter sheet (type, weakness, generation, ability, size), sort | v1    |
| `/dex/:species`                        | Detail (`?form=`)                               | Section below                                                                | v1    |
| `/types`                               | Type chart, single and dual                     | 18×18 matrix, dual-type calculator                                           | v1    |
| `/moves`, `/moves/:move`               | Move list and detail                            | Sortable table, learners                                                     | v1    |
| `/abilities/:ability`                  | Ability detail                                  | Effect, holders                                                              | v1    |
| `/games/:game`                         | One game's regional dex and exclusives          | Filtered grid                                                                | v1    |
| `/team-check`                          | Team weakness and coverage checker              | Six slots, matrix, Showdown import/export                                    | v1    |
| `/compare`                             | Side-by-side                                    | Stat overlay, matchups                                                       | Later |
| `/items/:item`, `/locations/:location` | Items and encounters                            | Tables by version and method                                                 | Later |
| `/calc`                                | Damage calculator                               | Attacker/defender panels (@smogon/calc)                                      | Later |

**Leagues (signed in with Discord):**

| Route                     | Purpose                           | Key components                                         | Phase |
| ------------------------- | --------------------------------- | ------------------------------------------------------ | ----- |
| `/leagues`                | Discover and my leagues           | Cards, filters                                         | v1    |
| `/leagues/new`            | Create a league                   | A multi-step form: format, rules, dates, roles         | v1    |
| `/l/:league`              | League home                       | Standings, next matches, news                          | v1    |
| `/l/:league/tiers`        | The point-based tier list         | Editable table, import from a template                 | v1    |
| `/l/:league/draft`        | **The live draft room**           | Order, timer, available pool, picks streaming in, chat | v1    |
| `/l/:league/teams/:coach` | A coach's roster                  | Roster, points, stats                                  | v1    |
| `/l/:league/schedule`     | Weeks and matches                 | Fixtures, report results, replay links                 | v1    |
| `/l/:league/trades`       | Propose, accept, approve trades   | A trade builder, history                               | v1    |
| `/l/:league/stats`        | Kill leaders, records             | Tables, charts                                         | v1    |
| `/l/:league/settings`     | Admin                             | Coaches, roles, rules, Discord channel link            | v1    |
| `/me`                     | Profile, leagues, notifications   |                                                        | v1    |
| `/about`, `/legal`        | About, credits and the disclaimer |                                                        | v1    |

### The Dex detail page, in order

1. **Header:** artwork, number, name, types, a form/regional switcher, a
   shiny toggle, a cry button.
2. **Base stats:** bars with the total.
3. **Type defences:** a weakness grid.
4. **Abilities,** hidden ones marked.
5. **Evolution chain:** each step tappable, with its method.
6. **Where to find it,** by game and version, exclusives marked.
7. **Moves,** filtered by game and method.
8. **Pokédex entries,** by game.
9. **Training and breeding.**
10. **Sprites.**
11. **Names in other languages.**
12. **Competitive snapshot:** usage %, common moves, items and partners, from
    the monthly Smogon stats (links to Leagues: "drafted in 34 leagues").

### Features

| Area     | v1                                                                                                           | Later                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Dex      | Search in 14 languages, filters, detail page, type chart, team checker, game filter, offline, light and dark | Compare, damage calculator, living-dex tracker                                                    |
| Leagues  | Create, invite, tiers, live draft, schedule, results, trades, standings, stats, Discord bot                  | Playoffs, multiple seasons, transfer windows, auction drafts, public league pages, replay parsing |
| Platform | Discord sign-in, notifications, audit log, admin tools                                                       | Public API, an AI assistant over league and meta data                                             |

---

## 11. Tech stack and architecture

Following the earlier research ("every layer is a choice"):

| Layer                | Choice                                                                                                            | Why                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Frontend             | Next.js, TanStack Query, Zustand, shadcn/ui, Tailwind; a PWA for the Dex                                          | Server-rendered pages for SEO; client data for the draft room                                                         |
| API                  | **Fastify** (or Express 5), Node.js 24 LTS, TypeScript                                                            | Schema validation and OpenAPI built in                                                                                |
| Real-time            | **WebSockets** (Socket.IO with the Redis adapter) for the draft room                                              | Picks must appear for everyone instantly                                                                              |
| Database             | **PostgreSQL** (Drizzle) for leagues, drafts, trades and standings                                                | Relational data and constraints: one pick per Pokémon per league, enforced by a unique index; transactions for trades |
| Dex data             | PokéAPI mirrored into your database (or static JSON at build)                                                     | Fair use; fast; fill new-game gaps by hand                                                                            |
| Cache, queues, locks | **Redis**: BullMQ jobs, draft timers, rate limits, pub/sub                                                        | One service, many jobs                                                                                                |
| Jobs                 | BullMQ worker: the nightly PokéAPI sync, the monthly Smogon stats, reminders, Discord posts                       | Needs a running process                                                                                               |
| Discord              | A `discord.js` bot as its own app; Discord sign-in (OAuth 2)                                                      | Leagues live on Discord                                                                                               |
| Auth                 | Discord sign-in and sessions, built by hand                                                                       | The backend showcase                                                                                                  |
| Hosting              | Frontend on **Vercel**; API, worker, bot, PostgreSQL and Redis on a **VPS with Coolify** (or Neon for PostgreSQL) | WebSockets and workers need running processes                                                                         |
| Quality              | Turborepo, Vitest, Supertest, Testcontainers, Playwright, k6, OpenTelemetry, Sentry, GitHub Actions, CodeRabbit   | As in the earlier research                                                                                            |

```text
apps/
  web/        Next.js: the Dex and Leagues UI
  api/        Fastify: REST + WebSocket gateway for the draft room
  worker/     BullMQ: data sync, stats ingestion, reminders, notifications
  bot/        discord.js: slash commands, posts picks and results
packages/
  schemas/    Zod schemas shared by every app
  domain/     league rules: draft order, points, trade validation, standings
  dex/        the Pokémon data model and import scripts
  config/     shared TypeScript, ESLint, Prettier settings
```

**Backend concepts this exercises** (from the earlier catalogue): a
multi-tenant domain, state machines (draft, trade, match), optimistic
concurrency and unique constraints (no double picks), real-time with pub/sub,
an outbox for Discord and webhook events, scheduled and retried jobs,
idempotent consumers, rate limits, an audit log, cursor pagination, OpenAPI,
integration and concurrency tests, load testing of the draft room,
observability.

---

## 12. Roadmap

**Core (weeks 1–8):**

- **Week 1:** monorepo, CI, the PokéAPI import into the database, both apps
  deployed, the `/about` and `/legal` pages.
- **Week 2:** the Dex: grid, filters, search in many languages, detail page.
- **Week 3:** type chart, team checker, game filter, PWA offline, accessibility
  pass.
- **Week 4:** Discord sign-in, leagues, invitations, roles, tier lists.
- **Weeks 5–6:** the live draft room: order, timer, picks over WebSockets, a
  concurrency test proving no double picks, reconnection.
- **Week 7:** schedule, match reporting, standings, stats.
- **Week 8:** trades (a state machine with approval), the Discord bot,
  observability, the write-ups.

**Advanced (weeks 9–12), one at a time:** the monthly Smogon stats pipeline and
the competitive snapshot; the damage calculator; a public API and webhooks
for leagues; a load test of the draft room with numbers; an AI assistant over
league and meta data.

**First users:** after week 6, invite one or two draft leagues from Smogon or
Discord to run a season. Their feedback is the best part of the README.

---

## 13. Setting up the new project

**Recommendation: a fresh repository with its own working rules** (only the
owner commits, decisions recorded, audit before commit, pull request text at
the end), written into its `AGENTS.md` on day one. Done: see
[AGENTS.md](../../AGENTS.md) and [the git workflow](../git-workflow.md).

**Order of the first session:**

1. Create the folder and the private GitHub repository on your personal
   account; set `user.name`, `user.email` and the push account in the
   repository's local git config before the first commit.
2. Write the project doc: what it is, who it's for, the rules (section 6),
   scope and out-of-scope.
3. Write `AGENTS.md`: the layout, the rules, "How work is done", and the
   checks to run before saying something is done.
4. Write `CONTEXT.md`: the glossary (coach, league, draft, pick, tier,
   points, trade, match, replay, season).
5. Write the first specs, in order, then build spec by spec.

---

## 14. Tutorials and resources

Few strong 2024–2026 Pokémon tutorials exist; none builds a team builder, a
TCG tracker or a multiplayer battle.

| Resource                                                                                                                                                                 | Channel · date · length                 | What it teaches                                                       | Backend depth           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------- | ----------------------- |
| [Build a FullStack Pokémon App with Next.js, Prisma, Auth0](https://www.youtube.com/watch?v=-oq0VOQz-2w) ([code](https://github.com/Maclinz/pokemon_yt_app))             | The Code Dealer · 19 Dec 2024 · 4:20:29 | Full-stack Next.js with auth and a database                           | Medium (the best found) |
| [Let's Build a PokeDex with Next.js 14 and Infinite Scrolling](https://www.youtube.com/watch?v=vB4xs2KXDqE) ([repo](https://github.com/DevAntonioRogers/next14-pokedex)) | Antonio · 28 Mar 2024 · 1:10:33         | Server Actions, infinite scroll, Framer Motion                        | Low                     |
| [Build Your Pokédex using ReactJS & PokeAPI](https://www.youtube.com/watch?v=h6-K2w2dHbM)                                                                                | TheProjectCode · 26 Mar 2024 · 41:10    | Routing, fetching, errors                                             | None                    |
| [Build a Pokémon World App with Nextjs 16](https://www.youtube.com/watch?v=uF0DFz6T2EE)                                                                                  | Code & Nice · 13 Dec 2025 · 18:03       | Server and Client Components                                          | None                    |
| [Build a Pokémon Game in JavaScript (p5.js)](https://www.youtube.com/watch?v=WPT2BmkFFyo)                                                                                | JSLegendDev · 16 Jan 2024 · 4:45:44     | Overworld and battle logic                                            | None                    |
| [TanStack Query Full Course 2026](https://www.youtube.com/watch?v=mqV5OvbyXcM)                                                                                           | PedroTech · 18 Mar 2026 · 41:29         | Caching, pagination, infinite queries, optimistic updates             | Client                  |
| [Create a custom Pokemon Showdown server](https://www.youtube.com/watch?v=61_fshmfj0o)                                                                                   | isleep2late · 25 Oct 2025 · 12:33       | Self-hosting Showdown, a bot                                          | Infrastructure          |
| [AI Agents that Play Pokémon Showdown](https://www.youtube.com/watch?v=8ZNadmh-Sy8) ([repo](https://github.com/MohamedMostafa259/pokemon-ai-agent))                      | Mohamed Mostafa · 30 Apr 2026 · 1:03    | LLM tool calling for moves                                            | Medium (repo)           |
| [I Built a Pokémon Card Analytics App](https://www.youtube.com/watch?v=DlUrPj8h-LE)                                                                                      | Avery Smith · 17 Sep 2025 · 16:18       | Card-market analytics, made with an AI agent                          | Low                     |
| [Online Multiplayer JavaScript Game Tutorial](https://www.youtube.com/watch?v=HXquxWtE5vA)                                                                               | Chris Courses · 7 Aug 2023 · 5:57:10    | Node.js multiplayer, syncing state (the best base for the draft room) | **High**                |

**From the earlier research, for the backend:** Harkirat Singh's
[Redis, WebSockets, Pub Subs and Message Queues Bootcamp](https://www.youtube.com/watch?v=IJkYipYNEtI)
(the draft room's real-time and queues), and Becodemy's
[Freelancing Marketplace](https://www.youtube.com/watch?v=j3uFl0P6JgM)
(event-driven design, real-time).

**Reference code:**
[pogo-web](https://github.com/PogoFrontier/pogo-web) (a battle simulator in
Next.js, Express and WebSocket),
[PvPoke](https://github.com/ElmorenohWTF/pvpoke) (open-source simulation),
[PorygonBot](https://github.com/PorygonBot/bot-ts) (a Discord bot tracking
Showdown battle stats in PostgreSQL),
[pokesprite](https://github.com/msikma/pokesprite) (a sprite database),
[@pkmn/dmg](https://github.com/pkmn/dmg) (the calculator's successor, work in
progress).

---

## 15. All sources

**Market:**
[Pokémon in Figures](https://corporate.pokemon.co.jp/en/aboutus/figures) ·
[fiscal 2026 sales](https://www.digitalcitizen.life/the-pokemon-company-posts-record-3-4-billion-in-fiscal-2026-sales/) ·
[TCG production](https://www.pokeguardian.com/3191786_pokemon-cards-continue-strong-sales-as-total-production-hits-85-billion) ·
[TCG 2026 report](https://comicbook.com/gaming/news/new-report-confirms-pokemon-tcg-massively-increased-production-in-2026-but-its-still-not-enough/) ·
[scalping](https://sac.media/2025/03/10/pokemon-card-scalping-is-ripping-apart-the-collecting-community/) ·
[TCG Pocket 200 M](https://nintendowire.com/news/2026/05/22/pokemon-tcg-pocket-tops-200-million-downloads-worldwide/) ·
[Scopely](https://savvygames.com/news/scopely-to-acquire-niantics-games-business) ·
[GO weekly players](https://www.pocketgamer.biz/pokmon-go-has-20m-weekly-active-players-nearly-nine-years-after-its-global-launch) ·
[Z-A first week](https://www.shacknews.com/article/146498/pokemon-legends-za-sells-5-8-million-units) ·
[Z-A to date](https://www.rpgsite.net/news/20326-pokemon-legends-z-a-has-sold-1279-million-copies-as-of-march-31-2026) ·
[Pokémon Presents 2026](https://www.gamesradar.com/news/live/pokemon-presents-2026-everything-announced-pokemon-day) ·
[VGC to Champions](https://www.nintendolife.com/news/2026/03/pokemon-vgc-competitions-officially-transition-to-pokemon-champions) ·
[Worlds 2025](https://www.kget.com/news/state-news/pokemon-world-championships-2025-delivers-record-breaking-action/amp/) ·
[Worlds competitors](https://www.kpbs.org/news/2025/08/31/2025-pokemon-world-championships-show-how-competitive-the-game-still-is) ·
[GO revenue by country](https://sensortower.com/blog/pokemon-go-five-billion-revenue) ·
[Pocket revenue](https://wnhub.io/news/finance/item-47515) ·
[Pocket earnings](https://mobilegamer.biz/pokemon-tcg-pocket-is-earning-over-3m-per-day-with-over-12m-banked-to-date/) ·
[Pocket downloads](https://web.archive.org/web/20260416112219/https://maf.ad/en/blog/pokemon-tcg-pocket-strategies-launch/) ·
[Google Trends](https://comicbook.com/anime/news/pokemon-anniversary-google-trends-history-data/?nb=1) ·
[India office](https://corporate.pokemon.co.jp/en/topics/detail/t-30/) ·
[GO India](https://www.dtnext.in/news/business/aim-to-grow-pokemon-go-game-users-in-india-10x-in-3-yrs-top-exec-738098)

**Existing tools and user needs:**
[PokémonDB about](https://pokemondb.net/about) ·
[Semrush](https://www.semrush.com/website/bulbagarden.net/competitors/) ·
[Bulbapedia thread](https://www.resetera.com/threads/so-whats-the-deal-with-bulbapedia-huh.272250/) ·
[Bulbagarden suggestions](https://bulbagarden.net/threads/suggestions-ideas-and-problems.39604/post-1070581) ·
[Serebii vs PokémonDB](https://pokemondb.net/pokebase/meta/4364/is-serebii-net-pokemondbs-rival?show=4402) ·
[Smogon suggestions](https://www.smogon.com/forums/threads/suggestions.3469608/post-4524618) ·
[Pikalytics calc](https://www.pikalytics.com/damage-calculator) ·
[Limitless TCG](https://limitlesstcg.com/) ·
[PvPoke](https://pvpoke.com/) ·
[Collectr](https://www.getcollectr.com) ·
[Collectr reviews](https://justuseapp.com/en/app/1603892248/collectr-tcg-collector-app/reviews) ·
[Pokellector reviews](https://justuseapp.com/en/app/600580227/pokellector-card-collector/reviews) ·
[PokeBeach trackers](https://pokebeach.com/forums/threads/collection-tracking-apps-seeking-recommendations.154348/) ·
[PokedexTracker](https://pokedextracker.com/blog/pokemon-home-national-dex-support) ·
[PokéPC](https://pokepc.net) ·
[PokeTools](https://www.poketools.com/trackers) ·
[PokeSynergy](https://pokesynergy.app/weakness-checker) ·
[PikaDex reviews](https://apps.apple.com/us/app/-/id1509561856) ·
[Pokéos](https://apps.apple.com/us/app/-/id6742274418) ·
[Ultimate Pokédex case study](https://dhdesigner.myportfolio.com/ultimate-pokedex-1) ·
[version exclusives request](https://pokemondb.net/pokebase/meta/51357/pokemon-version-exclusive-games-section-pokemons-profile?show=51368) ·
[TCG Pocket request (archived)](https://web.archive.org/web/20250530102958/https://www.reddit.com/r/PTCGP/comments/1kvuhc5/its_time_for_the_app_to_evolve/) ·
[Smogon draft guide](https://www.smogon.com/articles/beginners-guide-draft)

**Data:**
[PokéAPI docs](https://pokeapi.co/docs/v2) ·
[PokéAPI about](https://pokeapi.co/about) ·
[PokéAPI GraphQL](https://pokeapi.co/docs/graphql) ·
[PokéAPI Z-A issues](https://github.com/PokeAPI/pokeapi/issues?q=is%3Aissue+legends+z-a) ·
[PokéAPI languages](https://pokeapi.co/api/v2/language/) ·
[sprites](https://github.com/PokeAPI/sprites) ·
[sprites licence](https://raw.githubusercontent.com/PokeAPI/sprites/master/LICENCE.txt) ·
[Smogon stats](https://www.smogon.com/stats/) ·
[@smogon/calc](https://github.com/smogon/damage-calc) ·
[TCGdex](https://tcgdex.dev/) ·
[TCGdex prices](https://tcgdex.dev/markets-prices) ·
[pokemontcg.io](https://docs.pokemontcg.io/) ·
[Scrydex](https://scrydex.com/faq) ·
[TCGplayer API](https://docs.tcgplayer.com/docs/getting-started) ·
[TCG API alternatives (vendor)](https://cardgrader.ai/blog/tcgplayer-api-alternatives)

**Legal:**
[pokemon.com terms](https://www.pokemon.com/us/legal/terms-of-use) ·
[fan art licence (secondhand)](https://automaton-media.com/en/news/pokemon-sleep-dev-denies-copying-fanart-for-in-game-designs/) ·
[former lawyer](https://gonintendo.com/contents/33147-former-pokemon-lawyer-explains-how-the-company-handled-fan-projects) ·
[Relic Castle (GGRecon)](https://ggrecon.com/articles/hundreds-of-fan-made-pokemon-games-have-reportedly-been-culled) ·
[Relic Castle (Techdirt)](https://www.techdirt.com/2024/03/28/site-that-listed-information-about-3rd-party-pokemon-fan-games-shuts-down-under-threat) ·
[Prism](https://www.vice.com/en/article/nintendo-shuts-down-pokemon-prism-rom-hack-after-eight-years-of-development/) ·
[GO map sites](https://techcrunch.com/2016/08/01/third-party-pokemon-go-tracking-services-get-shut-down/) ·
[clone damages](https://automaton-media.com/en/?p=26168) ·
[PokeBeach](https://pokebeach.com)

**Design and UX:**
[Saepul Nahwan](https://dribbble.com/shots/6545819-Pokedex-App) ·
[flutter_pokedex](https://github.com/hungps/flutter_pokedex) ·
Junior Saraiva (Dribbble profile no longer online) ·
[skydoves/Pokedex](https://github.com/skydoves/Pokedex) ·
[pokedex.org](https://pokedex.org) ·
[pokemon-cards-css](https://poke-holo.simey.me) ·
[PKMN.help](https://www.pkmn.help) ·
[official Pokédex](https://www.pokemon.com/us/pokedex) ·
[PokémonDB Pikachu](https://pokemondb.net/pokedex/pikachu) ·
[WCAG 2.2 contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum) ·
[APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) ·
[APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) ·
[Core Web Vitals](https://web.dev/articles/vitals) ·
[pokesprite](https://github.com/msikma/pokesprite)

**Portfolio value (opinion):**
[dev.to: beginner projects](https://dev.to/guilherme_galanti/stop-building-projects-that-exist-only-to-impress-other-beginners-nl8) ·
[dev.to: projects that get you hired](https://dev.to/devraj_singh7/the-portfolio-projects-that-actually-get-you-hired-in-2026-1l0e) ·
[Arslan Ahmad](https://arslandg.substack.com/p/3-portfolio-projects-that-actually) ·
[freeCodeCamp review](https://forum.freecodecamp.org/t/portfolio-feedback-j-d/427314) ·
[Showdown AI policy](https://www.smogon.com/forums/threads/3789528/) ·
[VGC calc MCP server](https://glama.ai/mcp/servers/@jpbullalayao/pokemon-vgc-calc-mcp/inspect) ·
[Pikalytics AI](https://www.pikalytics.com/ai/team-usage)

**Tutorials:** every video link is in section 14.
