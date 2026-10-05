export function Gallery(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <div>
      <img src="/harbour.jpg" alt="Leith harbour at dawn" />
      <img src="/divider.svg" alt="" />
      <img src="/sparkle.svg" aria-hidden="true" />
      <img {...props} />
    </div>
  );
}
