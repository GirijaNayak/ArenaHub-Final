import { NextResponse } from "next/server";

export async function GET() {
  const games = [
    {
      id: "bgmi",
      title: "Battlegrounds Mobile India (BGMI)",
      slug: "bgmi",
      genre: "Battle Royale",
      teamSize: 4,
      platforms: "Mobile (iOS / Android)",
      maps: ["Erangel", "Miramar", "Sanhok", "Vikendi"],
      bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "pubgm",
      title: "PUBG Mobile",
      slug: "pubg-mobile",
      genre: "Battle Royale",
      teamSize: 4,
      platforms: "Mobile (iOS / Android)",
      maps: ["Erangel", "Miramar", "Rondo", "Sanhok"],
      bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "apex",
      title: "Apex Legends",
      slug: "apex-legends",
      genre: "Hero Battle Royale",
      teamSize: 3,
      platforms: "PC / Console",
      maps: ["World's Edge", "Storm Point", "Olympus", "Broken Moon"],
      bannerUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "freefire",
      title: "Free Fire MAX",
      slug: "free-fire",
      genre: "Battle Royale",
      teamSize: 4,
      platforms: "Mobile",
      maps: ["Bermuda", "Purgatory", "Kalahari", "Alpine"],
      bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return NextResponse.json({ games });
}
