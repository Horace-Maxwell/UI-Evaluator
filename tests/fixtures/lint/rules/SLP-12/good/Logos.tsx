const customers = ['Fennel & Rye', 'Hollow Oak', 'The Pantry'];
export function Logos() {
  return <ul>{customers.map((c) => <li key={c}>{c}</li>)}</ul>;
}
