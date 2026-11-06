import {render, screen, fireEvent, waitFor, act} from '@testing-library/react';
import App from './App';
import {readAudioMetadata} from './audio';
import {emptyForm} from './metadata';
jest.mock('./audio',()=>({readAudioMetadata:jest.fn()}));

test('user can fill the form and preview the original JSON format', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Kartuntatunnus *'), {target:{value:'DIGI-123'}});
  fireEvent.change(screen.getByLabelText('Uranumero *'), {target:{value:'2'}});
  fireEvent.change(screen.getByLabelText('Kappaleen nimi *'), {target:{value:'Testikappale'}});
  fireEvent.click(screen.getByText('+ Lisää esiintyjä'));
  fireEvent.change(screen.getByLabelText('Nimi'), {target:{value:'Artisti'}});
  fireEvent.click(screen.getByText('Luo JSON'));
  const output = JSON.parse(screen.getByRole('region',{name:'JSON-tulos'}).querySelector('pre').textContent);
  expect(output.tracks[0].custom.CustomID).toBe('DIGI-123-02');
  expect(output.tracks[0].artists_master_ownerships[0].artist.full_name).toBe('Artisti');
  expect(screen.getByText('Lataa output.json')).toBeInTheDocument();
});

test('new file clears old fields and fills available tags; removed controls are absent', async () => {
  readAudioMetadata.mockResolvedValue({form:{...emptyForm(),audioFileName:'new.mp3',trackName:'Imported',albumName:'Album',trackNumber:'4'},notice:''});
  render(<App />);
  fireEvent.change(screen.getByLabelText('Kartuntatunnus *'),{target:{value:'DIGI-99'}});
  fireEvent.change(screen.getByLabelText('Valitse audiotiedosto'),{target:{files:[new File(['audio'],'new.mp3')]}});
  expect(screen.getByLabelText('Kartuntatunnus *')).toHaveValue('');
  await waitFor(()=>expect(screen.getByLabelText('Kappaleen nimi *')).toHaveValue('Imported'));
  expect(screen.getByLabelText('Albumin nimi')).toHaveValue('Album');
  expect(screen.queryByText('Yhdistä JSON-tiedostot')).not.toBeInTheDocument();
  expect(screen.queryByText(/Säilytä tiedot/)).not.toBeInTheDocument();
});

test('latest dropped file wins even when an older import finishes later',async()=>{
  let finishOld;
  readAudioMetadata.mockImplementationOnce(()=>new Promise(resolve=>{finishOld=resolve;}))
    .mockResolvedValueOnce({form:{...emptyForm(),audioFileName:'second.wav',trackName:'Second'},notice:''});
  render(<App />);
  fireEvent.change(screen.getByLabelText('Valitse audiotiedosto'),{target:{files:[new File([''],'first.wav')]}});
  fireEvent.drop(screen.getByRole('main'),{dataTransfer:{files:[new File([''],'second.wav')]}});
  await waitFor(()=>expect(screen.getByLabelText('Kappaleen nimi *')).toHaveValue('Second'));
  await act(async()=>finishOld({form:{...emptyForm(),trackName:'First'},notice:''}));
  expect(screen.getByLabelText('Kappaleen nimi *')).toHaveValue('Second');
});

test('failed import keeps old data cleared and allows manual entry',async()=>{
  readAudioMetadata.mockRejectedValueOnce(new Error('Invalid audio'));
  render(<App />);
  fireEvent.change(screen.getByLabelText('Albumin nimi'),{target:{value:'Old'}});
  fireEvent.change(screen.getByLabelText('Valitse audiotiedosto'),{target:{files:[new File([''],'broken.mp3')]}});
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Albumin nimi')).toHaveValue('');
  expect(screen.getByLabelText('Kappaleen nimi *')).toBeEnabled();
});
