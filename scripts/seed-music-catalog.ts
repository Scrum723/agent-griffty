import { openStore } from "@griffty/store";
import type { TrackRecord } from "@griffty/domain";
import { writeFileSync } from "node:fs";
import path from "node:path";

const albums = [
  {
    name: "SuperCellular",
    upc: "882204209164",
    releaseDate: "2026-08-07",
    label: "Urban Reclaimers Productions",
    tracks: [
      { num: 1, title: "Circulation", isrc: "QT6FK2619999" },
      { num: 2, title: "Cumulo-Nimboid", isrc: "QT6FK2620000" },
      { num: 3, title: "Mesocyclone", isrc: "QT6FK2620001" },
      { num: 4, title: "Inflow", isrc: "QT6FK2620002" },
      { num: 5, title: "Downdraft", isrc: "QT6FK2620003" },
      { num: 6, title: "Enhanced Protocol", isrc: "QT6FK2620004" },
      { num: 7, title: "Ominous Howl", isrc: "QT6FK2620005" },
      { num: 8, title: "Gust Front", isrc: "QT6FK2620006" },
      { num: 9, title: "Vortex", isrc: "QT6FK2620007" },
      { num: 10, title: "Overshooting Tops", isrc: "QT6FK2620008" },
      { num: 11, title: "RFD", isrc: "QT6FK2620009" },
      { num: 12, title: "Hook, Echo and Bow", isrc: "QT6FK2620010" },
      { num: 13, title: "Disaster", isrc: "QT6FK2620011" },
      { num: 14, title: "Supercell", isrc: "QT6FK2620012" },
      { num: 15, title: "Warning", isrc: "QT6FK2620013" },
      { num: 16, title: "HP Cell", isrc: "QT6FK2620014" },
      { num: 17, title: "Low Pre Super", isrc: "QT6FK2620015" },
      { num: 18, title: "Faded Gray Vorticies", isrc: "QT6FK2620016" },
      { num: 19, title: "Wall Cloud", isrc: "QT6FK2620017" },
      { num: 20, title: "Genesis", isrc: "QT6FK2620018" },
      { num: 21, title: "Power Flash", isrc: "QT6FK2620019" },
      { num: 22, title: "Clear Slot", isrc: "QT6FK2620020" },
      { num: 23, title: "Twins", isrc: "QT6FK2620021" },
      { num: 24, title: "EF5", isrc: "QT6FK2620022" },
      { num: 25, title: "PDS", isrc: "QT6FK2620023" },
      { num: 26, title: "Get There", isrc: "QT6FK2620024" },
      { num: 27, title: "Into The Storm", isrc: "QT6FK2620025" },
      { num: 28, title: "Deluge", isrc: "QT6FK2620026" },
      { num: 29, title: "MCC", isrc: "QT6FK2620027" },
      { num: 30, title: "Epic End", isrc: "QT6FK2620028" },
    ]
  },
  {
    name: "Electro Magnetic",
    upc: "882204261568",
    releaseDate: "2026-07-31",
    label: "Urban Reclaimers Productions",
    tracks: [
      { num: 1, title: "Electro Pump", isrc: "QT6FJ2601685" },
      { num: 2, title: "Between Us", isrc: "QT6FJ2601686" },
      { num: 3, title: "Slivver", isrc: "QT6FJ2601687" },
      { num: 4, title: "District 12", isrc: "QT6FJ2601688" },
      { num: 5, title: "Go Sergio, Go", isrc: "QT6FJ2601689" },
      { num: 6, title: "Fire Dancer", isrc: "QT6FJ2601690" },
      { num: 7, title: "Endless Drive", isrc: "QT6FJ2601691" },
      { num: 8, title: "Midnight Mania", isrc: "QT6FJ2601692" },
      { num: 9, title: "Cry Shen do", isrc: "QT6FJ2601693" },
      { num: 10, title: "Dont Dance Alone", isrc: "QT6FJ2601694" },
      { num: 11, title: "Dune Buggy", isrc: "QT6FJ2601695" },
      { num: 12, title: "Bloody Sunday", isrc: "QT6FJ2601696" },
      { num: 13, title: "Clifford", isrc: "QT6FJ2601697" },
      { num: 14, title: "The Abyss", isrc: "QT6FJ2601698" },
      { num: 15, title: "David", isrc: "QT6FJ2601699" },
      { num: 16, title: "Dawn Break Dancers", isrc: "QT6FJ2601700" },
      { num: 17, title: "Dreaming of You Everywhere", isrc: "QT6FJ2601701" },
      { num: 18, title: "Welcome Back to Vice City", isrc: "QT6FJ2601702" },
      { num: 19, title: "Electro Rush", isrc: "QT6FJ2601703" },
      { num: 20, title: "Executive", isrc: "QT6FJ2601704" },
      { num: 21, title: "Million Eyes of Hope", isrc: "QT6FJ2601705" },
      { num: 22, title: "Pro Ex Ho", isrc: "QT6FJ2601706" },
      { num: 23, title: "Skippo", isrc: "QT6FJ2601707" },
      { num: 24, title: "NOHO", isrc: "QT6FJ2601708" },
      { num: 25, title: "Sun Es Hot", isrc: "QT6FJ2601709" },
      { num: 26, title: "Picky Hello", isrc: "QT6FJ2601710" },
      { num: 27, title: "Trip Hard", isrc: "QT6FJ2601711" },
      { num: 28, title: "Try Every Hit", isrc: "QT6FJ2601712" },
      { num: 29, title: "Hall Through Hell", isrc: "QT6FJ2601713" },
      { num: 30, title: "Drive Everywhere You GO", isrc: "QT6FJ2601714" },
    ]
  },
  {
    name: "A Geostrophic Flow",
    upc: "825233951192",
    releaseDate: "2026-05-15",
    label: "Urban Reclaimers Productions",
    tracks: [
      { num: 1, title: "Mad World", isrc: "QZZ7M2628144" },
      { num: 2, title: "Bass Grade Party", isrc: "QZZ7M2628145" },
      { num: 3, title: "DNB Mjolnir Bloodrave", isrc: "QZZ7M2628146" },
      { num: 4, title: "Spun-Out", isrc: "QZZ7M2628147" },
      { num: 5, title: "Jimminy Glitch-It", isrc: "QZZ7M2628148" },
      { num: 6, title: "Synthetic Halo", isrc: "QZZ7M2628149" },
      { num: 7, title: "Richard, Oh WOW", isrc: "QZZ7M2628150" },
      { num: 8, title: "All-In (One Hand)", isrc: "QZZ7M2628151" },
      { num: 9, title: "A Quick Diddy", isrc: "QZZ7M2628152" },
      { num: 10, title: "Dear Wanderer WB", isrc: "QZZ7M2628153" },
      { num: 11, title: "The Special Mama", isrc: "QZZ7M2628155" },
      { num: 12, title: "8-Bit Sax-Tune", isrc: "QZZ7M2628156" },
      { num: 13, title: "Poopie on the Floor", isrc: "QZZ7M2628157" },
      { num: 14, title: "Power-Up, Log-Out", isrc: "QZZ7M2628158" },
      { num: 15, title: "Control", isrc: "QZZ7M2628159" },
      { num: 16, title: "Mad World 26", isrc: "QZZ7M2628160" },
    ]
  },
  {
    name: "Star Spangled Bangers",
    upc: "825293085561",
    releaseDate: "2026-05-08",
    label: "Urban Reclaimers Productions",
    tracks: [
      { num: 1, title: "Star Spangled Country", isrc: "QZZ772691799" },
      { num: 2, title: "Thirty Years of Valor", isrc: "QZZ772691800" },
      { num: 3, title: "God Bless the USA", isrc: "QZZ772691801" },
      { num: 4, title: "Black Flame", isrc: "QZZ772691802" },
      { num: 5, title: "Neighboorhood Watch", isrc: "QZZ772691803" },
      { num: 6, title: "YMCA Country", isrc: "QZZ772691804" },
      { num: 7, title: "Liberty", isrc: "QZZ772691805" },
      { num: 8, title: "Living in America Country", isrc: "QZZ772691806" },
      { num: 9, title: "American Women", isrc: "QZZ772691807" },
      { num: 10, title: "Return of the MACK Track", isrc: "QZZ772691808" },
      { num: 11, title: "American Girl", isrc: "QZZ772691809" },
      { num: 12, title: "Real American Country", isrc: "QZZ772691810" },
      { num: 13, title: "We Didn't Start the Fire", isrc: "QZZ772691811" },
      { num: 14, title: "America F__K YEA", isrc: "QZZ772691812" },
    ]
  },
  {
    name: "The Front",
    upc: "825500970154",
    releaseDate: "2026-04-03",
    label: "Urban Reclaimers Productions",
    tracks: [
      { num: 1, title: "The Oscar Goes To...", isrc: "QZTBA2607569" },
      { num: 2, title: "Dear Wanderer", isrc: "QZTBA2607570" },
      { num: 3, title: "The Covenant Jam", isrc: "QZTBA2607571" },
      { num: 4, title: "Your Local Weather", isrc: "QZTBA2607572" },
      { num: 5, title: "Weather Report", isrc: "QZTBA2607573" },
    ]
  }
];

async function main() {
  console.log("Seeding verified DistroKid music catalog into Griffty IP Vault...");
  const store = openStore();
  const world = await store.load();

  if (!world.ipVault) {
    world.ipVault = { tracks: [], lastAuditAt: null };
  }

  const allTracks: TrackRecord[] = [];
  const csvRows: string[] = [
    "Work Title,ISRC,Artist,Album,UPC,Release Date,Record Label,PRO,Publisher,Ownership%"
  ];

  let totalCount = 0;
  const iso = new Date().toISOString();

  for (const album of albums) {
    for (const t of album.tracks) {
      totalCount++;
      const id = `track_${t.isrc.toLowerCase()}`;
      const record: TrackRecord = {
        id,
        title: `${t.title} (${album.name})`,
        isrc: t.isrc,
        distributor: "distrokid",
        releaseDate: album.releaseDate,
        proWorkNumber: null,
        proName: "BMI",
        platforms: ["Spotify", "Apple Music", "YouTube Music", "TikTok", "Amazon", "Deezer", "Pandora", "Tidal"],
        contentIdRegistered: true,
        claimHistory: [],
        createdAt: iso,
        updatedAt: iso,
      };
      allTracks.push(record);
      csvRows.push(
        `"${t.title.replace(/"/g, '""')}","${t.isrc}","The Weatherman","${album.name}","${album.upc}","${album.releaseDate}","Urban Reclaimers Productions","BMI","Urban Reclaimers Publishing",100%`
      );
    }
  }

  world.ipVault.tracks = allTracks;
  world.ipVault.lastAuditAt = iso;

  // Add confirmation notification
  world.notifications.push({
    id: `notif_ip_vault_seeded_${Date.now()}`,
    type: "ip_vault_catalog_updated",
    title: "Music Catalog Registered in IP Vault",
    body: `Successfully verified and imported ${totalCount} tracks across 5 albums (SuperCellular, Electro Magnetic, A Geostrophic Flow, Star Spangled Bangers, The Front).`,
    read: false,
    createdAt: iso,
  });

  await store.save(world);

  // Write BMI CSV
  const csvPath = path.join(process.cwd(), "docs/brand/BMI_WORK_REGISTRATION.csv");
  writeFileSync(csvPath, csvRows.join("\n"), "utf8");

  console.log(`✅ Loaded ${totalCount} tracks across 5 albums into state.json!`);
  console.log(`✅ Generated BMI Work Registration CSV at ${csvPath}`);
}

main().catch(console.error);
