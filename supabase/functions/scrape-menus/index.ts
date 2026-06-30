import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DINING_HALLS = [
  'Bursley Dining Hall',
  'East Quad Dining Hall',
  'Markley Dining Hall',
  'North Quad Dining Hall',
  'South Quad Dining Hall',
  'Mosher-Jordan Dining Hall',
];

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function fetchMenu(locationName: string, date: string) {
  const url = `https://api.studentlife.umich.edu/menu/xml2print.php?controller=print&view=json&location=${encodeURIComponent(locationName)}&date=${date}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://dining.umich.edu/',
      'Accept': 'application/json, text/plain, */*',
    },
  });

  if (!res.ok) return { data: null, status: res.status };
  const text = await res.text();
  if (!text.trim()) return { data: null, status: res.status };
  try {
    return { data: JSON.parse(text), status: res.status };
  } catch {
    return { data: null, status: res.status };
  }
}

Deno.serve(async (req) => {
  const { date } = await req.json().catch(() => ({}));
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const results: Record<string, string> = {};

  for (const hallName of DINING_HALLS) {
    const { data: menuData, status } = await fetchMenu(hallName, targetDate);

    if (!menuData) {
      results[hallName] = `HTTP ${status}`;
      continue;
    }

    // Get location ID
    const { data: loc } = await supabase.from('location').select('id').eq('name', hallName).single();
    if (!loc) { results[hallName] = 'location not found'; continue; }

    // Clear existing menus for this date
    await supabase.from('menu').delete().eq('location_id', loc.id).eq('date', targetDate);

    const meals = menuData?.menu?.meal ?? menuData?.menu ?? [];
    const mealsArray = Array.isArray(meals) ? meals : [meals];

    let totalItems = 0;

    for (const meal of mealsArray) {
      const mealName = meal.name ?? meal['@name'] ?? 'Menu';

      const { data: menuRow } = await supabase
        .from('menu')
        .insert({ location_id: loc.id, name: mealName, date: targetDate })
        .select('id')
        .single();

      if (!menuRow) continue;

      const courses = meal.course ?? [];
      const coursesArray = Array.isArray(courses) ? courses : [courses];

      for (const course of coursesArray) {
        const courseName = course.name ?? course['@name'] ?? 'Items';
        const items = course.menuitem ?? course.item ?? [];
        const itemsArray = Array.isArray(items) ? items : [items];
        if (itemsArray.length === 0) continue;

        const { data: catRow } = await supabase
          .from('menu_category')
          .insert({ menu_id: menuRow.id, title: courseName })
          .select('id')
          .single();

        if (!catRow) continue;

        for (const item of itemsArray) {
          const itemName = item.name ?? item['@name'] ?? item;
          if (!itemName || typeof itemName !== 'string') continue;

          let nutritionId = null;
          let allergensId = null;

          if (item.nutrition) {
            const n = item.nutrition;
            const { data: nRow } = await supabase.from('nutrition').insert({
              calories: parseInt(n.calories) || null,
              calories_from_fat: parseInt(n.caloriesfromfat) || null,
              total_fat: parseFloat(n.totalfat) || null,
              saturated_fat: parseFloat(n.saturatedfat) || null,
              trans_fat: parseFloat(n.transfat) || null,
              cholesterol: parseFloat(n.cholesterol) || null,
              sodium: parseFloat(n.sodium) || null,
              total_carbohydrates: parseFloat(n.totalcarbohydrates) || null,
              dietary_fiber: parseFloat(n.dietaryfiber) || null,
              total_sugars: parseFloat(n.sugars) || null,
              protein: parseFloat(n.protein) || null,
              vitamin_d: parseFloat(n.vitamind) || null,
              calcium: parseFloat(n.calcium) || null,
              iron: parseFloat(n.iron) || null,
              potassium: parseFloat(n.potassium) || null,
            }).select('id').single();
            nutritionId = nRow?.id ?? null;
          }

          if (item.allergens || item.mealFilters) {
            const a = item.allergens ?? {};
            const f = item.mealFilters ?? {};
            const { data: aRow } = await supabase.from('allergens').insert({
              milk: !!(a.milk || a.dairy),
              egg: !!(a.egg || a.eggs),
              fish: !!a.fish,
              shellfish: !!a.shellfish,
              tree_nuts: !!(a.treenuts || a['tree-nuts']),
              peanuts: !!a.peanuts,
              wheat: !!(a.wheat || a.gluten),
              soy: !!a.soy,
              sesame_seeds: !!(a.sesame || a.sesame_seeds),
              beef: !!a.beef,
              pork: !!a.pork,
              halal: !!(f.halal || a.halal),
              vegan: !!(f.vegan || a.vegan),
              vegetarian: !!(f.vegetarian || a.vegetarian),
            }).select('id').single();
            allergensId = aRow?.id ?? null;
          }

          await supabase.from('food_item').insert({
            menu_category_id: catRow.id,
            name: itemName,
            nutrition_id: nutritionId,
            allergens_id: allergensId,
          });
          totalItems++;
        }
      }
    }

    results[hallName] = `${totalItems} items inserted`;
  }

  return new Response(JSON.stringify({ date: targetDate, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});
