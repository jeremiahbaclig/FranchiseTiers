For the implementation plan, I’d explicitly instruct the coding AI to separate the reusable tournament logic, franchise configuration, character catalog, image resolution, and UI. I’d also have it validate the champion roster against Riot’s official champion directory rather than blindly trusting filenames or names.


For images, I recommend using Riot's official champion directory as the authoritative source: [League of Legends Champions](https://www.leagueoflegends.com/en-us/champions/). Riot also provides official champion data and image assets through [Data Dragon documentation](https://developer.riotgames.com/docs/lol).&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.leagueoflegends.com\&sz=32)

The implementation should not assume every character image URL can be constructed from its display name. Instead, it should resolve official image URLs into a catalog at build time, verify that they load, and use that catalog at runtime. This is more reliable than scraping Riot's page every time a user opens the app.

## 1. Implementation brief for your coding AI

The following is designed to be pasted into a coding agent such as Cursor, Claude Code, Copilot, or another AI that can inspect and modify a repository.

# Project Implementation Plan: Franchise Tier Tournament

## 1. Project objective

Build a lightweight, responsive web application where users rank characters from a selected franchise through repeated head-to-head image matchups.

The initial franchise is League of Legends. The architecture must support adding entirely different franchises in the future by supplying new character catalogs and image-source configurations, without modifying the core tournament engine.

The application should be client-side, with no user accounts, no required backend, and no advertising.

## 2. Technology stack

Use:

- React
- TypeScript
- Vite
- CSS or CSS modules for styling
- LocalStorage for session persistence
- Vitest for unit tests

Keep dependencies minimal. Do not introduce a backend, database, authentication, or external API requirement for the initial version.

## 3. Architecture requirements

Separate the project into the following logical modules:

### A. Franchise registry

Stores the available franchises and their configuration.

Each franchise should define:

- Stable franchise ID
- Display name
- Description
- Logo or optional cover image
- Character catalog
- Image source configuration

Initially, register only League of Legends.

The category-selection UI must be generated from the registry rather than hardcoded to League of Legends.

### B. Generic character catalog

Define a reusable character/item type independent of any specific franchise.

Each entry should include:

- Stable ID
- Display name
- Image URL
- Optional aliases
- Optional metadata

Do not store tournament wins, losses, elimination status, or favorite status directly in the permanent character catalog. Those belong to the current tournament session.

Use stable IDs for identity and display names for presentation.

### C. Image resolver

Create an image-source abstraction so future franchises can use different image providers or URL formats.

For League of Legends:

- Use [https://www.leagueoflegends.com/en-us/champions/](https://www.leagueoflegends.com/en-us/champions/) as the official reference directory.
- Validate the roster against Riot's official directory.
- Prefer official Riot-hosted champion imagery.
- Resolve and verify image URLs during development or a build-time preparation step.
- Store the resolved URLs in the static catalog.
- Do not scrape the official website on every application load.
- Do not assume image URLs can always be derived from display names.
- Include image loading states and a graceful fallback for missing images.

Use the champion's official identity or Riot's canonical champion key where available.

### D. Tournament engine

Implement the tournament as a pure TypeScript module with no dependency on React or browser APIs.

It must support:

- Initializing a tournament from a selected franchise catalog
- Generating eligible matchups
- Recording a winner
- Updating both characters' records
- Eliminating characters after two losses
- Tracking matchup history
- Undoing the previous selection
- Determining when the tournament is complete
- Producing final tiers and the undefeated group

The engine must be independently testable.

### E. User interface

Build these screens:

1. Franchise selection
2. Matchup screen
3. Tournament progress display
4. Final tier list
5. Optional ultimate-favorite selection
6. Restart and confirmation dialogs

The interface must work on desktop and mobile.

## 4. Tournament rules

Every character begins at 0 wins and 0 losses.

For each matchup:

- Present two characters with images and names.
- Hovering over a character highlights it and indicates that selecting it will advance that character.
- Clicking a character records the choice.
- Display a green check on the selected character and an X on the unselected character.
- The selected character receives one win.
- The unselected character receives one loss.
- Neither character can receive duplicate record updates for the same matchup.

Matchmaking:

- Pair characters against others with the same current win-loss record whenever possible.
- Winners and losers enter their corresponding record groups.
- Avoid repeated matchups whenever possible.
- Use a seeded random shuffle or another deterministic pairing strategy.
- Handle odd-sized groups using a documented bye policy.
- Make matchup ordering deterministic when given the same seed and initial roster.

Elimination:

- A character is eliminated immediately upon reaching two losses.
- Eliminated characters never appear in future matchups.
- Continue until no eligible matchups remain and all required tournament groups have been processed.

Important: Under this two-loss elimination rule, a character cannot finish 2-2. Do not implement a 2-2 state unless the elimination rules are deliberately changed.

Completion:

- Every non-eliminated character belongs in the undefeated group if its loss count is zero.
- All zero-loss characters share the highest tier.
- The user can optionally choose one of these characters as their ultimate favorite.
- Selecting a favorite does not change tournament records.

Do not assume that one champion must be the sole winner. Several champions may finish undefeated.

## 5. Tier assignment

Create a dedicated tier-generation function that converts completed tournament results into a color-coded tier list.

Requirements:

- Top tier: every champion with zero losses
- Bottom tier: every champion eliminated at two losses
- Intermediate tiers: organize remaining characters by their final records and relative tournament performance
- Use a color gradient from green through yellow and orange to red
- Ensure the two-loss eliminated tier is red
- Ensure tier membership is determined by data, not by the order in which cards were displayed
- Keep characters sharing the same tier together

The UI should display character images, names, and optionally their final win-loss records within each tier.

The tier-generation function must be separate from rendering so its rules can be tested and adjusted independently.

## 6. User interface behavior

Matchup screen:

- Two large image cards side by side on desktop
- Stacked or appropriately resized cards on mobile
- Clear character names
- Hover and keyboard-focus highlights
- Accessible button semantics
- Green check and X overlays after selection
- Brief transition before the next matchup
- Current matchup count and tournament progress
- Current character records available without obstructing the images

Provide undo and restart controls.

Undo must restore the exact previous tournament state, including records, elimination status, matchup queue, and progress.

Tier list:

- Display all characters exactly once
- Allow optional selection of an ultimate favorite from the undefeated tier
- Highlight the selected favorite
- Allow the favorite to be changed
- Provide a restart option
- Preserve the completed results when refreshing the page

## 7. Persistence

Use versioned LocalStorage data.

Persist:

- Selected franchise
- Tournament seed
- Character records
- Matchup history
- Current matchup state
- Tournament completion status
- Favorite selection

Validate persisted data before loading it. Handle malformed or outdated saved data gracefully.

Provide a way to start a fresh tournament and confirm before discarding progress.

Do not store temporary tournament state in the permanent character catalog.

## 8. Initial League of Legends catalog

Include every character in the roster supplied below.

Use canonical IDs and names from Riot's official data wherever possible. Preserve readable display names, including punctuation and spaces.

Roster corrections:
- Validate every entry against Riot's current official roster rather than silently removing unfamiliar entries.

The official reference is:\
[https://www.leagueoflegends.com/en-us/champions/](https://www.leagueoflegends.com/en-us/champions/)

## 9. Quality requirements

Write automated tests for:

- Initial records
- Win/loss updates
- Elimination at two losses
- Prevention of duplicate record updates
- Odd-sized groups and byes
- Avoiding repeated matchups when possible
- Tournament completion
- Undefeated top tier
- Eliminated bottom tier
- Tier membership and unique character placement
- Undo and restart
- Persistence and recovery from invalid saved state
- Stable results with the same seed

Add development assertions to ensure:

- Every catalog character appears in the tournament exactly once
- Every completed matchup has exactly one winner and one loser
- A matchup increments one win and one loss
- No eliminated character is selected again
- Every character appears exactly once in the final tier list

## 10. Implementation sequence

Phase 1: Inspect the repository and report the existing structure. Preserve any working code and configuration.

Phase 2: Define the generic franchise, catalog, and tournament types.

Phase 3: Build and validate the complete League of Legends character catalog and official image manifest.

Phase 4: Implement the pure tournament engine and unit tests before building the UI.

Phase 5: Build the category-selection and matchup interfaces.

Phase 6: Implement persistence, undo, restart, and error handling.

Phase 7: Build the final tier list and favorite-selection flow.

Phase 8: Run automated tests, type checking, and a production build. Fix failures before declaring completion.

Phase 9: Document how to add another franchise by creating its catalog and image configuration.

## 11. Coding-agent workflow

Before making changes:

- Inspect the repository.
- Identify existing conventions and reusable components.
- Propose a concise implementation plan.
- Identify any ambiguous tournament rules.
- Avoid unnecessary dependencies or a full rewrite.

Then implement in small, verifiable phases.

Do not stop after generating a plan or scaffolding. Implement the requested application, run tests, fix issues, and provide a summary of files changed and remaining limitations.

Do not claim that images, tests, or build steps succeeded unless they were actually verified.

## 2. Complete initial champion roster

Use this as the required roster for the AI's catalog-generation step. The official directory currently includes names such as Locke and Zaahen, so the AI should not reject unfamiliar names simply because they are newer or less familiar.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.leagueoflegends.com\&sz=32)

### League of Legends roster

Provided catalog

Use the names below as the starting roster:

# 173 Entries

Aatrox
Ahri
Akali
Akshan
Alistar
Ambessa
Amumu
Anivia
Annie
Aphelios
Ashe
Aurelion Sol
Aurora
Azir
Bard
Bel'Veth
Blitzcrank
Brand
Braum
Briar
Caitlyn
Camille
Cassiopeia
Cho'Gath
Corki
Darius
Diana
Dr. Mundo
Draven
Ekko
Elise
Evelynn
Ezreal
Fiddlesticks
Fiora
Fizz
Galio
Gangplank
Garen
Gnar
Gragas
Graves
Gwen
Hecarim
Heimerdinger
Hwei
Illaoi
Irelia
Ivern
Janna
Jarvan IV
Jax
Jayce
Jhin
Jinx
Kai'Sa
Kalista
Karma
Karthus
Kassadin
Katarina
Kayle
Kayn
Kennen
Kha'Zix
Kindred
Kled
Kog'Maw
K'Sante
LeBlanc
Lee Sin
Leona
Lillia
Lissandra
Locke
Lucian
Lulu
Lux
Malphite
Malzahar
Maokai
Master Yi
Mel
Milio
Miss Fortune
Mordekaiser
Morgana
Naafiri
Nami
Nasus
Nautilus
Neeko
Nidalee
Nilah
Nocturne
Nunu & Willump
Olaf
Orianna
Ornn
Pantheon
Poppy
Pyke
Qiyana
Quinn
Rakan
Rammus
Rek'Sai
Rell
Renata Glasc
Renekton
Rengar
Riven
Rumble
Ryze
Samira
Sejuani
Senna
Seraphine
Sett
Shaco
Shen
Shyvana
Singed
Sion
Sivir
Skarner
Smolder
Sona
Soraka
Swain
Sylas
Syndra
Tahm Kench
Taliyah
Talon
Taric
Teemo
Thresh
Tristana
Trundle
Tryndamere
Twisted Fate
Twitch
Udyr
Urgot
Varus
Vayne
Veigar
Vel'Koz
Vex
Vi
Viego
Viktor
Vladimir
Volibear
Warwick
Wukong
Xayah
Xerath
Xin Zhao
Yasuo
Yone
Yorick
Yunara
Yuumi
Zaahen
Zac
Zed
Zeri
Ziggs
Zilean
Zoe
Zyra

## 3. Image sourcing recommendation

I would give the coding agent this priority order:

1. Official Riot image assets: Use Riot's documented static assets where they provide an appropriate character image. Data Dragon exposes champion data and associated images.&#x20;

   [image](https://www.google.com/s2/favicons?domain=https://developer.riotgames.com\&sz=32)


2. Official champion pages: Use the official directory and individual champion pages to validate names and identify suitable imagery.

3. Build-time image manifest: Save the verified image URLs against stable character IDs, so the app does not depend on live scraping.

4. Fallback behavior: Show a placeholder and a development warning if an image fails to load.

One distinction worth keeping: Riot's champion directory is the reference website, but it isn't necessarily a simple directory of predictable `.webp` image URLs. The implementation agent should inspect the actual page structure and official asset data before deciding how to resolve the images.

## 4. Two decisions I'd settle before implementation

- Tournament fairness: If a record group has an odd number of characters, the remaining character should be presented and the user can decide whether it should win or lose. 
- Tier granularity: Should the final tiers be strictly based on final records, or should the app create additional tiers within the same record based on the round in which characters were eliminated? I'd start with record-based tiers, with all undefeated characters together at the top and all two-loss characters together at the red bottom tier.

Those choices keep the first version predictable while leaving room to evolve the ranking model as you add franchises.
