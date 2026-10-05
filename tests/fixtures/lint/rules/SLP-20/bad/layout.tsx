import { Poppins } from 'next/font/google'; // expect: SLP-20

const display = Poppins({ subsets: ['latin'], weight: ['600'], variable: '--font-display' });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={display.variable}><body>{children}</body></html>;
}
