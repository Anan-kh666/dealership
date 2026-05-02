export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <section className="mx-auto max-w-5xl px-6 py-12">{children}</section>;
}
