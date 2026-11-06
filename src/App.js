import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import data from './data';
import { readAudioMetadata } from './audio';
import { emptyForm, createMetadata } from './metadata';
import { TextField, Checkbox, Section, MultiSelect, People } from './FormFields';

const languages = [...new Set([
  'suomi', 'englanti', 'ruotsi', 'korea', 'saame', ...data.languages,
])].map(language => [language, language]);

function downloadJson(json, filename) {
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [output, setOutput] = useState(null);
  const [error, setError] = useState('');
  const importVersion = useRef(0);
  const fileInput = useRef(null);

  useEffect(() => () => { importVersion.current++; }, []);

  async function loadFile(file) {
    if (!file) return;

    const version = ++importVersion.current;
    setForm({ ...emptyForm(), audioFileName: file.name });
    setOutput(null);
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const result = await readAudioMetadata(file);
      if (version !== importVersion.current) return;
      setForm(result.form);
      setNotice(result.notice || '');
    } catch {
      if (version !== importVersion.current) return;
      setError('Audiotiedoston metatietoja ei voitu lukea.');
    } finally {
      if (version === importVersion.current) setLoading(false);
    }
  }

  function updateField(name, value) {
    setForm(current => ({ ...current, [name]: value }));
    setOutput(null);
    setError('');
  }

  function handleFileSelection(event) {
    loadFile(event.target.files[0]);
    // Allow the same file to be selected again and imported afresh.
    event.target.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    loadFile(event.dataTransfer.files[0]);
  }

  function handleSubmit(event) {
    event.preventDefault();
    try {
      setOutput(createMetadata(form));
      setError('');
    } catch (error) {
      setError(error.message);
    }
  }

  function clearForm() {
    if (!window.confirm('Haluatko varmasti tyhjentää lomakkeen?')) return;
    importVersion.current++;
    setLoading(false);
    setNotice('');
    if (fileInput.current) fileInput.current.value = '';
    setForm(emptyForm());
    setOutput(null);
    setError('');
  }

  const fieldProps = { form, onChange: updateField };
  const filename = (form.audioFileName.replace(/\.[^.]+$/, '') || 'output') + '.json';

  return (
    <main onDragOver={event => event.preventDefault()} onDrop={handleDrop}>
      <h1>Musiikin metatietolukija</h1>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Audiotiedosto</legend>
          <label>
            Valitse audiotiedosto
            <input
              ref={fileInput}
              type="file"
              accept="audio/*,.flac,.mp3,.m4a,.ogg,.opus,.wav,.aif,.aiff,.wma"
              onChange={handleFileSelection}
            />
          </label>
          <p><small>Valitse tai pudota audiotiedosto.</small></p>
          {loading && <p role="status">Luetaan metatietoja…</p>}
          {notice && <p role="status">{notice}</p>}
          <TextField {...fieldProps} name="audioFileName" label="Audiotiedoston nimi" placeholder="kappale.wav" />
        </fieldset>

        <fieldset disabled={loading} className="form-content">
          <Section title="Perustiedot">
            <TextField {...fieldProps} name="customId" label="Kartuntatunnus *"
              placeholder="DIGI-12345" required pattern="DIGI-[0-9]+" />
            <TextField {...fieldProps} name="trackNumber" label="Uranumero *" required />
            <TextField {...fieldProps} name="albumName" label="Albumin nimi" />
            <TextField {...fieldProps} name="trackName" label="Kappaleen nimi *" required />
            <TextField {...fieldProps} name="catalogueNumber" label="Kataloginumero" />
            <TextField {...fieldProps} name="isrc" label="ISRC" />
            <TextField {...fieldProps} name="recordingYear" label="Äänitysvuosi" />
            <TextField {...fieldProps} name="publicationYear" label="Julkaisuvuosi" />
            <TextField {...fieldProps} name="recordLabel" label="Levy-yhtiö" multiline />
            <Checkbox {...fieldProps} name="finnishContent" label="Fennica" />
            <Checkbox {...fieldProps} name="yleMaster" label="Yle master" />
          </Section>

          <People {...fieldProps} name="performers" title="Esiintyjät"
            detailLabel="Soittimet (pilkuilla eroteltuna)" addLabel="+ Lisää esiintyjä" />
          <People {...fieldProps} name="authors" title="Tekijät"
            detailLabel="Roolit (pilkuilla eroteltuna: säv, sov, san) (voi jättää tyhjäksi)"
            addLabel="+ Lisää tekijä" />

          <Section title="Lisätiedot (Kustomikentät)">
            <MultiSelect {...fieldProps} name="languages" label="Kieli" options={languages} />
            <MultiSelect {...fieldProps} name="ensembles" label="Kokoonpano" options={Object.entries(data.ensemble)} />
            <MultiSelect {...fieldProps} name="genres" label="Laji" options={Object.entries(data.genre)} />
            <label>
              Lajitarkenne
              <select value={form.subGenre} onChange={event => updateField('subGenre', event.target.value)}>
                <option value="">Valitse…</option>
                {data.subgenres.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <TextField {...fieldProps} name="culture" label="Kulttuuri" />
            <TextField {...fieldProps} name="keyword" label="Asiasanat" />
            <div>
              <TextField {...fieldProps} name="recordingCountry" label="Äänitysmaa" list="countries" />
              <datalist id="countries">
                {data.countries.map(country => <option key={country} value={country} />)}
              </datalist>
            </div>
            <Checkbox {...fieldProps} name="recordingCountryEstimated" label="Äänitysmaa arvioitu" />
          </Section>

          <Section title="Huomautukset">
            <TextField {...fieldProps} name="workNotes" label="Teoshuomautus" multiline />
            <TextField {...fieldProps} name="artistNotes" label="Esittäjähuomautus" multiline />
          </Section>
          <div className="row">
            <button type="submit">Luo JSON</button>
            <button type="button" onClick={clearForm}>Tyhjennä</button>
          </div>
        </fieldset>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {output && (
        <section aria-label="JSON-tulos">
          <h2>JSON valmis</h2>
          <button onClick={() => downloadJson(output, filename)}>Lataa {filename}</button>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
