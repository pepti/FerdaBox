// Populates the database with the Titan travel box product, sections, and gallery images
// Run: node server/scripts/seed.js
require('dotenv').config();
const Project = require('../models/Project');
const { pool } = require('../config/database');

const seedData = [
  {
    title: 'Titan Travel Box',
    description: 'The ultimate roof box for Icelandic adventures. Built to handle extreme weather and rough highland roads, the Titan combines massive cargo space with a sleek aerodynamic profile. Dual-side opening, integrated lock system, and quick-mount hardware included.',
    title_is: 'Titan Ferðakassi',
    description_is: 'Fullkominn þakkassi fyrir íslensk ævintýri. Hannaður til að þola öfgafullt veður og hraun\u00advegi hálendisins, Titan sameinar risastórt geymslurými og straumlínulaga loftviðnám. Opnun á báðar hliðar, innbyggður lás og snögg-festingar fylgja með.',
    category: 'roof_boxes',
    year: 2026,
    tools_used: ['aerodynamic', 'dual-side opening', 'integrated lock', 'quick-mount', 'weatherproof'],
    image_url: '/assets/products/titan/5.jpg',
    featured: true,
    price: 129900,
    stock_quantity: 30,
    sku: 'FB-TITAN-001',
    status: 'active',
  },
];

// All images in sort order
const titanGalleryImages = [
  '1.png', '2.png', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
  '10.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg', '16.jpg', '17.jpg',
  '19.jpg', '20.jpg', '21.jpg', '23.jpg',
  'XC186A.jpg', 'XC213A.jpg', 'XC2132B.jpg',
];

// Sections with descriptions and assigned images
const sectionDefs = [
  {
    name: 'Hero Showcase',
    name_is: 'Forsíðusýning',
    description: '',
    description_is: '',
    sort_order: 1,
    images: ['1.png', '2.png'],
  },
  {
    name: 'Built for the Journey',
    name_is: 'Smíðaður fyrir ferðalagið',
    description: 'The Titan was engineered for Iceland\u2019s harshest conditions. Every surface, seal, and hinge is built to survive highland gravel, North Atlantic rain, and years of rooftop service. UV-stabilised ABS shell with reinforced ribbing handles impacts that would crack lesser boxes.',
    description_is: 'Titan var hannaður fyrir harðustu aðstæður á Íslandi. Sérhver flötur, þétting og lamir er smíðuð til að þola hálendismal, Norður-Atlantshafsstorma og áralanga notkun á þaki. UV-varið ABS skel með styrktum ribbum þolir högg sem myndu brjóta aðra kassa.',
    sort_order: 2,
    images: ['4.jpg', '5.jpg'],
  },
  {
    name: 'Interior & Details',
    name_is: 'Innrétting og smáatriði',
    description: 'Dual-side opening with a single-hand latch mechanism. The interior features anti-slip matting, integrated tie-down points, and a removable divider for flexible cargo organisation. Every hinge is stainless steel, every seal is double-lipped rubber.',
    description_is: 'Opnun á báðar hliðar með einföldum lásabúnaði. Innrétting með hálkuvörn, innbyggðum festipunktum og laus\u00adtakanlegu skilrúmi fyrir sveigjanlega skipulagningu farms. Allar lamir eru úr ryðfríu stáli, allar þéttingar úr tvöföldu gúmmíi.',
    sort_order: 3,
    images: ['12.jpg', '13.jpg', '14.jpg'],
  },
  {
    name: 'On the Road',
    name_is: 'Á veginum',
    description: 'Tested across Iceland\u2019s Ring Road, highland F-roads, and everything in between. The Titan sits aerodynamically on any factory roof rack and handles highway speeds without a whisper. Low-profile design reduces drag and fuel consumption on long drives.',
    description_is: 'Prófaður á Hringveginum, F-vegum hálendisins og öllu þar á milli. Titan situr straumlínulaga á hvaða verksmiðjuþakgrind sem er og þolir hraðbrautarhraða án þess að heyrast. Lágvaxið snið minnkar loftmótstöðu og eldsneytisnotkun á löngum ferðum.',
    sort_order: 4,
    images: ['9.jpg', '10.jpg', '15.jpg', '16.jpg'],
  },
  {
    name: 'Dimensions & Specs',
    name_is: 'Stærðir og tækniupplýsingar',
    description: '',
    description_is: '',
    sort_order: 5,
    images: ['6.jpg', 'XC186A.jpg', 'XC213A.jpg', 'XC2132B.jpg'],
  },
];

// Images not in any section go to Ungrouped
const sectionImages = new Set(sectionDefs.flatMap(s => s.images));
const ungroupedImages = titanGalleryImages.filter(img => !sectionImages.has(img));

async function seedProjects({ closePool = false } = {}) {
  // Clear existing products and their media before seeding
  console.log('Clearing existing products\u2026');
  await pool.query('DELETE FROM project_media');
  await pool.query('DELETE FROM project_sections');
  await pool.query('DELETE FROM project_videos');
  await pool.query('DELETE FROM cart_items');
  await pool.query('DELETE FROM projects');

  console.log('Seeding products\u2026');
  for (const data of seedData) {
    await Project.create(data);
  }
  console.log(`Done. ${seedData.length} products seeded.`);

  // Get the Titan product ID
  const { rows } = await pool.query(
    `SELECT id FROM projects WHERE sku = 'FB-TITAN-001' LIMIT 1`
  );
  if (!rows.length) {
    console.error('Titan product not found after seeding!');
    if (closePool) await pool.end();
    return;
  }

  const projectId = rows[0].id;

  // Insert all media rows first (ungrouped)
  console.log('Seeding gallery images for Titan (project %d)\u2026', projectId);
  for (let i = 0; i < titanGalleryImages.length; i++) {
    await pool.query(
      `INSERT INTO project_media (project_id, file_path, media_type, sort_order)
       VALUES ($1, $2, 'image', $3)`,
      [projectId, `/assets/products/titan/${titanGalleryImages[i]}`, i + 1]
    );
  }
  console.log(`${titanGalleryImages.length} gallery images seeded.`);

  // Create sections and assign images to them
  console.log('Creating sections\u2026');
  for (const sec of sectionDefs) {
    const secResult = await pool.query(
      `INSERT INTO project_sections (project_id, name, description, name_is, description_is, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [projectId, sec.name, sec.description, sec.name_is || null, sec.description_is || null, sec.sort_order]
    );
    const sectionId = secResult.rows[0].id;

    // Assign images to this section
    for (const img of sec.images) {
      await pool.query(
        `UPDATE project_media
         SET section_id = $1
         WHERE project_id = $2 AND file_path = $3`,
        [sectionId, projectId, `/assets/products/titan/${img}`]
      );
    }
    console.log(`  Section "${sec.name}" (id=${sectionId}): ${sec.images.length} images assigned`);
  }

  console.log(`Ungrouped images: ${ungroupedImages.length} (${ungroupedImages.join(', ')})`);
  console.log('Seeding complete!');

  if (closePool) await pool.end();
}

module.exports = { seedProjects };

// When invoked directly: node server/scripts/seed.js
if (require.main === module) {
  seedProjects({ closePool: true })
    .catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
}
