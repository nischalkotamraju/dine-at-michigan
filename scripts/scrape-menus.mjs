/**
 * UMich Dining Menu Scraper
 * Scrapes public HTML from dining.umich.edu and inserts into Supabase.
 * Run with: node scripts/scrape-menus.mjs [YYYY-MM-DD]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gtkzwyhqxtubgmlvovmn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY env var is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DINING_HALLS = [
  { name: 'Bursley Dining Hall',       slug: 'bursley' },
  { name: 'East Quad Dining Hall',     slug: 'east-quad' },
  { name: 'Markley Dining Hall',       slug: 'markley' },
  { name: 'North Quad Dining Hall',    slug: 'north-quad' },
  { name: 'South Quad Dining Hall',    slug: 'south-quad' },
  { name: 'Mosher-Jordan Dining Hall', slug: 'mosher-jordan' },
];

// ---------------------------------------------------------------------------
// HTML parsing (mirrors cloudflare-worker/src/index.js)
// ---------------------------------------------------------------------------

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseMenuHtml(html) {
  const meals = [];
  const MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Late Night'];

  const h3Parts = html.split(/<h3[^>]*>/i);
  for (const part of h3Parts) {
    const headerEnd = part.indexOf('</h3>');
    if (headerEnd === -1) continue;
    const headerText = stripTags(part.substring(0, headerEnd));
    const mealName = MEAL_NAMES.find(m => headerText.includes(m));
    if (!mealName) continue;
    const categories = parseCategoriesFromMealChunk(part);
    if (categories.length > 0) meals.push({ name: mealName, categories });
  }
  return meals;
}

function parseCategoriesFromMealChunk(mealChunk) {
  const categories = [];
  const h4Parts = mealChunk.split(/<h4[^>]*>/i);
  for (let i = 1; i < h4Parts.length; i++) {
    const part = h4Parts[i];
    const nameEnd = part.indexOf('</h4>');
    if (nameEnd === -1) continue;
    const categoryName = stripTags(part.substring(0, nameEnd)).replace(/\s+/g, ' ').trim();
    if (!categoryName) continue;
    const items = parseItemsFromCategoryChunk(part);
    if (items.length > 0) categories.push({ title: categoryName, items });
  }
  return categories;
}

function parseItemsFromCategoryChunk(categoryChunk) {
  const items = [];
  const liParts = categoryChunk.split(/<li class="([^"]*trait-[^"]*)"/i);

  for (let i = 1; i < liParts.length; i += 2) {
    const traitClasses = liParts[i] ?? '';
    const itemHtml = liParts[i + 1] ?? '';

    const nameMatch = itemHtml.match(/<span[^>]*class="item-name"[^>]*>([\s\S]*?)<\/span>/i);
    if (!nameMatch) continue;
    const name = stripTags(nameMatch[1]).replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
    if (!name) continue;

    const classTraits = traitClasses.split(/\s+/).map(c =>
      c.startsWith('trait-') ? c.slice(6) :
      c.startsWith('allergen-') ? c.slice(9) : c
    );

    let nutStart = itemHtml.indexOf('<div class="nutrition"');
    if (nutStart < 0) {
      const m = itemHtml.match(/<div[^>]+class="nutrition[^"]*"/i);
      if (m) nutStart = itemHtml.indexOf(m[0]);
    }
    const nutritionHtml = nutStart >= 0 ? itemHtml.substring(nutStart, nutStart + 10000) : '';
    const nutrition = parseNutrition(nutritionHtml);

    const allergens = {
      milk: classTraits.some(t => t === 'milk' || t === 'dairy'),
      egg: classTraits.some(t => t === 'eggs' || t === 'egg'),
      fish: classTraits.includes('fish'),
      shellfish: classTraits.includes('shellfish'),
      tree_nuts: classTraits.some(t => t === 'treenuts' || t === 'tree-nuts' || t === 'tree_nuts'),
      peanuts: classTraits.includes('peanuts'),
      wheat: classTraits.some(t => t === 'wheat' || t === 'gluten'),
      soy: classTraits.includes('soy'),
      sesame_seeds: classTraits.some(t => t === 'sesame' || t === 'sesameseeds'),
      beef: classTraits.includes('beef'),
      pork: classTraits.includes('pork'),
      halal: classTraits.includes('halal'),
      vegan: classTraits.includes('vegan'),
      vegetarian: classTraits.includes('vegetarian'),
    };

    items.push({
      name,
      allergens: Object.values(allergens).some(Boolean) ? allergens : null,
      nutrition: nutrition.calories !== null ? nutrition : null,
    });
  }
  return items;
}

function parseNutrition(html) {
  const n = {
    serving_size: null, calories: null, total_fat: null, saturated_fat: null,
    trans_fat: null, cholesterol: null, sodium: null, total_carbohydrates: null,
    dietary_fiber: null, total_sugars: null, protein: null, vitamin_d: null,
    calcium: null, iron: null, potassium: null,
  };
  if (!html) return n;

  const rows = html.split(/<tr[^>]*>/i);
  for (const row of rows) {
    const text = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const num = (str) => { const m = str.match(/(\d+\.?\d*)/); return m ? m[1] : null; };
    const t = text.toLowerCase();

    if (t.startsWith('serving size')) {
      n.serving_size = text.replace(/^serving size\s*/i, '').replace(/\s*%.*$/, '').trim() || null;
    } else if (/^calories\s/i.test(text)) {
      n.calories = num(text.replace(/^calories\s*/i, ''));
    } else if (/total fat/i.test(t) && !/saturated/i.test(t)) {
      n.total_fat = num(text.replace(/total fat/i, ''));
    } else if (/saturated fat/i.test(t)) {
      n.saturated_fat = num(text.replace(/saturated fat/i, ''));
    } else if (/trans fat/i.test(t)) {
      n.trans_fat = num(text.replace(/trans fat/i, ''));
    } else if (/cholesterol/i.test(t)) {
      n.cholesterol = num(text.replace(/cholesterol/i, ''));
    } else if (/sodium/i.test(t)) {
      n.sodium = num(text.replace(/sodium/i, ''));
    } else if (/total carbohydrate/i.test(t)) {
      n.total_carbohydrates = num(text.replace(/total carbohydrate\w*/i, ''));
    } else if (/dietary fiber/i.test(t)) {
      n.dietary_fiber = num(text.replace(/dietary fiber/i, ''));
    } else if (/total sugars/i.test(t)) {
      n.total_sugars = num(text.replace(/total sugars/i, ''));
    } else if (/^sugars\s/i.test(text)) {
      n.total_sugars = n.total_sugars ?? num(text.replace(/^sugars\s*/i, ''));
    } else if (/protein/i.test(t)) {
      n.protein = num(text.replace(/protein/i, ''));
    } else if (/vitamin d/i.test(t)) {
      n.vitamin_d = num(text.replace(/vitamin d/i, ''));
    } else if (/calcium/i.test(t) && !t.includes('citrate')) {
      n.calcium = num(text.replace(/calcium/i, ''));
    } else if (/^iron\s/i.test(text)) {
      n.iron = num(text.replace(/^iron\s*/i, ''));
    } else if (/potassium/i.test(t)) {
      n.potassium = num(text.replace(/potassium/i, ''));
    }
  }
  return n;
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function getLocationMap() {
  const { data, error } = await supabase
    .from('location')
    .select('id, name')
    .in('name', DINING_HALLS.map(h => h.name));
  if (error) throw new Error(`Failed to fetch locations: ${error.message}`);
  const map = {};
  for (const row of data) map[row.name] = row.id;
  return map;
}

// ---------------------------------------------------------------------------
// Scrape one hall for one date
// ---------------------------------------------------------------------------

async function scrapeHall(hall, date, locationId) {
  const url = `https://dining.umich.edu/menus-locations/dining-halls/${hall.slug}/?menuDate=${date}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  });

  if (!res.ok) {
    console.log(`  ⚠️  HTTP ${res.status}`);
    return;
  }

  const html = await res.text();
  if (html.length < 10000 || html.includes('Just a moment')) {
    console.log(`  ⚠️  Got bot challenge page`);
    return;
  }

  const meals = parseMenuHtml(html);
  if (meals.length === 0) {
    console.log(`  ℹ️  Closed / no menu`);
    return;
  }

  // Delete existing menus for this location+date
  await supabase.from('menu').delete().eq('location_id', locationId).eq('date', date);

  // Bulk insert menus
  const { data: menuRows, error: menuErr } = await supabase
    .from('menu')
    .insert(meals.map(m => ({ location_id: locationId, name: m.name, date })))
    .select('id, name');
  if (menuErr) throw new Error(`menu insert: ${menuErr.message}`);

  const menuIdMap = {};
  for (const row of menuRows) menuIdMap[row.name] = row.id;

  // Flatten categories
  const allCategories = [];
  for (const meal of meals) {
    const menuId = menuIdMap[meal.name];
    if (!menuId) continue;
    for (const cat of meal.categories) {
      allCategories.push({ menu_id: menuId, title: cat.title, _items: cat.items });
    }
  }
  if (allCategories.length === 0) return;

  // Bulk insert categories
  const { data: catRows, error: catErr } = await supabase
    .from('menu_category')
    .insert(allCategories.map(c => ({ menu_id: c.menu_id, title: c.title })))
    .select('id, menu_id, title');
  if (catErr) throw new Error(`menu_category insert: ${catErr.message}`);

  const catIdMap = {};
  for (const row of catRows) catIdMap[`${row.menu_id}:${row.title}`] = row.id;

  // Flatten items
  const allItems = [];
  for (const cat of allCategories) {
    const categoryId = catIdMap[`${cat.menu_id}:${cat.title}`];
    if (!categoryId) continue;
    for (const item of cat._items) {
      allItems.push({ categoryId, ...item });
    }
  }
  if (allItems.length === 0) return;

  // Bulk insert nutrition
  const nutritionItems = allItems.filter(i => i.nutrition);
  if (nutritionItems.length > 0) {
    const { data: nutRows, error: nutErr } = await supabase
      .from('nutrition')
      .insert(nutritionItems.map(i => i.nutrition))
      .select('id');
    if (nutErr) throw new Error(`nutrition insert: ${nutErr.message}`);
    for (let j = 0; j < nutritionItems.length; j++) {
      nutritionItems[j]._nutritionId = nutRows[j]?.id ?? null;
    }
  }

  // Bulk insert allergens
  const allergenItems = allItems.filter(i => i.allergens);
  if (allergenItems.length > 0) {
    const { data: algRows, error: algErr } = await supabase
      .from('allergens')
      .insert(allergenItems.map(i => i.allergens))
      .select('id');
    if (algErr) throw new Error(`allergens insert: ${algErr.message}`);
    for (let j = 0; j < allergenItems.length; j++) {
      allergenItems[j]._allergenId = algRows[j]?.id ?? null;
    }
  }

  // Bulk insert food items
  const { error: foodErr } = await supabase
    .from('food_item')
    .insert(allItems.map(item => ({
      menu_category_id: item.categoryId,
      name: item.name,
      nutrition_id: item._nutritionId ?? null,
      allergens_id: item._allergenId ?? null,
    })));
  if (foodErr) throw new Error(`food_item insert: ${foodErr.message}`);

  console.log(`  ✅ ${meals.length} meals, ${allItems.length} items`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const targetDate = process.argv[2] || new Date().toISOString().split('T')[0];
console.log(`\n🍽️  Scraping UMich dining menus for ${targetDate}\n`);

const locationMap = await getLocationMap();

for (const hall of DINING_HALLS) {
  const locationId = locationMap[hall.name];
  if (!locationId) {
    console.log(`${hall.name}: not found in Supabase`);
    continue;
  }
  process.stdout.write(`${hall.name}... `);
  try {
    await scrapeHall(hall, targetDate, locationId);
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
  }
}

console.log('\n🎉 Done!');
