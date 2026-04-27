# Ponder Daily — Product Brief

## Product Identity

- **Display brand:** Ponder Daily (formerly Hmm?)
- **Domain:** ponderdaily.space
- **Tagline:** Ponder something new, every day.
- **Core concept:** A free daily reading and discovery space for curious kids aged 6–16. Fresh stories, ideas and questions every day, designed to spark real conversations between children and the adults in their lives.

---

## About Copy

Ponder Daily is a free daily reading and discovery space for curious kids aged 6 to 16 — fresh stories, ideas, and questions every day, chosen to spark real conversations between children and the people who care about them. Each piece is written to be age-appropriate, genuinely interesting, and open-ended enough that there's no single right answer — just thinking, talking, and wondering together. No accounts, no tracking, no cost, no strings — just a child and their curiosity.

---

## The Problem Being Solved

Schools are deprioritising foundational skills — times tables, phonics, grammar, science, social studies — in favour of test prep and social-emotional learning programmes. Parents who are engaged want supplementary resources but most available tools are rote, gamified, or data-hungry. Ponder Daily targets engaged parents and children who want to fill educational gaps, with teachers and classrooms welcome as secondary users.

> **Philosophy: school is the floor, not the ceiling.**

---

## Core Mechanic

Each day the site publishes a grid of age-appropriate reading pieces. Each piece has three questions:

1. **Factual recall** — did they read and retain it?
2. **Inference** — can they read between the lines?
3. **Open discussion** — a genuinely contested question with no right answer, designed to start a real conversation

Children do not answer inside the app. They talk about it with a parent, teacher or friend, or write answers in their own notebook. This is a deliberate product decision — it keeps the interaction human, removes all data storage requirements, and makes writing in a notebook a feature.

---

## Age Bands

| Band | Audience | Tone |
|------|----------|------|
| 6–8 | Young readers | Short, vivid, concrete. Animals, people, simple phenomena. Wonder-led. |
| 9–12 | Middle readers | News-adjacent, real events, accessible complexity. Cause and effect, fairness, how things work. |
| 13–16+ | Older readers | Genuine complexity, contested ideas, ethics, society, science with implications. Discussion question arguable by a reasonable adult on either side. |

---

## Content Structure Per Day

**Three pieces per age band.** Each piece:
- Short (150–300 words depending on age band)
- Grounded in real phenomena — news-adjacent but not distressing or politically alienating
- Followed by exactly three questions in the recall → inference → open discussion arc
- Question 3 must have no single correct answer

**Sweet spot topics:** science, nature, history with modern echoes, technology, human interest, culture, language, geography.

**Avoid:** party politics, violence, content that requires parental content warnings.

---

## Content Generation Pipeline

- Claude API (`claude-sonnet-4-20250514`) generates all content daily in a single automated job
- System prompt locks the structure: age band, word count, topic category, three-question arc, tone
- Generate 2–3 versions of each piece; pick best or let reviewer choose
- Build a content buffer — generate 3–5 days ahead when time allows
- Admin dashboard shows buffer depth so a busy day doesn't mean stale content
- **Daily API cost for full grid generation:** negligible (under $0.10)
- **Human review time:** ~30 minutes daily — read, approve or regenerate, publish

---

## Human Review Checklist (build into admin UI)

- [ ] Factually solid — core claim is Google-checkable
- [ ] Age-appropriate tone
- [ ] Question 3 has no right answer — a reasonable adult could argue either side
- [ ] No cultural specificity that alienates non-US/UK audiences
- [ ] Nothing distressing for the age band

---

## Data Model (SQLite / Prisma)

```
ContentPiece
  id
  ageBand: enum(6-8, 9-12, 13-16)
  title
  body
  question1  (recall)
  question2  (inference)
  question3  (discussion)
  topic_category
  publishDate
  status: enum(draft, approved, published)
  generatedAt
  approvedAt
  createdAt

DailyGrid
  id
  date
  ageBand
  pieces: ContentPiece[]
  publishedAt
```

---

## Privacy and Data Policy — Non-Negotiable

- No user accounts
- No stored responses
- No personal data of any kind
- No cookies beyond optional age band preference (browser localStorage only)
- No analytics that track individuals
- GDPR/COPPA compliance by architecture — there is simply nothing to comply about

> This is a trust signal to lead with prominently in the UI, not bury in a footer.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js with TypeScript |
| Database | SQLite via Prisma |
| Styling | Tailwind CSS |
| Content generation | Anthropic Claude API |
| Hosting | Oracle Cloud Always Free tier |
| Auth | Single admin user, environment variable secret, no public auth |

---

## Visual Direction

- Warm, cartoony, inviting — signals safe and for kids without being babyish for teenagers
- Open-licence illustration sets: Storyset, unDraw, or Open Peeps
- Each age band could have a subtly different colour palette while sharing the same layout system
- The brand mark should feel like a logo — the question mark is the whole brand idea
- Grid layout for the daily pieces — cards, spacious, readable at a glance

---

## Public Site Structure

```
/           → Homepage, explains Ponder Daily, links to age bands
/6-8        → Today's grid for youngest band
/9-12       → Today's grid for middle band
/13-16      → Today's grid for oldest band
/about      → About copy + privacy statement
/admin      → Review interface (protected, no public link)
```

Each age band URL is bookmarkable. Parents bookmark their child's band. Teachers put it on a classroom board. No login ever required for readers.

---

## Admin Interface Requirements

- Login via environment variable secret (no database auth)
- Shows buffer depth prominently — "You have 4 days of content ahead"
- Lists pending/draft pieces with full preview
- Per-piece actions: Approve / Edit / Regenerate
- Regenerate hits Claude API instantly and returns a new version
- One-click publish for approved daily grids
- Simple, functional — this is a tool for one person, not a CMS product

---

## Generation Prompt Structure

```
You are generating content for Ponder Daily, a free educational website for curious kids.

Age band: [6-8 / 9-12 / 13-16]
Topic category: [science / nature / history / technology / culture / human interest]

Write one short reading piece for this age band. Requirements:
- [6-8: 120-150 words] [9-12: 180-220 words] [13-16: 220-280 words]
- Grounded in a real phenomenon, event, or discovery
- News-adjacent but not distressing or politically partisan
- Warm, curious tone — written to spark wonder and thinking
- Follow immediately with exactly three questions:
  Q1 (Recall): Tests whether they read and retained the piece
  Q2 (Inference): Requires reading between the lines
  Q3 (Discussion): A genuinely open question — no correct answer,
     a reasonable adult could argue either side
- Q3 must not have a hidden bias toward one answer

Return JSON:
{
  "title": "",
  "body": "",
  "question1": "",
  "question2": "",
  "question3": ""
}

Tone reference and few-shot examples: [insert relevant age band examples]
```

---

## Sample Content — Tone and Structure Reference

### Age 6–8

**The Clever Octopus**

Scientists at an aquarium were puzzled. Every morning they arrived to find fish missing from a nearby tank. They checked for holes and cracks but found nothing. Then one night they set up a camera. The footage showed an octopus climbing out of its own tank, sliding across the floor, squeezing into the fish tank for a meal, then returning home before morning. The octopus had been doing this for weeks without anyone noticing.

- **Q1 — Recall:** How did the scientists find out what was happening to the fish?
- **Q2 — Inference:** Why do you think the octopus went back to its own tank instead of staying in the fish tank?
- **Q3 — Discussion:** The octopus was doing something sneaky, but it was just trying to eat. Does that make it naughty, or is it just being clever? Can an animal be naughty?

---

**A Library in a Backpack**

A young girl named Ela lives in a village with no bookshop and no library. Once a week a man named Mr. Osei arrives on a bicycle with a big backpack full of books. Children run out to meet him. They swap the books they've finished for new ones. Ela has read about space, dinosaurs, a girl who sailed around the world, and a boy who could talk to birds — all without ever leaving her village.

- **Q1 — Recall:** How does Ela get new books to read?
- **Q2 — Inference:** Why do you think the children run out to meet Mr. Osei?
- **Q3 — Discussion:** Ela has read about places she's never been. Do you think reading about something is almost as good as experiencing it yourself? What's the difference?

---

**The Tree That Survived**

In the middle of a busy city there is a very old pear tree. It is over 400 years old, which means it was already ancient when your great-great-great-great-grandparents were born. Buildings have been knocked down and rebuilt all around it. Roads were built right up to its trunk. Once there was even a huge fire in the city that destroyed everything nearby — but the tree survived. People now take great care of it. Some come just to stand next to something so old.

- **Q1 — Recall:** Name two things that happened near the tree while it was still alive.
- **Q2 — Inference:** Why do you think people come just to stand next to the tree, even though it's just a tree?
- **Q3 — Discussion:** The tree can't talk or think, but people treat it like it's special. Do you think very old things deserve special respect? Why?

---

### Age 9–12

**The Boy Who Mapped the Slums**

In the 1850s a deadly disease called cholera kept killing people in London. Doctors believed bad air caused it. A doctor named John Snow disagreed. He walked the streets interviewing families and marking every death on a map. A pattern emerged: nearly every death was clustered around one water pump on Broad Street. He convinced authorities to remove the pump handle. The deaths stopped. Snow had discovered that cholera spread through contaminated water — not air — decades before anyone understood bacteria. He was right because he looked at evidence instead of just accepting what everyone believed.

- **Q1 — Recall:** What did most doctors believe caused cholera, and what did John Snow believe instead?
- **Q2 — Inference:** Why was making a map so important to Snow's discovery? Could he have figured it out without one?
- **Q3 — Discussion:** Everyone around Snow believed something different, but he trusted his own evidence. Is it always good to question what experts say, or is that dangerous? How do you decide when to trust an authority and when to question them?

---

**When Silence Is Cheating**

A school in Finland tried an unusual experiment. For one month students were not allowed to use AI tools to help with homework. Then for the next month they could use any AI they wanted. Researchers measured not just the grades but whether students could explain their answers out loud. During the AI month grades went up — but students often couldn't explain what they'd written. One student said the essay wrote itself and he just handed it in. Another said she actually learned more when she had to struggle, she just didn't enjoy it.

- **Q1 — Recall:** Why did researchers test whether students could explain their answers, not just check their grades?
- **Q2 — Inference:** What do you think the student meant by "the essay wrote itself"? Is that a problem?
- **Q3 — Discussion:** The student who struggled said she learned more but enjoyed it less. Is enjoyment important in learning, or does it not matter if you're learning? Can something be good for you and unpleasant at the same time?

---

**The Island That's Disappearing**

The island nation of Tuvalu in the Pacific Ocean may not exist in fifty years. Rising sea levels caused by climate change are slowly swallowing the nine islands that make up the country. The government of Tuvalu has made a decision that has never been made before in history: they are creating a digital version of their country — maps, legal records, cultural archives — so that Tuvalu can continue to exist as a nation even after the physical land is gone. The prime minister said they will not let their country die.

- **Q1 — Recall:** What is Tuvalu's government doing to preserve the country, and why?
- **Q2 — Inference:** A country normally means a piece of land with people on it. If the land is gone but the records and culture survive, is it still a country? What makes a country a country?
- **Q3 — Discussion:** Some people say wealthy countries that produce the most carbon emissions should pay for the damage done to places like Tuvalu. Do you think that's fair? What would fair look like here?

---

### Age 13–16

**The Algorithm That Decides Your Future**

Several US school districts have begun using AI algorithms to flag students considered at risk of dropping out. The system analyses attendance, grades, and even family income data to predict who will fail. Supporters say early intervention saves students who would otherwise fall through the cracks. Critics argue the system encodes existing inequalities — students from poorer backgrounds get flagged more often, and being flagged can change how teachers treat them, creating a self-fulfilling prophecy. One researcher wrote that we are asking an algorithm trained on past failure to predict future failure, and calling it help.

- **Q1 — Recall:** Explain in your own words what a self-fulfilling prophecy means in this context.
- **Q2 — Inference:** The researcher uses the phrase "calling it help" with some scepticism. What do you think she's implying? Do you think her concern is valid?
- **Q3 — Discussion:** Should schools use predictive tools even if they're imperfect, on the basis that some early intervention is better than none? Or does using flawed data cause more harm than good? Where does the burden of proof lie when a tool affects someone's life?

---

**The Last Speakers**

When the last fluent speaker of a language dies, linguists say the language has gone dark. It happens roughly every two weeks somewhere in the world. Of approximately 7,000 languages spoken today researchers estimate half will be gone by 2100. Some argue this is natural — languages have always died as people migrate and cultures merge. Others argue each lost language represents a unique way of organising human thought, and that some concepts simply cannot be translated. The Hopi language of North America has no words for past or future tense — everything is expressed as a process rather than an event.

- **Q1 — Recall:** Why do some researchers argue language extinction is more serious than just losing words?
- **Q2 — Inference:** What does the Hopi example suggest about the relationship between language and the way people perceive time or reality?
- **Q3 — Discussion:** Should governments actively fund efforts to preserve dying languages, even if only a handful of people speak them and even if younger people from those communities choose not to learn them? Who should decide — governments, communities, or individuals?

---

**When Protest Becomes Theatre**

In recent years a new form of protest has emerged: activists gluing themselves to famous paintings, throwing soup at protected glass cases, or blocking rush-hour traffic. Supporters say extreme actions are necessary because conventional protest has been ignored for decades. Critics — including some within the environmental movement — argue that alienating ordinary people is counterproductive, that the headline becomes about the protest rather than the cause. Historical evidence is genuinely mixed: the suffragettes used disruptive tactics and eventually won; other radical movements alienated potential allies and collapsed.

- **Q1 — Recall:** What is the strategic argument made by critics of disruptive protest, even critics who share the same goals?
- **Q2 — Inference:** Why might it matter that some critics come from within the same movement rather than from opponents?
- **Q3 — Discussion:** Is there a point at which a cause is urgent enough to justify tactics that most people find annoying or offensive? Who gets to decide where that line is — and does it matter whether the cause turns out to be right?

---

## Founding Principles

> Keep these visible in the codebase.

1. **Free forever, no strings**
2. **No child data stored, ever**
3. **Human conversation beats in-app interaction**
4. **School is the floor, not the ceiling**
5. **Built by one parent who noticed a gap and decided to fill it**
