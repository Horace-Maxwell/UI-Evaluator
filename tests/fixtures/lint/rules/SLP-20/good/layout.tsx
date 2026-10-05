import { Source_Serif_4, JetBrains_Mono } from 'next/font/google';

// The mono face is for code samples beside a text face, not the display voice.
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${serif.variable} ${mono.variable}`}><body>{children}</body></html>;
}
