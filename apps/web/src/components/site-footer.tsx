export function SiteFooter(): React.ReactElement {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Dealership Sdn Bhd</p>
        <p>Authorized dealer · Malaysia</p>
      </div>
    </footer>
  );
}
