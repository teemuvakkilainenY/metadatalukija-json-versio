
const assert = {equal:(a,b)=>expect(a).toBe(b), deepEqual:(a,b)=>expect(a).toEqual(b), ok:a=>expect(Boolean(a)).toBe(true)};
import data from './data.js';
import {emptyForm, createMetadata, validate} from './metadata.js';
const valid = () => ({...emptyForm(),customId:'DIGI-12345',trackNumber:'003',trackName:'Testi'});
test('template defaults and original empty-value semantics are preserved',()=>{
  const result=createMetadata(valid()), t=result.tracks[0];
  assert.equal(t.track_number,'003');assert.equal(t.custom.CustomID,'DIGI-12345-03');
  assert.equal(t.album.title,' ');assert.equal(t.audiofile.original.file_name,null);
  assert.deepEqual(t.artists_master_ownerships,[]);assert.deepEqual(t.artists_publishing_ownerships,[]);
  assert.deepEqual(t.album.master_ownerships[0].label,{label_name:'',custom:{}});
  assert.equal(t.album.public,false);assert.equal(t.custom.recording_country_estimated,'no');
  assert.deepEqual(Object.keys(t),Object.keys(data.template.tracks[0]));
  assert.equal(data.template.tracks[0].track_number,'1');
});
test('all entered metadata follows the C# export mapping',()=>{
  const f={...valid(),albumName:' Album ',audioFileName:'song.wav',isrc:'FI123',recordLabel:'Label',catalogueNumber:'CAT',publicationYear:'2024',recordingYear:'2023',culture:'Culture',keyword:'Theme',workNotes:'Work',artistNotes:'Artist',recordingCountry:'Suomi',recordingCountryEstimated:true,finnishContent:true,yleMaster:true,languages:[' suomi ','englanti'],genres:['L4A','L4AA','KMUS','VMUS'],ensembles:['KM1','KI'],subGenre:'a, b',performers:[{name:' Player ',detail:'piano, kitara'},{name:' ',detail:'x'}],authors:[{name:' Writer ',detail:'SÄV, sov, san, Tuottaja'},{name:'Other',detail:''}]};
  const t=createMetadata(f).tracks[0];
  assert.deepEqual(t.custom,{finnish_content:'yes',yle_master:'yes',CustomID:'DIGI-12345-03',languages:['suomi','englanti'],genre:['L4A pop- ja/tai rock-tyylinen musiikki','L4AA pop- ja/tai rock-tyylinen laajamuotinen musiikki','KMUS kevyt musiikki','VMUS taidemusiikki'],ensemble:['KM1 laulu- ja puheäänet, miesääni','KI instrumentaaliesitys'],publication_year:'2024',theme:'Theme',sub_genre:['a','b'],origin:'Culture',recording_country:'Suomi',recording_country_estimated:'yes',work_notes:'Work',artist_notes:'Artist'});
  assert.deepEqual(t.album.custom.genre,['L4 POP/ROCK','KMUS kevyt musiikki','VMUS taidemusiikki']);
  assert.deepEqual(t.artists_master_ownerships,[{artist:{full_name:'Player'},rights_type:{key:'musician',type:'master-artist'},instruments:[{key:'piano',names:[{value:'piano'}]},{key:'kitara',names:[{value:'kitara'}]}]}]);
  assert.deepEqual(t.album.artists_master_ownerships[0].instruments,[]);
  assert.deepEqual(t.artists_publishing_ownerships.map(p=>p.rights_type.key),['composer','arranger','lyricist','author','author']);
  assert.equal(t.artists_publishing_ownerships[3].additional_notes,'tuottaja');
  assert.equal(t.album.title,'Album');assert.equal(t.album.album_ref,'CAT');assert.equal(t.isrc,'FI123');assert.equal(t.audiofile.original.file_name,'song.wav');
  assert.equal(JSON.stringify(t).includes('2023'),false);
});
test('required fields and Int32 limits match desktop validation',()=>{
  for(const change of [{customId:'123'},{trackNumber:''},{trackNumber:'1.5'},{trackNumber:'2147483648'},{trackName:'  '}])assert.ok(validate({...valid(),...change}));
  assert.equal(createMetadata({...valid(),trackNumber:'-1'}).tracks[0].custom.CustomID,'DIGI-12345--01');
});
