import Link from "next/link";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <header>
        <Link href="/requests">Dataset Request Desk</Link>
        <nav aria-label="Main navigation">
          <Link href="/requests">Requests</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
