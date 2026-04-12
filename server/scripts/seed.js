// Populates the database with sample FerdaBox products
// Run: node server/scripts/seed.js
require('dotenv').config();
const Project = require('../models/Project');
const { pool } = require('../config/database');

const seedData = [
  {
    title: 'FerdaBox Explorer 400L',
    description: 'The perfect all-round roof box for family adventures. 400 litre capacity fits skis, snowboards, and luggage with ease. Dual-side opening for convenient access from either side of the car. Aerodynamic design reduces wind noise and fuel consumption. Quick-mount system fits most factory and aftermarket roof bars.',
    category: 'roof_boxes',
    year: 2026,
    tools_used: ['400L', 'dual-side opening', 'aerodynamic', 'quick-mount', 'fits skis'],
    image_url: '/assets/products/explorer-400l.jpg',
    featured: true,
    price: 89900,
    stock_quantity: 25,
    sku: 'FB-EXP-400',
    status: 'active',
  },
  {
    title: 'FerdaBox Pro 520L',
    description: 'Our flagship roof box for serious travelers. 520 litres of storage with a reinforced fiberglass shell that handles the harshest Icelandic conditions. Central locking system with anti-theft protection. Low-profile design for minimal aerodynamic drag. Premium matte black finish.',
    category: 'roof_boxes',
    year: 2026,
    tools_used: ['520L', 'fiberglass', 'central lock', 'anti-theft', 'matte black'],
    image_url: '/assets/products/pro-520l.jpg',
    featured: true,
    price: 129900,
    compare_at_price: 149900,
    stock_quantity: 12,
    sku: 'FB-PRO-520',
    status: 'active',
  },
  {
    title: 'Universal Cross Bars',
    description: 'Heavy-duty aluminum cross bars that fit most vehicles with raised or flush roof rails. 75 kg load capacity per pair. Tool-free installation with adjustable clamp system. Includes T-track mounting for easy box attachment. Available in silver or black anodized finish.',
    category: 'roof_racks',
    year: 2026,
    tools_used: ['aluminum', '75kg capacity', 'tool-free install', 'T-track', 'adjustable'],
    image_url: '/assets/products/cross-bars.jpg',
    featured: true,
    price: 34900,
    stock_quantity: 40,
    sku: 'FB-RACK-UNI',
    status: 'active',
  },
  {
    title: 'FerdaBox Starter Bundle',
    description: 'Everything you need to hit the road. Includes our Explorer 400L roof box, a pair of Universal Cross Bars, and a cargo net and straps kit. Save 15% compared to buying separately. Perfect for first-time roof box users.',
    category: 'bundles',
    year: 2026,
    tools_used: ['400L box', 'cross bars', 'cargo net', 'straps', 'save 15%'],
    image_url: '/assets/products/starter-bundle.jpg',
    featured: true,
    price: 119900,
    compare_at_price: 134700,
    stock_quantity: 15,
    sku: 'FB-BUNDLE-START',
    status: 'active',
  },
  {
    title: 'Cargo Net & Straps Kit',
    description: 'Heavy-duty cargo net (120x80 cm) with 4 ratchet straps rated to 500 kg each. Keeps your gear secure inside any roof box. UV-resistant nylon mesh with reinforced edges. Compact storage bag included.',
    category: 'accessories',
    year: 2026,
    tools_used: ['cargo net', 'ratchet straps', '500kg rated', 'UV-resistant', 'storage bag'],
    image_url: '/assets/products/cargo-net.jpg',
    featured: false,
    price: 9900,
    stock_quantity: 100,
    sku: 'FB-ACC-NET',
    status: 'active',
  },
];

async function seedProjects({ closePool = false } = {}) {
  console.log('Seeding products…');
  for (const data of seedData) {
    await Project.create(data);
  }
  console.log(`Done. ${seedData.length} products seeded.`);
  if (closePool) await pool.end();
}

module.exports = { seedProjects };

// When invoked directly: node server/scripts/seed.js
if (require.main === module) {
  seedProjects({ closePool: true })
    .catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
}
