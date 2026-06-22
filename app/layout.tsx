import './globals.css';

export const metadata = {
  title: 'Prospect Dash',
  description: 'Personal prospecting dashboard — business leads and people search.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
