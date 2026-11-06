import { emptyForm } from './metadata';
import data from './data';
const list = value => (Array.isArray(value) ? value : value == null ? [] : [value]).map(String).filter(v => v.trim());
const text = value => list(value).join(', ');
const year = value => String(value ?? '').match(/\d{4}/)?.[0] || '';
// Match AudioWpfApp: comma, ampersand and the word "and" separate people.
const people = value => [...new Set(list(value).flatMap(v => v.split(/&|,| and /)).map(v => v.trim()).filter(Boolean))];
const cleanIsrc = value => String(value).split(':').pop().trim();
export function extractIsrc(metadata) {
  const common = list(metadata.common?.isrc).map(cleanIsrc).filter(Boolean);
  if (common.length) return common.join(', ');
  const tags = Object.values(metadata.native || {}).flat();
  // Port metadata-composer's native-tag fallbacks, including MP4's trailing-space xid tag.
  let nativeIsrc = '';
  for (const tag of tags) {
    const id = String(tag.id).toLowerCase();
    if (id === 'xid ' && typeof tag.value === 'string') {
      const match = tag.value.match(/isrc:([A-Z0-9]+)/i);
      if (match) nativeIsrc = match[1];
    }
    if (id.includes('isrc') || id.includes('ufid') || id === 'tsrc') {
      const value = typeof tag.value === 'string' ? tag.value : tag.value?.identifier;
      if (typeof value === 'string') nativeIsrc = cleanIsrc(value);else if (value instanceof Uint8Array || Array.isArray(value)) {
        nativeIsrc = cleanIsrc(Array.from(value, byte => String.fromCharCode(byte)).join('').split(String.fromCharCode(0)).join(''));
      }
    }
  }
  if (nativeIsrc) return nativeIsrc;
  const values = pattern => tags.filter(tag => pattern.test(tag.id)).flatMap(tag => {
    const value = tag.value;
    return list(value && typeof value === 'object' && !Array.isArray(value) ? value.text ?? value.value : value);
  }).map(cleanIsrc).filter(Boolean);
  const explicit = values(/(?:^|[:/])(?:ISRC|TSRC)$/i);
  if (explicit.length) return [...new Set(explicit)].join(', ');
  // The desktop app also reads Vendor, taking the last colon-separated part.
  return [...new Set(values(/(?:^|[:/])VENDOR$/i))].join(', ');
}
export function formFromMetadata(metadata, filename) {
  const tags = metadata.common || {};
  const form = {
    ...emptyForm(),
    audioFileName: filename
  };
  Object.assign(form, {
    trackName: text(tags.title),
    albumName: text(tags.album),
    trackNumber: tags.track?.no == null ? '' : String(tags.track.no),
    isrc: extractIsrc(metadata),
    catalogueNumber: text(tags.catalognumber),
    publicationYear: year(tags.releasedate || tags.year || tags.date),
    recordingYear: year(tags.recordingdate),
    recordLabel: text(tags.label || tags.copyright)
  });
  form.performers = people(tags.artists?.length ? tags.artists : tags.artist).map(name => ({
    name,
    detail: ''
  }));
  for (const key of ['composer', 'lyricist', 'arranger']) {
    for (const name of people(tags[key])) {
      const person = form.authors.find(p => p.name === name);
      if (!person) form.authors.push({
        name,
        detail: ''
      });
    }
  }
  const languageNames = {
    fin: 'suomi',
    fi: 'suomi',
    eng: 'englanti',
    en: 'englanti',
    swe: 'ruotsi',
    sv: 'ruotsi',
    kor: 'korea',
    ko: 'korea',
    sme: 'saame',
    se: 'saame'
  };
  form.languages = [...new Set(list(tags.language).flatMap(v => v.split(String.fromCharCode(0)).flatMap(s => s.split(/[,;]/))).map(v => languageNames[v.trim().toLowerCase()] || v.trim()).filter(Boolean))];
  // Only exact original classifications are safe to translate into the export codes.
  form.genres = list(tags.genre).map(v => Object.keys(data.genre).find(code => code === v || data.genre[code] === v)).filter(Boolean);
  return {
    form: form,
    notice: ''
  };
}
export async function readAudioMetadata(file) {
  const {
    parseBlob
  } = await import('music-metadata');
  return formFromMetadata(await parseBlob(file, {
    skipCovers: true,
    duration: false
  }), file.name);
}
