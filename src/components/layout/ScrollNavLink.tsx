"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ScrollNavLinkProps {
  href: string;
  label: string;
  scrollTargetId?: string;
}

export function ScrollNavLink({
  href,
  label,
  scrollTargetId,
}: ScrollNavLinkProps) {
  const pathname = usePathname();
  const isSameRoute = pathname === href;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!isSameRoute || !scrollTargetId) return;

    event.preventDefault();
    document.getElementById(scrollTargetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <Link
      href={scrollTargetId ? `${href}#${scrollTargetId}` : href}
      onClick={handleClick}
      className="rounded-full px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
    >
      {label}
    </Link>
  );
}
