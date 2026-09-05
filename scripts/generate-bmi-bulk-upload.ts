import { writeFileSync } from "node:fs";
import path from "node:path";

const albums = [
  {
    name: "SuperCellular",
    tracks: [
      { title: "Circulation", isrc: "QT6FK2619999" },
      { title: "Cumulo-Nimboid", isrc: "QT6FK2620000" },
      { title: "Mesocyclone", isrc: "QT6FK2620001" },
      { title: "Inflow", isrc: "QT6FK2620002" },
      { title: "Downdraft", isrc: "QT6FK2620003" },
      { title: "Enhanced Protocol", isrc: "QT6FK2620004" },
      { title: "Ominous Howl", isrc: "QT6FK2620005" },
      { title: "Gust Front", isrc: "QT6FK2620006" },
      { title: "Vortex", isrc: "QT6FK2620007" },
      { title: "Overshooting Tops", isrc: "QT6FK2620008" },
      { title: "RFD", isrc: "QT6FK2620009" },
      { title: "Hook, Echo and Bow", isrc: "QT6FK2620010" },
      { title: "Disaster", isrc: "QT6FK2620011" },
      { title: "Supercell", isrc: "QT6FK2620012" },
      { title: "Warning", isrc: "QT6FK2620013" },
      { title: "HP Cell", isrc: "QT6FK2620014" },
      { title: "Low Pre Super", isrc: "QT6FK2620015" },
      { title: "Faded Gray Vorticies", isrc: "QT6FK2620016" },
      { title: "Wall Cloud", isrc: "QT6FK2620017" },
      { title: "Genesis", isrc: "QT6FK2620018" },
      { title: "Power Flash", isrc: "QT6FK2620019" },
      { title: "Clear Slot", isrc: "QT6FK2620020" },
      { title: "Twins", isrc: "QT6FK2620021" },
      { title: "EF5", isrc: "QT6FK2620022" },
      { title: "PDS", isrc: "QT6FK2620023" },
      { title: "Get There", isrc: "QT6FK2620024" },
      { title: "Into The Storm", isrc: "QT6FK2620025" },
      { title: "Deluge", isrc: "QT6FK2620026" },
      { title: "MCC", isrc: "QT6FK2620027" },
      { title: "Epic End", isrc: "QT6FK2620028" },
    ]
  },
  {
    name: "Electro Magnetic",
    tracks: [
      { title: "Electro Pump", isrc: "QT6FJ2601685" },
      { title: "Between Us", isrc: "QT6FJ2601686" },
      { title: "Slivver", isrc: "QT6FJ2601687" },
      { title: "District 12", isrc: "QT6FJ2601688" },
      { title: "Go Sergio, Go", isrc: "QT6FJ2601689" },
      { title: "Fire Dancer", isrc: "QT6FJ2601690" },
      { title: "Endless Drive", isrc: "QT6FJ2601691" },
      { title: "Midnight Mania", isrc: "QT6FJ2601692" },
      { title: "Cry Shen do", isrc: "QT6FJ2601693" },
      { title: "Dont Dance Alone", isrc: "QT6FJ2601694" },
      { title: "Dune Buggy", isrc: "QT6FJ2601695" },
      { title: "Bloody Sunday", isrc: "QT6FJ2601696" },
      { title: "Clifford", isrc: "QT6FJ2601697" },
      { title: "The Abyss", isrc: "QT6FJ2601698" },
      { title: "David", isrc: "QT6FJ2601699" },
      { title: "Dawn Break Dancers", isrc: "QT6FJ2601700" },
      { title: "Dreaming of You Everywhere", isrc: "QT6FJ2601701" },
      { title: "Welcome Back to Vice City", isrc: "QT6FJ2601702" },
      { title: "Electro Rush", isrc: "QT6FJ2601703" },
      { title: "Executive", isrc: "QT6FJ2601704" },
      { title: "Million Eyes of Hope", isrc: "QT6FJ2601705" },
      { title: "Pro Ex Ho", isrc: "QT6FJ2601706" },
      { title: "Skippo", isrc: "QT6FJ2601707" },
      { title: "NOHO", isrc: "QT6FJ2601708" },
      { title: "Sun Es Hot", isrc: "QT6FJ2601709" },
      { title: "Picky Hello", isrc: "QT6FJ2601710" },
      { title: "Trip Hard", isrc: "QT6FJ2601711" },
      { title: "Try Every Hit", isrc: "QT6FJ2601712" },
      { title: "Hall Through Hell", isrc: "QT6FJ2601713" },
      { title: "Drive Everywhere You GO", isrc: "QT6FJ2601714" },
    ]
  },
  {
    name: "A Geostrophic Flow",
    tracks: [
      { title: "Mad World", isrc: "QZZ7M2628144" },
      { title: "Bass Grade Party", isrc: "QZZ7M2628145" },
      { title: "DNB Mjolnir Bloodrave", isrc: "QZZ7M2628146" },
      { title: "Spun-Out", isrc: "QZZ7M2628147" },
      { title: "Jimminy Glitch-It", isrc: "QZZ7M2628148" },
      { title: "Synthetic Halo", isrc: "QZZ7M2628149" },
      { title: "Richard, Oh WOW", isrc: "QZZ7M2628150" },
      { title: "All-In (One Hand)", isrc: "QZZ7M2628151" },
      { title: "A Quick Diddy", isrc: "QZZ7M2628152" },
      { title: "Dear Wanderer WB", isrc: "QZZ7M2628153" },
      { title: "The Special Mama", isrc: "QZZ7M2628155" },
      { title: "8-Bit Sax-Tune", isrc: "QZZ7M2628156" },
      { title: "Poopie on the Floor", isrc: "QZZ7M2628157" },
      { title: "Power-Up, Log-Out", isrc: "QZZ7M2628158" },
      { title: "Control", isrc: "QZZ7M2628159" },
      { title: "Mad World 26", isrc: "QZZ7M2628160" },
    ]
  },
  {
    name: "Star Spangled Bangers",
    tracks: [
      { title: "Star Spangled Country", isrc: "QZZ772691799" },
      { title: "Thirty Years of Valor", isrc: "QZZ772691800" },
      { title: "God Bless the USA", isrc: "QZZ772691801" },
      { title: "Black Flame", isrc: "QZZ772691802" },
      { title: "Neighboorhood Watch", isrc: "QZZ772691803" },
      { title: "YMCA Country", isrc: "QZZ772691804" },
      { title: "Liberty", isrc: "QZZ772691805" },
      { title: "Living in America Country", isrc: "QZZ772691806" },
      { title: "American Women", isrc: "QZZ772691807" },
      { title: "Return of the MACK Track", isrc: "QZZ772691808" },
      { title: "American Girl", isrc: "QZZ772691809" },
      { title: "Real American Country", isrc: "QZZ772691810" },
      { title: "We Didn't Start the Fire", isrc: "QZZ772691811" },
      { title: "America F__K YEA", isrc: "QZZ772691812" },
    ]
  },
  {
    name: "The Front",
    tracks: [
      { title: "The Oscar Goes To...", isrc: "QZTBA2607569" },
      { title: "Dear Wanderer", isrc: "QZTBA2607570" },
      { title: "The Covenant Jam", isrc: "QZTBA2607571" },
      { title: "Your Local Weather", isrc: "QZTBA2607572" },
      { title: "Weather Report", isrc: "QZTBA2607573" },
    ]
  }
];

// Exact CSV Template Structure for Bulk Upload requested:
// Work Title, Writer 1 Name, Writer 1 IPI, Writer 1 Share %, Publisher 1 Name, Publisher 1 IPI, Publisher 1 Share %, ISRC, ISWC
const rows = [
  "Work Title,Writer 1 Name,Writer 1 IPI,Writer 1 Share %,Publisher 1 Name,Publisher 1 IPI,Publisher 1 Share %,ISRC,ISWC"
];

for (const album of albums) {
  for (const t of album.tracks) {
    const cleanTitle = `"${t.title.replace(/"/g, '""')}"`;
    const writerName = `"Charles Clottin"`;
    const writerIpi = `""`; // Will populate if Charles inputs specific IPI or leave blank for auto-match
    const writerShare = "100%"; // 100% of Writer's share (or 50% if 200% system)
    const pubName = `"Urban Reclaimers Publishing"`;
    const pubIpi = `""`;
    const pubShare = "100%";
    const isrc = `"${t.isrc}"`;
    const iswc = `""`;
    rows.push(`${cleanTitle},${writerName},${writerIpi},${writerShare},${pubName},${pubIpi},${pubShare},${isrc},${iswc}`);
  }
}

const outPath = path.join(process.cwd(), "docs/brand/BMI_WORKS_BULK_UPLOAD.csv");
writeFileSync(outPath, rows.join("\n"), "utf8");
console.log(`✅ Generated BMI Bulk Works Registration CSV (${rows.length - 1} tracks) at: ${outPath}`);
