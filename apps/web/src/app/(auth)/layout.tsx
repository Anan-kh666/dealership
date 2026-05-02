export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-6 py-16">
      {children}
    </section>
  );
}
