export function Gallery() {
  return (
    <figure>
      <img className="transition-transform duration-300 hover:scale-110" src="/a.jpg" alt="Harbour at dawn" /> {/* expect: SLP-26 */}
      <div className="hover:-translate-y-1 hover:scale-105 hover:shadow-xl">Card</div> {/* expect: SLP-26 */}
    </figure>
  );
}
