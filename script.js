"use strict";

const $ = (id) => document.getElementById(id);
const FIELDS = ["f-name", "f-desc", "f-demo", "f-author", "f-features", "f-tech", "f-install", "f-license"];

function lines(id) {
  return $(id).value.split("\n").map((s) => s.trim()).filter(Boolean);
}

function buildMarkdown() {
  const name = $("f-name").value.trim() || "Nama Proyek";
  const desc = $("f-desc").value.trim();
  const demo = $("f-demo").value.trim();
  const author = $("f-author").value.trim();
  const feats = lines("f-features");
  const tech = $("f-tech").value.split(",").map((s) => s.trim()).filter(Boolean);
  const install = lines("f-install");
  const license = $("f-license").value;

  const out = [`# ${name}`, ""];
  if (desc) out.push(desc, "");
  if (demo) out.push(`**Demo live:** [${demo}](${demo})`, "");
  if (author) out.push(`Dibuat oleh **${author}**.`, "");
  if (feats.length) {
    out.push("## Fitur", "");
    for (const f of feats) out.push(`- ${f}`);
    out.push("");
  }
  if (install.length) {
    out.push("## Cara Menjalankan", "", "```bash");
    for (const s of install) out.push(s);
    out.push("```", "");
  }
  if (tech.length) out.push("## Teknologi", "", tech.join(" · "), "");
  out.push("## Lisensi", "", license === "Belum ditentukan" ? "Belum ditentukan." : license, "");
  return out.join("\n");
}

// Renderer markdown mini buat pratinjau: heading, bold, link, list, blok kode, paragraf.
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function renderPreview(md) {
  const src = md.split("\n");
  const html = [];
  let inCode = false, inList = false;
  const closeList = () => { if (inList) { html.push("</ul>"); inList = false; } };
  for (const line of src) {
    if (line.startsWith("```")) {
      if (inCode) { html.push("</code></pre>"); inCode = false; } else { closeList(); html.push("<pre><code>"); inCode = true; }
      continue;
    }
    if (inCode) { html.push(esc(line)); continue; }
    if (line.startsWith("## ")) { closeList(); html.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (line.startsWith("# ")) { closeList(); html.push(`<h1>${inline(line.slice(2))}</h1>`); }
    else if (line.startsWith("- ")) { if (!inList) { html.push("<ul>"); inList = true; } html.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (line.trim() === "") { closeList(); }
    else { closeList(); html.push(`<p>${inline(line)}</p>`); }
  }
  closeList();
  if (inCode) html.push("</code></pre>");
  return html.join("\n");
}

function refresh() {
  const md = buildMarkdown();
  $("md-out").textContent = md;
  $("md-preview").innerHTML = renderPreview(md);
}

for (const id of FIELDS) {
  $(id).addEventListener("input", refresh);
  $(id).addEventListener("change", refresh);
}

$("tab-md").addEventListener("click", () => {
  $("tab-md").classList.add("active"); $("tab-preview").classList.remove("active");
  $("md-out").hidden = false; $("md-preview").hidden = true;
});
$("tab-preview").addEventListener("click", () => {
  $("tab-preview").classList.add("active"); $("tab-md").classList.remove("active");
  $("md-out").hidden = true; $("md-preview").hidden = false;
});

$("copy-btn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildMarkdown());
    $("status").textContent = "Tersalin! Tinggal tempel ke file README.md di repo kamu.";
  } catch {
    $("status").textContent = "Gagal menyalin otomatis — blok teksnya manual ya.";
  }
});

$("dl-btn").addEventListener("click", () => {
  const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "README.md";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  $("status").textContent = "README.md keunduh. Upload ke repo kamu, selesai.";
});

refresh();
