// TODO: virtualise long columns
const columns = [{ id: 'todo', status: 'TODO' }, { id: 'done', status: 'DONE' }];

export function Board() {
  return <ul>{columns.map((c) => <li key={c.id}>{c.id === 'todo' ? 'To do' : 'Done'}</li>)}</ul>;
}
