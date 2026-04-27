import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const today = new Date();
today.setHours(0, 0, 0, 0);

async function main() {
  // Clear existing seed data
  await prisma.contentPiece.deleteMany();
  await prisma.dailyGrid.deleteMany();

  const pieces68 = await Promise.all([
    prisma.contentPiece.create({
      data: {
        ageBand: "6-8",
        title: "The Clever Octopus",
        body: "Scientists at an aquarium were puzzled. Every morning they arrived to find fish missing from a nearby tank. They checked for holes and cracks but found nothing. Then one night they set up a camera. The footage showed an octopus climbing out of its own tank, sliding across the floor, squeezing into the fish tank for a meal, then returning home before morning. The octopus had been doing this for weeks without anyone noticing.",
        question1: "How did the scientists find out what was happening to the fish?",
        question2: "Why do you think the octopus went back to its own tank instead of staying in the fish tank?",
        question3: "The octopus was doing something sneaky, but it was just trying to eat. Does that make it naughty, or is it just being clever? Can an animal be naughty?",
        topicCategory: "nature",
        status: "published",
        publishDate: today,
      },
    }),
    prisma.contentPiece.create({
      data: {
        ageBand: "6-8",
        title: "A Library in a Backpack",
        body: "A young girl named Ela lives in a village with no bookshop and no library. Once a week a man named Mr. Osei arrives on a bicycle with a big backpack full of books. Children run out to meet him. They swap the books they've finished for new ones. Ela has read about space, dinosaurs, a girl who sailed around the world, and a boy who could talk to birds — all without ever leaving her village.",
        question1: "How does Ela get new books to read?",
        question2: "Why do you think the children run out to meet Mr. Osei?",
        question3: "Ela has read about places she's never been. Do you think reading about something is almost as good as experiencing it yourself? What's the difference?",
        topicCategory: "human interest",
        status: "published",
        publishDate: today,
      },
    }),
    prisma.contentPiece.create({
      data: {
        ageBand: "6-8",
        title: "The Tree That Survived",
        body: "In the middle of a busy city there is a very old pear tree. It is over 400 years old, which means it was already ancient when your great-great-great-great-grandparents were born. Buildings have been knocked down and rebuilt all around it. Roads were built right up to its trunk. Once there was even a huge fire in the city that destroyed everything nearby — but the tree survived. People now take great care of it. Some come just to stand next to something so old.",
        question1: "Name two things that happened near the tree while it was still alive.",
        question2: "Why do you think people come just to stand next to the tree, even though it's just a tree?",
        question3: "The tree can't talk or think, but people treat it like it's special. Do you think very old things deserve special respect? Why?",
        topicCategory: "history",
        status: "published",
        publishDate: today,
      },
    }),
  ]);

  const pieces912 = await Promise.all([
    prisma.contentPiece.create({
      data: {
        ageBand: "9-12",
        title: "The Boy Who Mapped the Slums",
        body: "In the 1850s a deadly disease called cholera kept killing people in London. Doctors believed bad air caused it. A doctor named John Snow disagreed. He walked the streets interviewing families and marking every death on a map. A pattern emerged: nearly every death was clustered around one water pump on Broad Street. He convinced authorities to remove the pump handle. The deaths stopped. Snow had discovered that cholera spread through contaminated water — not air — decades before anyone understood bacteria. He was right because he looked at evidence instead of just accepting what everyone believed.",
        question1: "What did most doctors believe caused cholera, and what did John Snow believe instead?",
        question2: "Why was making a map so important to Snow's discovery? Could he have figured it out without one?",
        question3: "Everyone around Snow believed something different, but he trusted his own evidence. Is it always good to question what experts say, or is that dangerous? How do you decide when to trust an authority and when to question them?",
        topicCategory: "history",
        status: "published",
        publishDate: today,
      },
    }),
    prisma.contentPiece.create({
      data: {
        ageBand: "9-12",
        title: "When Silence Is Cheating",
        body: "A school in Finland tried an unusual experiment. For one month students were not allowed to use AI tools to help with homework. Then for the next month they could use any AI they wanted. Researchers measured not just the grades but whether students could explain their answers out loud. During the AI month grades went up — but students often couldn't explain what they'd written. One student said the essay wrote itself and he just handed it in. Another said she actually learned more when she had to struggle, she just didn't enjoy it.",
        question1: "Why did researchers test whether students could explain their answers, not just check their grades?",
        question2: "What do you think the student meant by \"the essay wrote itself\"? Is that a problem?",
        question3: "The student who struggled said she learned more but enjoyed it less. Is enjoyment important in learning, or does it not matter if you're learning? Can something be good for you and unpleasant at the same time?",
        topicCategory: "technology",
        status: "published",
        publishDate: today,
      },
    }),
    prisma.contentPiece.create({
      data: {
        ageBand: "9-12",
        title: "The Island That's Disappearing",
        body: "The island nation of Tuvalu in the Pacific Ocean may not exist in fifty years. Rising sea levels caused by climate change are slowly swallowing the nine islands that make up the country. The government of Tuvalu has made a decision that has never been made before in history: they are creating a digital version of their country — maps, legal records, cultural archives — so that Tuvalu can continue to exist as a nation even after the physical land is gone. The prime minister said they will not let their country die.",
        question1: "What is Tuvalu's government doing to preserve the country, and why?",
        question2: "A country normally means a piece of land with people on it. If the land is gone but the records and culture survive, is it still a country? What makes a country a country?",
        question3: "Some people say wealthy countries that produce the most carbon emissions should pay for the damage done to places like Tuvalu. Do you think that's fair? What would fair look like here?",
        topicCategory: "science",
        status: "published",
        publishDate: today,
      },
    }),
  ]);

  const pieces1316 = await Promise.all([
    prisma.contentPiece.create({
      data: {
        ageBand: "13-16",
        title: "The Algorithm That Decides Your Future",
        body: "Several US school districts have begun using AI algorithms to flag students considered at risk of dropping out. The system analyses attendance, grades, and even family income data to predict who will fail. Supporters say early intervention saves students who would otherwise fall through the cracks. Critics argue the system encodes existing inequalities — students from poorer backgrounds get flagged more often, and being flagged can change how teachers treat them, creating a self-fulfilling prophecy. One researcher wrote that we are asking an algorithm trained on past failure to predict future failure, and calling it help.",
        question1: "Explain in your own words what a self-fulfilling prophecy means in this context.",
        question2: "The researcher uses the phrase \"calling it help\" with some scepticism. What do you think she's implying? Do you think her concern is valid?",
        question3: "Should schools use predictive tools even if they're imperfect, on the basis that some early intervention is better than none? Or does using flawed data cause more harm than good? Where does the burden of proof lie when a tool affects someone's life?",
        topicCategory: "technology",
        status: "published",
        publishDate: today,
      },
    }),
    prisma.contentPiece.create({
      data: {
        ageBand: "13-16",
        title: "The Last Speakers",
        body: "When the last fluent speaker of a language dies, linguists say the language has gone dark. It happens roughly every two weeks somewhere in the world. Of approximately 7,000 languages spoken today researchers estimate half will be gone by 2100. Some argue this is natural — languages have always died as people migrate and cultures merge. Others argue each lost language represents a unique way of organising human thought, and that some concepts simply cannot be translated. The Hopi language of North America has no words for past or future tense — everything is expressed as a process rather than an event.",
        question1: "Why do some researchers argue language extinction is more serious than just losing words?",
        question2: "What does the Hopi example suggest about the relationship between language and the way people perceive time or reality?",
        question3: "Should governments actively fund efforts to preserve dying languages, even if only a handful of people speak them and even if younger people from those communities choose not to learn them? Who should decide — governments, communities, or individuals?",
        topicCategory: "culture",
        status: "published",
        publishDate: today,
      },
    }),
    prisma.contentPiece.create({
      data: {
        ageBand: "13-16",
        title: "When Protest Becomes Theatre",
        body: "In recent years a new form of protest has emerged: activists gluing themselves to famous paintings, throwing soup at protected glass cases, or blocking rush-hour traffic. Supporters say extreme actions are necessary because conventional protest has been ignored for decades. Critics — including some within the environmental movement — argue that alienating ordinary people is counterproductive, that the headline becomes about the protest rather than the cause. Historical evidence is genuinely mixed: the suffragettes used disruptive tactics and eventually won; other radical movements alienated potential allies and collapsed.",
        question1: "What is the strategic argument made by critics of disruptive protest, even critics who share the same goals?",
        question2: "Why might it matter that some critics come from within the same movement rather than from opponents?",
        question3: "Is there a point at which a cause is urgent enough to justify tactics that most people find annoying or offensive? Who gets to decide where that line is — and does it matter whether the cause turns out to be right?",
        topicCategory: "history",
        status: "published",
        publishDate: today,
      },
    }),
  ]);

  // Create DailyGrids and link pieces
  await prisma.dailyGrid.create({
    data: {
      date: today,
      ageBand: "6-8",
      publishedAt: today,
      pieces: { connect: pieces68.map((p) => ({ id: p.id })) },
    },
  });

  await prisma.dailyGrid.create({
    data: {
      date: today,
      ageBand: "9-12",
      publishedAt: today,
      pieces: { connect: pieces912.map((p) => ({ id: p.id })) },
    },
  });

  await prisma.dailyGrid.create({
    data: {
      date: today,
      ageBand: "13-16",
      publishedAt: today,
      pieces: { connect: pieces1316.map((p) => ({ id: p.id })) },
    },
  });

  console.log("Seeded 9 content pieces across 3 age bands.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
