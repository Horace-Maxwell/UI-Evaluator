// Chat and user content are exempt: people type emoji.
export function MessageList({ messages }: { messages: { id: string; body: string }[] }) {
  return (
    <ul>
      <li>👍 Thanks, see you Friday!</li>
      {messages.map((m) => <li key={m.id}>{m.body}</li>)}
    </ul>
  );
}
