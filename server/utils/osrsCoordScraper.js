// osrs-coordinate-scraper.js
// Run with: node osrs-coordinate-scraper.js

const axios = require('axios');
const cheerio = require('cheerio');

// Your existing locations (we'll update their coordinates)
const LOCATIONS_TO_UPDATE = [
  // Misthalin
  'Lumbridge',
  'Draynor Village',
  'Al Kharid',
  // Asgarnia
  'Falador',
  'Port Sarim',
  'Rimmington',
  'Taverley', // Note: Wiki uses "Taverley" not "Taverly"
  'Burthorpe',
  'White Wolf Mountain',
  'Goblin Village',
  // Kandarin
  'Catherby',
  "Seers' Village", // Wiki uses apostrophe
  'Ardougne',
  'Yanille',
  'Tree Gnome Stronghold',
  'Tree Gnome Village',
  'Fishing Guild',
  'Barbarian Village',
  'Grand Tree',
  // Varrock & Surroundings
  'Varrock',
  'Edgeville',
  'Grand Exchange',
  // Morytania
  'Canifis',
  'Port Phasmatys',
  'Burgh de Rott',
  'Darkmeyer',
  'Slepe',
  'Barrows',
  "Mos Le'Harmless",
  // Karamja
  'Brimhaven',
  'Shilo Village',
  'Tai Bwo Wannai',
  'Musa Point',
  // Desert
  'Pollnivneach',
  'Nardah',
  'Sophanem',
  'Menaphos',
  'Uzer',
  // Fremennik
  'Rellekka',
  'Neitiznot',
  'Jatizso',
  'Miscellania',
  'Waterbirth Island',
  // Tirannwn
  'Prifddinas',
  'Lletya',
  'Zul-Andra',
  // Kourend
  'Shayzien',
  'Lovakengj',
  'Arceuus',
  'Hosidius',
  'Piscarilius',
  'Wintertodt Camp',
  'Mount Karuulm',
  // Varlamore
  'Civitas illa Fortis',
  'Fortis Colosseum',
  'Cam Torum',
  // Islands
  'Fossil Island',
  'Crandor',
  'Entrana',
  'Lunar Isle',
  'Ape Atoll',
  // Special Areas
  'Duel Arena',
  "Champions' Guild",
  "Warriors' Guild",
  "Myths' Guild",
  'Corsair Cove',
];

/**
 * Fetch coordinates from OSRS Wiki using their API
 */
async function fetchCoordinatesFromWiki() {
  const updatedLocations = [];
  const notFound = [];

  console.log('🔍 Starting coordinate fetch from OSRS Wiki...\n');

  for (const locationName of LOCATIONS_TO_UPDATE) {
    try {
      // The OSRS Wiki API endpoint for searching
      const searchUrl = `https://oldschool.runescape.wiki/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        locationName
      )}&format=json`;

      const searchResponse = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'OSRS-Bingo-Hub-Coordinate-Updater/1.0',
        },
      });

      if (searchResponse.data.query.search.length === 0) {
        console.log(`❌ Not found: ${locationName}`);
        notFound.push(locationName);
        continue;
      }

      // Get the page ID of the first search result
      const pageTitle = searchResponse.data.query.search[0].title;

      // Fetch the actual page content
      const pageUrl = `https://oldschool.runescape.wiki/api.php?action=query&prop=revisions&titles=${encodeURIComponent(
        pageTitle
      )}&rvprop=content&format=json`;

      const pageResponse = await axios.get(pageUrl, {
        headers: {
          'User-Agent': 'OSRS-Bingo-Hub-Coordinate-Updater/1.0',
        },
      });

      const pages = pageResponse.data.query.pages;
      const pageId = Object.keys(pages)[0];

      if (!pages[pageId].revisions) {
        console.log(`❌ No content for: ${locationName}`);
        notFound.push(locationName);
        continue;
      }

      const content = pages[pageId].revisions[0]['*'];

      // Look for coordinates in the wiki markup
      // Common patterns: {{Map|x|y}}, |x=3222|y=3218, |location=3222,3218
      const patterns = [
        /\{\{[Mm]ap\|(\d+)\|(\d+)/,
        /\|x\s*=\s*(\d+)\s*\|y\s*=\s*(\d+)/,
        /\|location\s*=\s*(\d+),\s*(\d+)/,
        /\|coordinates\s*=\s*(\d+),\s*(\d+)/,
        /coords\s*=\s*(\d+),\s*(\d+)/,
      ];

      let coords = null;
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          coords = { x: parseInt(match[1]), y: parseInt(match[2]) };
          break;
        }
      }

      if (coords) {
        updatedLocations.push({
          name: locationName,
          wikiName: pageTitle,
          x: coords.x,
          y: coords.y,
        });
        console.log(`✅ Found: ${locationName} -> (${coords.x}, ${coords.y})`);
      } else {
        console.log(`⚠️  No coords in page: ${locationName}`);
        notFound.push(locationName);
      }

      // Be nice to the wiki server
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error fetching ${locationName}:`, error.message);
      notFound.push(locationName);
    }
  }

  return { updatedLocations, notFound };
}

/**
 * Alternative: Scrape from the interactive map page
 */
async function scrapeInteractiveMap() {
  console.log('\n📍 Attempting to scrape from interactive map...\n');

  try {
    // The interactive map data is often stored in JSON
    const response = await axios.get('https://oldschool.runescape.wiki/w/World_map#mapFullscreen', {
      headers: {
        'User-Agent': 'OSRS-Bingo-Hub-Coordinate-Updater/1.0',
      },
    });

    const $ = cheerio.load(response.data);

    // Look for embedded JSON data
    const scriptTags = $('script').toArray();

    for (const script of scriptTags) {
      const content = $(script).html();
      if ((content && content.includes('mapData')) || content.includes('coordinates')) {
        // Extract JSON data if present
        const jsonMatch = content.match(/(\{[^]*\})/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            console.log('Found map data:', Object.keys(data).slice(0, 5), '...');
            return data;
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scraping interactive map:', error.message);
  }

  return null;
}

/**
 * Generate the updated OSRS_LOCATIONS array
 */
function generateUpdatedArray(locations) {
  console.log('\n📝 Generating updated OSRS_LOCATIONS array...\n');

  const grouped = {
    Misthalin: [],
    Asgarnia: [],
    Kandarin: [],
    'Varrock & Surroundings': [],
    Wilderness: [],
    Morytania: [],
    Karamja: [],
    'Desert (Kharidian)': [],
    'Fremennik Province': [],
    'Tirannwn (Elf Lands)': [],
    Kourend: [],
    Varlamore: [],
    'Islands & Special Areas': [],
  };

  // Group locations by region (you may need to adjust this logic)
  locations.forEach((loc) => {
    const name = loc.name.toLowerCase();

    if (name.includes('lumbridge') || name.includes('draynor') || name.includes('al kharid')) {
      grouped['Misthalin'].push(loc);
    } else if (name.includes('falador') || name.includes('taverly') || name.includes('burthorpe')) {
      grouped['Asgarnia'].push(loc);
    } else if (name.includes('ardougne') || name.includes('yanille') || name.includes('catherby')) {
      grouped['Kandarin'].push(loc);
    } else if (name.includes('varrock') || name.includes('edgeville')) {
      grouped['Varrock & Surroundings'].push(loc);
    } else if (name.includes('wilderness')) {
      grouped['Wilderness'].push(loc);
    } else if (name.includes('canifis') || name.includes('morytania') || name.includes('slepe')) {
      grouped['Morytania'].push(loc);
    } else if (name.includes('karamja') || name.includes('brimhaven')) {
      grouped['Karamja'].push(loc);
    } else if (
      name.includes('pollnivneach') ||
      name.includes('nardah') ||
      name.includes('sophanem')
    ) {
      grouped['Desert (Kharidian)'].push(loc);
    } else if (
      name.includes('rellekka') ||
      name.includes('neitiznot') ||
      name.includes('jatizso')
    ) {
      grouped['Fremennik Province'].push(loc);
    } else if (name.includes('prifddinas') || name.includes('lletya')) {
      grouped['Tirannwn (Elf Lands)'].push(loc);
    } else if (name.includes('kourend') || name.includes('shayzien') || name.includes('hosidius')) {
      grouped['Kourend'].push(loc);
    } else if (name.includes('varlamore') || name.includes('civitas') || name.includes('fortis')) {
      grouped['Varlamore'].push(loc);
    } else {
      grouped['Islands & Special Areas'].push(loc);
    }
  });

  // Generate the JavaScript array
  let output = 'const OSRS_LOCATIONS = [\n';

  for (const [region, locs] of Object.entries(grouped)) {
    if (locs.length === 0) continue;

    output += `  // ${region}\n`;
    locs.forEach((loc) => {
      output += `  { name: '${loc.name}', x: ${loc.x}, y: ${loc.y} },\n`;
    });
    output += '\n';
  }

  output += '];\n\nexport default OSRS_LOCATIONS;';

  return output;
}

// Main execution
async function main() {
  console.log('🚀 OSRS Coordinate Updater\n');
  console.log('='.repeat(50));

  // Try fetching from Wiki API
  const { updatedLocations, notFound } = await fetchCoordinatesFromWiki();

  if (updatedLocations.length > 0) {
    // Generate the updated array
    const updatedCode = generateUpdatedArray(updatedLocations);

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('updated_osrs_locations.js', updatedCode);

    console.log('\n✅ Success! Updated coordinates saved to: updated_osrs_locations.js');
    console.log(`📊 Found: ${updatedLocations.length} locations`);

    if (notFound.length > 0) {
      console.log(`\n⚠️  Could not find ${notFound.length} locations:`);
      notFound.forEach((name) => console.log(`  - ${name}`));
      console.log('\nThese may need manual updating or different search terms.');
    }
  } else {
    console.log('\n❌ No coordinates found. You may need to update manually.');
  }

  // Try the interactive map as backup
  console.log('\n🔄 Attempting backup method...');
  const mapData = await scrapeInteractiveMap();
  if (mapData) {
    console.log('📦 Map data found! Check console for structure.');
  }
}

// Run the script
main().catch(console.error);
