export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <section className="mx-auto max-w-7xl px-6 py-12">{children}</section>;
}
