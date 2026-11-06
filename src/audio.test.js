import {formFromMetadata, extractIsrc} from './audio';
test('maps audio tags into the available form fields without inventing classifications',()=>{
  const {form,notice}=formFromMetadata({common:{title:'Song',album:'Album',track:{no:2},artists:['One','Two'],composer:['Writer'],lyricist:['Writer'],arranger:['Other'],isrc:['FI123'],catalognumber:['CAT-1'],releasedate:'2020-06-01',label:['Label'],language:'fin',genre:['Rock','L4A']}},'song.flac');
  expect(form).toMatchObject({trackName:'Song',albumName:'Album',trackNumber:'2',isrc:'FI123',catalogueNumber:'CAT-1',publicationYear:'2020',recordLabel:'Label',languages:['suomi'],genres:['L4A'],audioFileName:'song.flac',customId:''});
  expect(form.performers).toEqual([{name:'One',detail:''},{name:'Two',detail:''}]);
  expect(form.authors).toEqual([{name:'Writer',detail:''},{name:'Other',detail:''}]);
  expect(notice).toBe('');
});
test('missing tags remain empty',()=>{
  const {form}=formFromMetadata({common:{}},'untagged.wav');
  expect(form.trackName).toBe('');expect(form.catalogueNumber).toBe('');
  expect(form.performers).toEqual([]);expect(form.authors).toEqual([]);
});

test('splits every performer and writer using the desktop delimiters and removes duplicates',()=>{
  const {form}=formFromMetadata({common:{artists:['Self Deception & Dead By April','Self Deception'],composer:['Nicklas Eklund, Patrik Hallgren, Ronny Westphal & Pontus Hjelm'],lyricist:['Nicklas Eklund and Pontus Hjelm']}},'song.mp3');
  expect(form.performers.map(p=>p.name)).toEqual(['Self Deception','Dead By April']);
  expect(form.authors).toEqual([{name:'Nicklas Eklund',detail:''},{name:'Patrik Hallgren',detail:''},{name:'Ronny Westphal',detail:''},{name:'Pontus Hjelm',detail:''}]);
});
test('reads standard ISRC, raw ISRC tags and desktop Vendor fallback with colon cleanup',()=>{
  expect(extractIsrc({common:{isrc:['ISRC:SE1232400001']},native:{ID3v2:[{id:'TXXX:Vendor',value:'wrong'}]}})).toBe('SE1232400001');
  expect(extractIsrc({native:{ID3v2:[{id:'TSRC',value:'SE1232400001'}]}})).toBe('SE1232400001');
  expect(extractIsrc({native:{ID3v2:[{id:'TXXX:Vendor',value:'vendor:ISRC:SE1232400001'}]}})).toBe('SE1232400001');
  expect(extractIsrc({native:{vorbis:[{id:'VENDOR',value:'SE1232400001'}]}})).toBe('SE1232400001');
  expect(extractIsrc({common:{}})).toBe('');
});

test('matches metadata-composer MP4 xid and iTunes ISRC extraction',()=>{
  expect(extractIsrc({native:{iTunes:[{id:'xid ',value:'vendor:Sony:isrc:SE1232400001'}]}})).toBe('SE1232400001');
  expect(extractIsrc({native:{iTunes:[{id:'----:com.apple.iTunes:ISRC',value:'SE1232400001'}]}})).toBe('SE1232400001');
  expect(extractIsrc({native:{iTunes:[{id:'xid ',value:'vendor:unknown'}]}})).toBe('');
});
test('matches metadata-composer UFID fallback and decodes binary identifiers',()=>{
  expect(extractIsrc({native:{ID3v2:[{id:'UFID',value:{identifier:'SE1232400001'}}]}})).toBe('SE1232400001');
  const identifier=Uint8Array.from([...('SE1232400001'+String.fromCharCode(0))].map(c=>c.charCodeAt(0)));
  expect(extractIsrc({native:{ID3v2:[{id:'UFID',value:{identifier}}]}})).toBe('SE1232400001');
});
