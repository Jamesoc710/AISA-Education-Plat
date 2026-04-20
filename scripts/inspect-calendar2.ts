import ExcelJS from "exceljs";

async function main() {
  const url = "https://uoregon-my.sharepoint.com/personal/mbyr_uoregon_edu/_layouts/15/download.aspx?share=IQAwElAalqe1QKJOcogqzaZdAe9EjVrcl14uViaCrqb8SfU";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  console.log("Sheet:", ws.name, "rowCount:", ws.rowCount, "columnCount:", ws.columnCount);

  console.log("\n--- F4 (red Exec) full inspection ---");
  const f4 = ws.getCell("F4");
  console.log("value:", f4.value);
  console.log("font:", JSON.stringify(f4.font, null, 2));

  console.log("\n--- E4 (Wed cell, should have color) ---");
  const e4 = ws.getCell("E4");
  console.log("value:", e4.value);
  console.log("font:", JSON.stringify(e4.font, null, 2));

  console.log("\n--- D4 (Tue, OG Tech Team start benchmarking) ---");
  const d4 = ws.getCell("D4");
  console.log("value:", d4.value);
  console.log("font:", JSON.stringify(d4.font, null, 2));

  console.log("\n--- F6 (multi-color rich text) ---");
  const f6 = ws.getCell("F6");
  if (typeof f6.value === "object" && f6.value && "richText" in f6.value) {
    console.log("Rich text runs:");
    for (const run of (f6.value as { richText: { font?: { color?: { argb?: string } }; text: string }[] }).richText) {
      console.log(`  [${run.font?.color?.argb ?? "—"}] "${run.text.slice(0, 60).replace(/\r?\n/g, " ")}"`);
    }
  }

  console.log("\n--- Color survey across data rows ---");
  const colorCounts = new Map<string, number>();
  let cellsWithFontColor = 0;
  let cellsWithRichText = 0;
  let plain = 0;
  for (let r = 4; r <= 12; r++) {
    for (let c = 1; c <= 8; c++) {
      const cell = ws.getRow(r).getCell(c);
      if (!cell.value) continue;
      const v = cell.value;
      if (typeof v === "object" && "richText" in v) {
        cellsWithRichText++;
        for (const run of (v as { richText: { font?: { color?: { argb?: string } } }[] }).richText) {
          const c = run.font?.color?.argb;
          if (c) colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
        }
      } else if (cell.font?.color?.argb) {
        cellsWithFontColor++;
        const c = cell.font.color.argb;
        colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
      } else {
        plain++;
      }
    }
  }
  console.log("Color counts:", Object.fromEntries(colorCounts));
  console.log(`cellsWithFontColor=${cellsWithFontColor}, cellsWithRichText=${cellsWithRichText}, plain=${plain}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
