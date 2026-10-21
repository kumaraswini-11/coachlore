# 011: Discord bot

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

A league's channel on Discord hears about its draft, results, trades and
weeks without anyone copying them in, and each event is posted once, even
when a post is retried (with one rare exception, stated in requirement 4).

## Where this comes from

- [Project doc](../../project-doc.md): "Scope" ("A Discord bot that posts
  picks, results, trades and reminders"), "Anything the outside world hears
  about goes through a queue", "Failures are seen before users report
  them", "Collect as little as possible".
- [Glossary](../../../GLOSSARY.md): bot, league channel, admin, pick,
  result, trade, week.
- [Spec 001](../001-interface/spec.md#league-settings-lleaguesettings): the
  Discord section of League settings.

## Requirements

1. **Adding the bot.** League settings' Discord section gives admins a
   link that adds Coachlore's bot to a Discord server. Discord asks the
   person adding it for the server and the permissions; the bot asks only
   to see channels, send messages, embed links and read the channel's
   recent messages (so it can check for its own post before posting again).
2. **Linking a channel.** In the channel the league wants, an admin of the
   league types `/link` with the league's address (`/link kanto-cup`). The
   bot links the channel if the person typing is an admin of that league,
   recognised by the Discord account they sign in with, and can manage
   that channel in Discord; otherwise it answers, only to them, that only
   an admin of that league who manages the channel can link it. A league
   has at most one league channel; linking again moves it.
3. **What's posted:**

   | Event                              | Post                                                                                                                           |
   | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
   | The channel is linked              | "Kanto Cup's draft, results and trades will be posted here."                                                                   |
   | A draft's scheduled start nears    | A day and an hour before it (spec 008), with the time in the league's time zone                                                |
   | The draft starts                   | The draft order and the timer, with a link to the draft room                                                                   |
   | A coach is on the clock            | "{coach} is on the clock", mentioning only that coach, in drafts whose timer is 10 minutes or more; a coach can turn these off |
   | A pick (if the league posts picks) | "Round 3, pick 21: Misty drafted Kingambit (17 points)"; auto-picks say so                                                     |
   | The draft is complete              | Every roster with points used, and a link to the season                                                                        |
   | A week starts                      | The week's matches                                                                                                             |
   | A week has a day left              | The matches not yet confirmed                                                                                                  |
   | A result is confirmed              | The score and each battle's winner, with a link to the match                                                                   |
   | A trade completes                  | Who traded what, with the points                                                                                               |

4. **Once each.** Every post belongs to one event. If posting fails and is
   retried, or the same event is sent twice, the channel shows one post.
   The one exception: if Coachlore stops after Discord accepted a post and
   before recording it, and the retry comes when that post is no longer
   among the channel's 50 most recent messages, it can appear twice.
5. **Never in the way.** Nothing a coach does waits for Discord. A pick, a
   confirmed result or a trade is stored and shown on the site first; the
   post follows.
6. **Settings.** Admins see whether the league is linked, the channel's
   name, and whether posting works. They can turn pick posts off (on by
   default), send a test post, and unlink.
7. **When posting fails.** A post that fails for a passing reason (Discord
   busy, a rate limit, a network error) is retried. A post Discord refuses
   because the bot was removed, lost its permissions or the channel is gone
   isn't retried: the league's Discord section shows "Posting stopped:
   Coachlore can't post in #draft-league. Check the bot's permissions, then
   send a test post." Every post that fails for good is reported to the
   error service without personal data.
8. **No pings but one.** Posts never mention `@everyone`, `@here` or
   roles, whatever names people wrote (display names, the league's name).
   The one mention is "on the clock", and it can reach only the coach
   whose turn it is, and only if they haven't turned it off on their
   membership.
9. **Little data.** The bot keeps the league's server ID, channel ID and
   channel name, and the ID of each message it posted. It reads no
   messages.
10. **Times** are the league's: weeks start and end, and reminders fire, in
    the league's time zone (spec 007).
11. **What we hold is exportable and deletable.** Who linked the channel
    and a member's "on the clock" choice are in their data download (spec
    006); deleting the account removes them.
12. **In the league's language.** The bot posts, reminds and replies to
    slash commands in the league's language (spec 007); Pokémon, move and
    coach names are never translated, and times are in the league's time
    zone (ADR 0007).

## Rules and edge cases

- **A league that isn't linked** posts nothing and loses nothing: the
  site works the same.
- **Linked twice from two channels:** the later `/link` wins; the old
  channel gets nothing more.
- **`/link` from someone not an admin of that league, or a league that
  doesn't exist:** a private reply, "Only an admin of this league can link
  it" or "There's no league at kanto-cup", and no change. The reply never
  says whether a private league exists to someone outside it: both cases
  read "Only an admin of kanto-cup can link it here."
- **`/link` outside a server** (in a direct message): refused.
- **Unlinking** stops posts at once; posts already queued for that league
  are dropped. So does relinking to another channel: a post goes only to
  the channel the league was linked to when its event happened.
- **The bot removed from the server:** the next post is refused; the link
  is marked "Posting stopped" as above. Adding the bot back and sending a
  test post restores it.
- **A corrected result** (spec 009) posts again, as a correction: "Result
  corrected: …".
- **Many picks at once** (auto-picks after a pause): posts follow in pick
  order, at Discord's pace.
- **Deleted account** of the admin who linked: the link stays; the league
  owns it.
- **A change that rolls back** queues no post: each post's job is saved in
  the same transaction as its event.

## Screens

League settings, Discord section ([spec 001](../001-interface/spec.md#league-settings-lleaguesettings)):

```text
360 (not linked)                 1024 (linked)
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Discord                      │ │ Discord                                     │
│ 1. Add Coachlore's bot to    │ │ Posting to #draft-league ✓ working          │
│    your Discord server.      │ │ [✓] Post each pick                          │
│    [ Add to Discord ↗ ]      │ │ [ Send a test post ]   [ Unlink ]           │
│ 2. In the channel you want,  │ │                                             │
│    type:                     │ │                                             │
│    /link kanto-cup  [Copy]   │ │                                             │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- **States:** not linked; linked and working; posting stopped (an Alert
  with the reason and "Send a test post"); a test post sent ("Sent. Check
  #draft-league."); not an admin (no permission).
- **Components:** Card, Button, Kbd (the command), Switch, Alert, Alert
  Dialog (unlink), Sonner.
- **Accessibility:** the external link says it opens Discord; the copy
  button announces "Copied"; the status is words, not only an icon.

## Acceptance criteria

1. The install link adds the bot with exactly the permissions to view
   channels, send messages, embed links and read message history.
2. `/link <league>` from an admin of that league who can manage the
   channel links it and posts the linked message; from anyone else, or for
   an unknown league, it replies privately with the same refusal and
   changes nothing.
3. The bot answers Discord's requests only when their signature is valid
   and their timestamp is less than 5 minutes old, and answers within
   Discord's time limit.
4. Each event in the table posts once to the linked channel. The same event
   sent twice, and a post retried after a failure partway through, still
   give one message while the first is among the channel's 50 most recent
   messages; a post queued before an unlink or a relink isn't sent (tests
   below).
5. A pick, a confirmed result and a completed trade are stored and shown on
   the site even when Discord is unreachable; their posts follow when it's
   back.
6. A rate-limited post waits as long as Discord asks, then posts.
7. A post refused because the bot can't post there stops further posts for
   that league and shows "Posting stopped" in settings; a test post after
   fixing it resumes them.
8. Week reminders post once per week, at the league's time: the start, and
   a day before the end if any match isn't confirmed; a scheduled draft is
   reminded a day and an hour before.
9. No post can mention anyone but the coach on the clock: names that look
   like mentions are shown as text.
10. A post that fails for good is visible to the league's admins and
    reported to the error service.
11. The Discord section has every state above and passes axe at 360 and
    1280 px in both themes.
12. In a draft with a timer of 10 minutes or more, each turn posts one "on
    the clock" message mentioning only that coach; a coach who turned it
    off is named, not mentioned.
13. A person's data download includes what this spec holds about them,
    and deleting the account removes it.
14. With the league's language set to Hindi, a pick, a confirmed result
    and a reminder are posted in Hindi with the Pokémon's English name;
    every kind of post exists in every language.
15. A change that rolls back queues no post; one that commits queues
    exactly one.

## Out of scope

- Commands other than `/link` (standings, schedules or picking from
  Discord).
- Reading messages, roles or members; direct messages to coaches.
- More than one channel per league, or a channel per kind of post.
- Posts from the AI (spec 013 adds recaps and the digest to this bot).

## Changes

- 2026-10-21: written.
- 2026-10-21: audit fixes: pg-boss is first added here; "on the clock"
  posts; reminders in the league's time zone and before a scheduled draft;
  `/link` needs Manage Channels; old signatures refused; personal data.
- 2026-10-21: final audit: posts queued in the event's own transaction, with a test that a rolled-back change queues nothing.
