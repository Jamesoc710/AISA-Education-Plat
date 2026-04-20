import * as XLSX from "xlsx";

async function main() {
const url = "https://uoregon-my.sharepoint.com/personal/mbyr_uoregon_edu/_layouts/15/download.aspx?share=IQAwElAalqe1QKJOcogqzaZdAe9EjVrcl14uViaCrqb8SfU";
const res = await fetch(url);
if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
const wb = XLSX.read(buf, { type: "buffer", cellStyles: true });

console.log("Sheet names:", wb.SheetNames);
const ws = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(ws["!ref"]!);
console.log("Range:", ws["!ref"], "rows:", range.e.r + 1, "cols:", range.e.c + 1);

console.log("\n--- First 12 rows, cols A-I ---");
for (let r = 0; r <= Math.min(11, range.e.r); r++) {
  for (let c = 0; c <= Math.min(8, range.e.c); c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = ws[addr];
    if (!cell) continue;
    const text = String(cell.v ?? "").replace(/\n/g, " ⏎ ").slice(0, 80);
    const color = cell.s?.font?.color?.rgb ?? cell.s?.color?.rgb ?? "—";
    console.log(`  ${addr} [${color}]: ${text}`);
  }
  console.log("---");
}

console.log("\n--- Rich text inspection on E7 (General Club Meeting Starbucks) ---");
const e7 = ws["E7"];
console.log("E7 raw:", JSON.stringify(e7, null, 2).slice(0, 800));

console.log("\n--- Rich text inspection on H5 (homework with mixed colors) ---");
const h5 = ws["H5"];
console.log("H5 raw:", JSON.stringify(h5, null, 2).slice(0, 1500));

console.log("\n--- All distinct colors found in data rows (4-12) ---");
const colorSet = new Map<string, string>();
for (let r = 3; r <= 11; r++) {
  for (let c = 0; c <= 8; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = ws[addr];
    if (!cell?.r) continue;
    const matches = String(cell.r).matchAll(/<color\s+rgb="([0-9A-F]+)"\s*\/>[^<]*<\/rPr>\s*<t[^>]*>([^<]+)<\/t>/g);
    for (const m of matches) {
      const color = m[1];
      const text = m[2].slice(0, 40).replace(/\r?\n/g, " ");
      if (!colorSet.has(color)) colorSet.set(color, `${addr}: "${text}"`);
    }
  }
}
for (const [color, sample] of colorSet) {
  console.log(`  ${color} → ${sample}`);
}

console.log("\n--- Inspect F6 (Capital Team Lecture - should be green) ---");
console.log("F6 r:", ws["F6"]?.r?.slice(0, 800));

console.log("\n--- Inspect F4 (Exec - should be red) ---");
console.log("F4 r:", ws["F4"]?.r?.slice(0, 600));

console.log("\n--- Inspect I11 (NY trip - orange?) ---");
console.log("I11 r:", ws["I11"]?.r?.slice(0, 600));

console.log("\n--- FULL J4 legend ---");
console.log("J4 r FULL:", ws["J4"]?.r);

console.log("\n--- F4 (red Exec) full dump ---");
console.log(JSON.stringify(ws["F4"], null, 2));

console.log("\n--- F7 Capital Team Lecture full r ---");
console.log("F7 r:", ws["F7"]?.r);

console.log("\n--- D9 Multimodality (purple? media?) ---");
console.log("D9 r:", ws["D9"]?.r);

console.log("\n--- Survey cell.s presence across data ---");
let withFontColor = 0;
let withRRichText = 0;
let plain = 0;
for (let r = 3; r <= 11; r++) {
  for (let c = 0; c <= 7; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    if (!cell) continue;
    if (cell.s?.font?.color) withFontColor++;
    else if (cell.r && /<color/.test(cell.r)) withRRichText++;
    else plain++;
  }
}
console.log(`withFontColor=${withFontColor}, withRRichText=${withRRichText}, plainNoColor=${plain}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
