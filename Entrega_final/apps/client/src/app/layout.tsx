import './global.css';

export const metadata = {
  title: 'Entrega Final',
  description: 'Projeto final da disciplina de Programação em Python',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
