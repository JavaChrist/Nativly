export type ThemeSlug = "music" | "travel" | "business";

export interface Theme {
  slug: ThemeSlug;
  name: string;
  description: string;
  isActive: boolean;
  route: string;
}

export const THEMES: Theme[] = [
  {
    slug: "music",
    name: "Musique",
    description: "Apprendre à travers vos chansons préférées",
    isActive: true,
    route: "/music/lyrics",
  },
  {
    slug: "travel",
    name: "Voyage",
    description: "Préparez vos conversations de voyage",
    isActive: false,
    route: "/travel",
  },
  {
    slug: "business",
    name: "Business",
    description: "Anglais professionnel sur mesure",
    isActive: false,
    route: "/business",
  },
];

export function getActiveTheme(slug: ThemeSlug): Theme | undefined {
  return THEMES.find((theme) => theme.slug === slug && theme.isActive);
}
