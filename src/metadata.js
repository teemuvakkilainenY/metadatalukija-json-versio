import data from './data.js';

export function emptyForm() {
  return {
    customId: '',
    trackNumber: '',
    albumName: '',
    trackName: '',
    catalogueNumber: '',
    isrc: '',
    recordingYear: '',
    publicationYear: '',
    recordLabel: '',
    culture: '',
    keyword: '',
    recordingCountry: '',
    subGenre: '',
    workNotes: '',
    artistNotes: '',
    audioFileName: '',
    languages: [],
    genres: [],
    ensembles: [],
    finnishContent: false,
    yleMaster: false,
    recordingCountryEstimated: false,
    performers: [],
    authors: [],
  };
}

export function validate(form) {
  if (!/^DIGI-\d+$/.test(form.customId)) return 'Kartuntatunnuksen täytyy olla muotoa DIGI-12345.';
  // Match the desktop application's signed 32-bit integer validation.
  const trackNumber = Number(form.trackNumber);
  if (
    !/^[+-]?\d+$/.test(form.trackNumber.trim()) ||
    trackNumber < -2147483648 || trackNumber > 2147483647
  ) {
    return 'Uranumeron on oltava kokonaisluku.';
  }
  if (!form.trackName.trim()) return 'Kappaleen nimi ei voi olla tyhjä.';
  return '';
}
const split = value => value.split(',').filter(v => v.length).map(v => v.trim());

export function createMetadata(form) {
  const error = validate(form);
  if (error) throw new Error(error);
  // Clone the original template so its unused fields and defaults survive each export.
  const json = JSON.parse(JSON.stringify(data.template));
  const track = json.tracks[0];
  const album = track.album;
  const number = Number(form.trackNumber);
  const paddedTrackNumber = (number < 0 ? '-' : '') + String(Math.abs(number)).padStart(2, '0');
  // Keep the entered track number; padding applies only to the custom identifier.
  Object.assign(track, {
    track_number: form.trackNumber,
    title: form.trackName,
    isrc: form.isrc
  });
  track.audiofile.original.file_name = form.audioFileName || null;
  const shared = {
    finnish_content: form.finnishContent ? 'yes' : 'no',
    yle_master: form.yleMaster ? 'yes' : 'no',
    publication_year: form.publicationYear,
    recording_country: form.recordingCountry,
    recording_country_estimated: form.recordingCountryEstimated ? 'yes' : 'no'
  };
  Object.assign(track.custom, shared, {
    CustomID: form.customId + '-' + paddedTrackNumber,
    languages: form.languages.map(v => v.trim()).filter(Boolean),
    genre: form.genres.map(v => data.genre[v] ?? ''),
    ensemble: form.ensembles.map(v => data.ensemble[v] ?? ''),
    sub_genre: split(form.subGenre).filter(Boolean),
    origin: form.culture,
    theme: form.keyword,
    work_notes: form.workNotes,
    artist_notes: form.artistNotes
  });
  // The original exporter uses one space for an empty album title and omits recordingYear.
  Object.assign(album, {
    title: form.albumName.trim() || ' ',
    album_ref: form.catalogueNumber
  });
  Object.assign(album.custom, shared, {
    CustomID: form.customId,
    WorkflowStatus: 'Täydet_tiedot',
    genre: [...new Set(form.genres.map(v => data.genre[['KMUS', 'VMUS'].includes(v) ? v : v.slice(0, 2)] ?? ''))]
  });
  album.master_ownerships[0].label.label_name = form.recordLabel;
  track.artists_master_ownerships = form.performers.filter(p => p.name.trim()).map(p => ({
    artist: {
      full_name: p.name.trim()
    },
    rights_type: {
      key: 'musician',
      type: 'master-artist'
    },
    instruments: p.detail.trim() ? split(p.detail).map(v => ({
      key: v,
      names: [{
        value: v
      }]
    })) : []
  }));
  // Album performers share the names, but only track performers carry instruments.
  album.artists_master_ownerships = track.artists_master_ownerships.map(p => ({
    ...JSON.parse(JSON.stringify(p)),
    instruments: []
  }));
  // One writer can produce several role entries; a blank role becomes generic "author".
  track.artists_publishing_ownerships = form.authors.filter(p => p.name.trim()).flatMap(p => (p.detail.trim() ? split(p.detail) : ['']).map(role => {
    const lower = role.toLowerCase();
    const key = {
      'säv': 'composer',
      'sov': 'arranger',
      'san': 'lyricist'
    }[lower] || 'author';
    const author = {
      artist: {
        full_name: p.name.trim()
      },
      rights_type: {
        key,
        type: 'publishing-artist'
      }
    };
    if (key === 'author' && lower) author.additional_notes = lower;
    return author;
  }));
  return json;
}
