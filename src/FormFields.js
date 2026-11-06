import React from 'react';

// Shared controls keep App.js focused on the fields and their Finnish labels.
export function TextField({ form, onChange, name, label, multiline = false, ...inputProps }) {
  const Input = multiline ? 'textarea' : 'input';
  return (
    <label>
      {label}
      <Input value={form[name]} onChange={event => onChange(name, event.target.value)} {...inputProps} />
    </label>
  );
}

export function Checkbox({ form, onChange, name, label }) {
  return (
    <label>
      <input type="checkbox" checked={form[name]} onChange={event => onChange(name, event.target.checked)} />
      {' '}{label}
    </label>
  );
}

export function Section({ title, children }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="grid">{children}</div>
    </fieldset>
  );
}

export function MultiSelect({ form, onChange, name, label, options }) {
  const selected = form[name];

  function addSelection(event) {
    const value = event.target.value;
    if (value && !selected.includes(value)) onChange(name, [...selected, value]);
  }

  function removeSelection(value) {
    onChange(name, selected.filter(item => item !== value));
  }

  return (
    <div>
      <label>
        {label}
        <select value="" onChange={addSelection}>
          <option value="">Lisää…</option>
          {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
      </label>
      {selected.map(value => (
        <div className="row" key={value}>
          <span>{value}</span>
          <button type="button" aria-label={`Poista ${value}`} onClick={() => removeSelection(value)}>×</button>
        </div>
      ))}
    </div>
  );
}

export function People({ form, onChange, name, title, detailLabel, addLabel }) {
  const people = form[name];

  function updatePerson(index, property, value) {
    onChange(name, people.map((person, personIndex) => (
      personIndex === index ? { ...person, [property]: value } : person
    )));
  }

  function removePerson(index) {
    onChange(name, people.filter((_, personIndex) => personIndex !== index));
  }

  function addPerson() {
    onChange(name, [...people, { name: '', detail: '' }]);
  }

  return (
    <fieldset>
      <legend>{title}</legend>
      {people.map((person, index) => (
        <div className="row" key={index}>
          <label>
            Nimi
            <input value={person.name} onChange={event => updatePerson(index, 'name', event.target.value)} />
          </label>
          <label>
            {detailLabel}
            <input value={person.detail} onChange={event => updatePerson(index, 'detail', event.target.value)} />
          </label>
          <button type="button" onClick={() => removePerson(index)}>Poista</button>
        </div>
      ))}
      <button type="button" onClick={addPerson}>{addLabel}</button>
    </fieldset>
  );
}
