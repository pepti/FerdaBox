/**
 * seed-news.js — Seeds the first news article: the site launch story.
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING on the unique slug.
 * Run after migrations: node server/scripts/seed-news.js
 */
require('dotenv').config();

const db = require('../config/database');

const LAUNCH_ARTICLE = {
  title:    'Ferða Box er komin á netið!',
  slug:     'ferdabox-opnun',
  category: 'announcement',
  summary:  'Við erum stolt af því að kynna Ferða Box — nýja vefverslun fyrir ferðakassa, þakgrindur og ferðabúnað á Íslandi.',
  body: `<p>Velkomin á <strong>Ferða Box</strong> — nýja vefverslunina okkar þar sem þú finnur úrvals ferðakassa og þakgrindur fyrir bílinn þinn.</p>

<h2>Af hverju Ferða Box?</h2>

<p>Við vitum að íslenskar aðstæður krefjast búnaðar sem þolir allt. Hvassviðri, snjó, malarvegi og langa ferðir á hálendinu. Þess vegna bjóðum við aðeins upp á gæðavörur sem standast kröfur íslenskra ferðamanna.</p>

<h2>Hvað er í boði?</h2>

<ul>
  <li><strong>Ferðakassar</strong> — Frá 300L til 600L, straumlínulöguð hönnun, tvíhliða opnun og fjölpunkta læsing.</li>
  <li><strong>Þakgrindur</strong> — Alhliða grindur sem passa á flestar bílategundir, auðveld uppsetning án verkfæra.</li>
  <li><strong>Fylgihlutir</strong> — Net, bönd og annað sem tryggir öryggi farmsins.</li>
  <li><strong>Pakkatilboð</strong> — Fullbúin sett sem spara þér peninga og fyrirhöfn.</li>
</ul>

<h2>5 ára ábyrgð</h2>

<p>Allar vörur okkar eru með 5 ára ábyrgð gegn framleiðslugöllum. Við stöndum á bak við gæði varanna okkar.</p>

<h2>Hvað er framundan?</h2>

<p>Við erum stöðugt að bæta við nýjum vörum og þjónustu. Fylgstu með fréttum okkar til að vera uppfærð/ur um nýjungar, tilboð og ferðaráð.</p>

<p>— Ferða Box teymið</p>`,
};

async function seedNews() {
  try {
    // Find the first admin user to set as author
    const { rows: admins } = await db.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1"
    );
    const authorId = admins[0]?.id || null;

    const { rows } = await db.query(
      `INSERT INTO news_articles
         (title, slug, summary, body, category, author_id, published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
       ON CONFLICT (slug) DO NOTHING
       RETURNING id, title, slug`,
      [
        LAUNCH_ARTICLE.title,
        LAUNCH_ARTICLE.slug,
        LAUNCH_ARTICLE.summary,
        LAUNCH_ARTICLE.body,
        LAUNCH_ARTICLE.category,
        authorId,
      ]
    );

    if (rows[0]) {
      console.log(`✓ Seeded article: "${rows[0].title}" (slug: ${rows[0].slug})`);
    } else {
      console.log('Article already exists — skipped.');
    }
  } catch (err) {
    console.error('Failed to seed news:', err.message);
    throw err;
  }
}

module.exports = { seedNews };

// When invoked directly: node server/scripts/seed-news.js
if (require.main === module) {
  seedNews()
    .then(() => db.pool.end())
    .catch(err => { console.error('Seed failed:', err.message); db.pool.end(); process.exit(1); });
}
