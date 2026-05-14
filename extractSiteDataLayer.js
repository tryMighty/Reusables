// === COMPLETE DATA EXTRACTION ===
const siteData = {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  
  // Window variables
  windowData: {},
  
  // JSON scripts
  jsonScripts: [],
  
  // Inline script data
  inlineData: []
};

// 1. Check all common window variables
const commonVars = [
  'initialData', '__INITIAL_STATE__', '__NEXT_DATA__', 
  '__PRELOADED_STATE__', '__DATA__', 'pageData', 
  'APP_STATE', '__APOLLO_STATE__', '__REDUX_STATE__',
  'appData', 'serverData', '__NUXT__'
];

commonVars.forEach(v => {
  if (window[v] !== undefined) {
    siteData.windowData[v] = window[v];
  }
});

// 2. Get all window properties that look like data
Object.keys(window).forEach(key => {
  if (key.startsWith('__') || key.includes('DATA') || key.includes('STATE')) {
    try {
      const val = window[key];
      if (typeof val === 'object' && val !== null && !val.constructor.toString().includes('native code')) {
        siteData.windowData[key] = val;
      }
    } catch(e) {}
  }
});

// 3. Extract JSON from script tags
document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]').forEach((script, i) => {
  try {
    siteData.jsonScripts.push({
      index: i,
      id: script.id || null,
      data: JSON.parse(script.textContent)
    });
  } catch(e) {
    console.warn('Failed to parse script', i, e);
  }
});

// 4. Find data assignments in inline scripts
document.querySelectorAll('script:not([src])').forEach((script, i) => {
  const text = script.textContent;
  // Look for window.X = {...}
  const matches = text.match(/window\.(\w+)\s*=\s*({[\s\S]*?});/g);
  if (matches) {
    siteData.inlineData.push({
      scriptIndex: i,
      assignments: matches
    });
  }
});

// Copy to clipboard
copy(JSON.stringify(siteData, null, 2));
console.log('✓ Data layer extracted and copied to clipboard');
console.log('Window variables found:', Object.keys(siteData.windowData));
console.log('JSON scripts found:', siteData.jsonScripts.length);
