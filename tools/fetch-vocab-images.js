const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'n5-data.js');
const outDir = path.join(root, 'assets', 'vocab');
const manifestPath = path.join(outDir, 'manifest.json');
const attributionPath = path.join(outDir, 'attribution.json');
const saveLocal = process.argv.includes('--save-local');
const refresh = process.argv.includes('--refresh');
process.stdout.on('error', () => {});

function progress(msg) {
  try { process.stdout.write(msg); } catch (_) {}
}

const windowShim = {};
global.window = windowShim;
eval(fs.readFileSync(dataPath, 'utf8'));

const stopWords = new Set(['to', 'a', 'an', 'the', 'one', 'this', 'that', 'with', 'for', 'of', 'and', 'or', 'polite']);
const manualQueries = {
  v001: 'person self portrait',
  v002: 'person pointing at viewer',
  v003: 'man portrait',
  v004: 'woman portrait',
  v005: 'hand holding object',
  v006: 'object on table',
  v007: 'distant object landscape',
  v008: 'selection of objects',
  v009: 'near object',
  v010: 'object near person',
  v011: 'distant object',
  v012: 'choice between objects',
  v013: 'standing here sign',
  v014: 'there direction sign',
  v015: 'distant place',
  v016: 'map location question',
  v017: 'person showing direction',
  v018: 'person showing direction',
  v019: 'distant direction sign',
  v020: 'two directions signpost',
  v021: 'unknown person silhouette',
  v022: 'polite person portrait',
  v023: 'question mark objects',
  v024: 'calendar clock',
  v025: 'person thinking how',
  v026: 'person asking why',
  v027: 'price tag',
  v028: 'counting objects',
  v029: 'yes sign',
  v030: 'no sign',
  v348: 'ice cube cold touch'
};

function cleanQuery(v) {
  if (manualQueries[v.id]) return manualQueries[v.id];
  let text = String(v.en || '')
    .split(';')[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/\bto be\b/gi, '')
    .replace(/\bto\b/gi, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w && !stopWords.has(w))
    .slice(0, 5)
    .join(' ');
  if (!text) text = String(v.cat || 'japanese vocabulary').toLowerCase();
  const categoryHints = {
    Places: 'place',
    Food: 'food',
    Family: 'person',
    Weather: 'weather',
    Transport: 'transport',
    Verbs: 'action',
    Adjectives: 'comparison',
    Time: 'time',
    Culture: 'japan'
  };
  return `${text} ${categoryHints[v.cat] || ''}`.trim();
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

async function getText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {rejectUnauthorized: false, headers: {'User-Agent': 'N5Pathfinder/1.0 vocabulary image curation'}}, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        getText(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`GET ${res.statusCode}`));
        res.resume();
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function api(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: query,
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '640',
    format: 'json'
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return JSON.parse(await getText(`https://commons.wikimedia.org/w/api.php?${params}`));
    } catch (err) {
      if (!/429/.test(err.message) || attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 15000 * (attempt + 1)));
    }
  }
}

async function openverseApi(query) {
  const params = new URLSearchParams({
    q: query,
    license_type: 'commercial',
    per_page: '20'
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return JSON.parse(await getText(`https://api.openverse.engineering/v1/images/?${params}`));
    } catch (err) {
      if (!/429/.test(err.message) || attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 15000 * (attempt + 1)));
    }
  }
}

function scoreOpenverse(item, query) {
  if (!item || item.mature || !item.thumbnail) return -999;
  const text = [
    item.title,
    item.category,
    item.provider,
    ...(item.tags || []).map(t => t.name)
  ].join(' ').toLowerCase();
  let score = 0;
  for (const term of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (String(item.title || '').toLowerCase().includes(term)) score += 9;
    if (text.includes(term)) score += 4;
  }
  if ((item.width || 0) >= 400 && (item.height || 0) >= 300) score += 3;
  if (/flickr|wikimedia|met/i.test(item.provider || '')) score += 2;
  if (/logo|icon|diagram|map|chart|screenshot|text|poster|sign/i.test(text)) score -= 10;
  if (/by|by-sa|cc0|pdm/i.test(item.license || '')) score += 4;
  if (/nd/i.test(item.license || '')) score -= 2;
  return score;
}

async function findOpenverse(v, query) {
  const json = await openverseApi(query);
  const best = (json.results || [])
    .map(item => ({item, score: scoreOpenverse(item, query)}))
    .sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 1) throw new Error('no suitable Openverse result');
  const item = best.item;
  return {
    manifestUrl: item.thumbnail || item.url,
    attribution: {
      word: v.jp,
      reading: v.kana,
      meaning: v.en,
      query,
      file: item.thumbnail || item.url,
      source: item.foreign_landing_url || item.detail_url || item.url,
      title: item.title || query,
      author: item.creator || 'Openverse indexed creator',
      license: `${String(item.license || '').toUpperCase()} ${item.license_version || ''}`.trim(),
      licenseUrl: item.license_url || '',
      provider: item.provider || item.source || 'Openverse',
      attributionText: item.attribution || ''
    }
  };
}

function scoreCandidate(page, query) {
  const info = page.imageinfo && page.imageinfo[0];
  if (!info || !/^image\/(jpeg|png|webp)$/i.test(info.mime || '')) return -999;
  const title = String(page.title || '').toLowerCase();
  const meta = info.extmetadata || {};
  const desc = stripHtml(meta.ImageDescription && meta.ImageDescription.value).toLowerCase();
  const license = stripHtml(meta.LicenseShortName && meta.LicenseShortName.value);
  let score = 0;
  for (const term of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (title.includes(term)) score += 8;
    if (desc.includes(term)) score += 3;
  }
  if (/\.jpg|\.jpeg/i.test(title)) score += 4;
  if (/photo|photograph|bild|image/i.test(title + ' ' + desc)) score += 3;
  if (/logo|icon|map|chart|diagram|flag|coat of arms|svg|symbol/i.test(title + ' ' + desc)) score -= 12;
  if (/cc0|public domain/i.test(license)) score += 8;
  if (/cc by/i.test(license)) score += 4;
  const w = info.thumbwidth || info.width || 0;
  const h = info.thumbheight || info.height || 0;
  if (w >= 260 && h >= 180) score += 4;
  return score;
}

async function download(url, dest) {
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, {rejectUnauthorized: false, headers: {'User-Agent': 'N5Pathfinder/1.0'}}, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(dest, () => {});
        download(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`download ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  fs.mkdirSync(outDir, {recursive: true});
  const manifest = refresh ? {} : fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const attribution = refresh ? {} : fs.existsSync(attributionPath) ? JSON.parse(fs.readFileSync(attributionPath, 'utf8')) : {};
  const missingPath = path.join(outDir, 'missing-real-images.json');
  const failures = refresh ? [] : fs.existsSync(missingPath) ? JSON.parse(fs.readFileSync(missingPath, 'utf8')) : [];
  const vocab = windowShim.N5_DATA.vocab;

  for (let i = 0; i < vocab.length; i++) {
    const v = vocab[i];
    if (!refresh && attribution[v.id] && manifest[v.id] && !String(manifest[v.id]).endsWith('.svg')) {
      continue;
    }
    const query = cleanQuery(v);
    try {
      let picked;
      try {
        picked = await findOpenverse(v, query);
      } catch (_) {}
      if (picked) {
        manifest[v.id] = picked.manifestUrl;
        attribution[v.id] = picked.attribution;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        fs.writeFileSync(attributionPath, JSON.stringify(attribution, null, 2), 'utf8');
        progress(`\r${i + 1}/${vocab.length} ${v.id} ${query}`.padEnd(90));
        await new Promise(r => setTimeout(r, 550));
        continue;
      }

      const json = await api(query);
      const pages = Object.values((json.query && json.query.pages) || {});
      const best = pages
        .map(p => ({page: p, score: scoreCandidate(p, query)}))
        .sort((a, b) => b.score - a.score)[0];
      if (!best || best.score < 1) throw new Error('no suitable bitmap result');
      const info = best.page.imageinfo[0];
      const ext = /^image\/png/i.test(info.mime) ? 'png' : /^image\/webp/i.test(info.mime) ? 'webp' : 'jpg';
      const file = `${v.id}.${ext}`;
      const rel = `assets/vocab/${file}`;
      const imageUrl = info.thumburl || info.url;
      if (saveLocal) await download(imageUrl, path.join(outDir, file));
      const meta = info.extmetadata || {};
      manifest[v.id] = saveLocal ? rel : imageUrl;
      attribution[v.id] = {
        word: v.jp,
        reading: v.kana,
        meaning: v.en,
        query,
        file: saveLocal ? rel : imageUrl,
        source: info.descriptionurl || info.url,
        title: best.page.title,
        author: stripHtml(meta.Artist && meta.Artist.value) || stripHtml(meta.Credit && meta.Credit.value) || 'Wikimedia Commons contributor',
        license: stripHtml(meta.LicenseShortName && meta.LicenseShortName.value) || 'See source',
        licenseUrl: stripHtml(meta.LicenseUrl && meta.LicenseUrl.value),
        attributionRequired: stripHtml(meta.AttributionRequired && meta.AttributionRequired.value)
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      fs.writeFileSync(attributionPath, JSON.stringify(attribution, null, 2), 'utf8');
      progress(`\r${i + 1}/${vocab.length} ${v.id} ${query}`.padEnd(90));
      await new Promise(r => setTimeout(r, 900));
    } catch (err) {
      const existing = failures.findIndex(x => x.id === v.id);
      const failure = {id: v.id, word: v.jp, meaning: v.en, query, error: err.message};
      if (existing >= 0) failures[existing] = failure;
      else failures.push(failure);
      manifest[v.id] = `assets/vocab/${v.id}.svg`;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      fs.writeFileSync(missingPath, JSON.stringify(failures, null, 2), 'utf8');
      await new Promise(r => setTimeout(r, /429/.test(err.message) ? 5000 : 900));
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(attributionPath, JSON.stringify(attribution, null, 2), 'utf8');
  fs.writeFileSync(missingPath, JSON.stringify(failures, null, 2), 'utf8');
  console.log(`\nDone. Real images: ${Object.keys(attribution).length}. Fallbacks: ${failures.length}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
