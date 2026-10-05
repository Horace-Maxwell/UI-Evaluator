const features = [
  { icon: '⚡', title: 'Same-day payouts' }, // expect: SLP-03
  { icon: 'clock', title: 'Timesheets' },
];

export function Features() {
  return (
    <section>
      <h3>🚀 Fast deploys</h3> {/* expect: SLP-03 */}
      <ul>
        <li>✓ Unlimited projects</li> {/* expect: SLP-03 */}
        <li>Unlimited seats</li>
      </ul>
      <button type="button">✨ Generate summary</button> {/* expect: SLP-03 */}
      <nav>
        <a href="/home">🏠 Home</a> {/* expect: SLP-03 */}
      </nav>
      {features.map((f) => <p key={f.title}>{f.title}</p>)}
    </section>
  );
}
