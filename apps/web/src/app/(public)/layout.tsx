import { SiteChrome } from "@/components/site-chrome";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <SiteChrome>{children}</SiteChrome>;
}
