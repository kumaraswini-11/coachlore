# 006: Accounts

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

A person signs in with Discord, sees what Coachlore holds about them,
downloads it, and deletes it. Leagues (007) need to know who someone is;
nothing else in the app does.

This is also the spec that brings the server and its database into being,
because sign-in is the first thing that needs them. Everything after it
builds on what this spec stands up.

## Where this comes from

The [project doc](../../project-doc.md): "Scope" (sign-in with Discord, for
identity only), "Privacy, security and running it" (collect as little as
possible; sign-in done properly; delete an account and what it holds), and
"It costs nothing to run while it's small". The defaults in
[the specs README](../README.md#defaults-for-the-owners-calls): no domain;
the free hosting account.

## Requirements

### 1. Signing in

1. Signing in uses Discord only. The person is sent to Discord, agrees, and
   comes back signed in, on the page they started from.
2. We ask Discord for the least it offers that identifies someone: their
   Discord ID, display name and avatar. No email address, no list of
   servers, no permission to post as them. (The sign-in library needs an
   email field; it holds a placeholder made from the Discord ID, never a
   real address, and goes with the account.)
3. The sign-in flow checks a `state` value on return, and uses PKCE, so a
   returning request that we didn't start is refused.
4. The redirect address is exact: the production address and the local
   development address, nothing else.
5. A session lives in a cookie that scripts can't read, sent only over
   HTTPS (except on `localhost`) and only with requests from our own
   site. The session is renewed when a person signs in, and ends when they
   sign out, when it expires, or when the account is deleted.
6. Sign-in works in every major browser, including Safari, without a
   domain of our own: the session cookie belongs to the web app's own
   address.
7. Signing out ends the session on the server, not only in the browser.

### 2. What we keep

1. A person's record holds their Discord ID, the name and avatar Discord
   gave us at their last sign-in, the language they chose (English or
   Hindi), and when the record was made and last used. Nothing else about
   them is stored by this spec.
2. Sessions are stored on the server, so one can be ended from there. A
   session records no IP address and no browser details.
3. Discord's tokens are used to read the profile at sign-in and are not
   kept: nothing in v1 calls Discord on a person's behalf.

### 3. `/me`

1.  Shows the person's avatar and name, "Signed in with Discord", and the
    leagues they belong to with their role in each (empty until 007).
2.  **Download my data** gives a JSON file of everything held about the
    person: their record, their sessions (without secrets), and their
    league memberships (from 007 on, and what later specs add).
3.  **Delete my account** asks for confirmation, saying what's removed and
    what stays (rule 3 below), then deletes the account and signs the
    person out everywhere.
4.  **Sign out**.

### 4. The server

1.  A server exists, reachable only through the web app's own address for
    HTTP (the browser never calls it directly), and directly only for the
    draft room's real-time connection (008).
2.  Requests that didn't come through the web app are refused. The health
    address (17) is the only direct HTTP exception, and its answer holds no
    account data.
3.  The server reports its health at a public address that says whether it
    and its database are up, and nothing else.
4.  The server issues a short-lived real-time ticket to a signed-in person,
    which the draft room (008) exchanges for its connection, since that
    connection can't carry the session cookie.
5.  The database is backed up off the machine every day, and a backup has
    been restored once, to prove it works, before any league uses the app.
6.  Errors on the server are reported without personal data, like the web
    app's (000).
7.  A person can't hammer sign-in or account changes: repeated requests
    from one address are slowed and then refused for a while.
8.  **Previews never reach the server.** Only production's web app knows the
    server's address and secret; a preview has neither, and its league and
    account screens show fixtures.
9.  **The server checks its settings when it starts** and refuses to start,
    naming the setting, if one is missing or wrong.
10. **A deploy doesn't break what's in progress.** On shutdown the server
    stops taking new requests, finishes the ones in flight and closes
    real-time connections so clients reconnect to the new version. A new
    version takes traffic only after its health check passes. The server
    reports whether a draft is live, and nobody deploys while one is.
11. **Database changes are safe.** Each change only adds or widens, so the
    running version keeps working while the new one starts; a backup is
    taken before any deploy that changes the database; a change that fails
    stops the new version with a clear message, and the running version
    keeps serving.
12. **Pages that show what people wrote run under a strict content policy:**
    signed-in pages allow only the scripts the server marked for that one
    response. The Dex's static pages keep the current policy.
13. **The machine is locked down:** its admin panel isn't open to the
    internet, signing in to it takes a key, security updates install
    themselves, and only the ports for SSH and the web are open.
14. **Backups are private** (a private bucket, a key that can reach only it),
    kept for 14 days, so deleted data leaves the backups within 14 days;
    `/legal` says so (spec 014).
15. **The secret between the web app and the server** is long and random,
    and can be changed without downtime: during a change, the server accepts
    the old and the new one.

### 5. Language

1.  **Language** on `/me`: English or Hindi
    ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)). At the first
    sign-in the account takes the language the person was browsing in;
    after that, the account's language wins: signing in on another browser
    opens the site in it, and changing it on `/me` changes it everywhere.
    Signed out, the choice lives in the browser only.
2.  Every word on `/sign-in` and `/me` comes from the dictionaries, in
    both languages; the person's name, as Discord gave it, is never
    translated.

## Rules and edge cases

1. **Signing in again** updates the name and avatar from Discord. The
   Discord ID never changes, and it's what identifies the person.
2. **A cancelled or failed sign-in** returns to `/sign-in` with "Sign-in
   didn't finish. Try again.", and no account is made.
3. **Deleting an account:**
   - The person's record, sessions and links to Discord are deleted.
   - In a league, their membership stays as "A former coach" with no link
     to them, so standings, rosters and results still add up (from 007 on).
   - **The only admin of a league** can't delete their account until they
     make someone else an admin or delete the league. The confirmation says
     which leagues, with links.
   - Deleting is final: there is no undo and no grace period.
4. **Deleted, then signs in again with the same Discord account:** a new,
   empty account. Old memberships aren't restored.
5. **A session for a deleted account** stops working on its next request.
6. **Expired session:** a page that needs sign-in sends the person to
   `/sign-in`, which brings them back afterwards.
7. **Pages that need sign-in** (`/me`, and every league page from 007) say
   so for signed-out visitors by sending them to `/sign-in`; the Dex never
   does.
8. **A real-time ticket** is valid for one minute, for one person, and can
   be used once. A client that reconnects asks for a new one.
9. **If the free DNS name is down,** the server is reachable by a second
   free name pointing at the same machine (set up with the first), and the
   web app's server address is switched to it; a domain, if one is bought,
   replaces both.

## Screens

The wireframes are in spec 001: [Sign in](../001-interface/spec.md#sign-in-sign-in)
and [Me](../001-interface/spec.md#me-me). This spec adds:

- **The top bar and sidebar** show the person's avatar when signed in,
  opening a menu with "Me" and "Sign out"; signed out, a "Sign in" button.
- **`/sign-in`** takes a `next` address to return to; only our own
  addresses are accepted there.
- **`/me`, deleting:** the confirmation lists what's deleted and what stays;
  for an only admin, it lists their leagues instead and offers no delete
  button.
- **`/me`, language:** a choice of English or हिन्दी (each written in its
  own language, so it can be found by someone who can't read the other),
  saved at once, with the page reloading in the new language.
- **States:** `/sign-in` has the failed state; `/me` has loading, error and
  the "only admin" state.

## Acceptance criteria

1. A person signs in with Discord on Chrome, Firefox and Safari (desktop
   and iPhone), using the production addresses, and lands back on the page
   they started from.
2. A sign-in callback with a missing or wrong `state` is refused, and no
   session is made.
3. The session cookie is `HttpOnly`, `Secure` and `SameSite=Lax` (or
   stricter) in production, and its name and contents give nothing away
   about the person.
4. After signing out, the old cookie no longer works on the server.
5. A request to the server's API that didn't come through the web app is
   refused with 403.
6. The data download contains every row the database holds about the
   person, and nothing about anyone else.
7. Deleting an account removes the person's record, sessions and Discord
   link; their league memberships become "A former coach"; an only admin
   is stopped, with their leagues named.
8. A real-time ticket older than a minute, or used twice, is refused.
9. The health address answers within a second while the database is up,
   and reports the database as down when it isn't.
10. A backup taken by the daily job is restored into an empty database and
    the server runs against it.
11. Twenty sign-in attempts in a minute from one address are refused after
    the limit, with a message saying when to try again.
12. `/sign-in` and `/me` pass Playwright with axe at 360 px and 1280 px in
    both themes, and work by keyboard.
13. A preview build has no server address or secret, and its `/me` shows
    fixtures.
14. The server refuses to start with a missing or malformed setting, naming
    it.
15. On a shutdown signal, a request in flight completes, new requests are
    refused, and an open real-time connection is closed so the client
    reconnects.
16. A stored session has no IP address or browser details, and a stored
    account has no Discord token, after sign-in.
17. `/me`'s content security policy has a per-response nonce for scripts and
    no `'unsafe-inline'` for them.
18. During a secret change, requests with either secret are accepted; after
    it, only the new one.
19. A deploy whose database change fails leaves the previous version serving
    (shown once on the VM, recorded in the pull request).
20. `/sign-in` and `/me` show every string in English and in Hindi, and
    pass axe in both languages and with `dir="rtl"`.
21. A language chosen on `/me` is stored on the account: signing in on a
    second browser opens the site in it.
22. The database and the sign-in library are each reached through one
    package only; a check in CI fails any other code that reaches them.

## Out of scope

- Signing in with anything but Discord; email or passwords.
- Profiles other people can see; avatars we host.
- Notifications and settings beyond the theme and the language (the theme
  stays in the browser, as in 001).
- Admin tools for the site as a whole.

## Changes

- 2026-10-21: written.
- 2026-10-21: the account's language (ADR 0007); the database and sign-in in packages of their own (ADR 0006).
- 2026-10-21: audit: previews kept off the server, settings checked at start, safe deploys and database changes, no IP or tokens kept, a strict content policy on signed-in pages, the machine locked down, private backups, secret rotation, a fallback name.
