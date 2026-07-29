// ── Phân tích nội dung puzzle (plain text → các sections có cấu trúc) ──

function parsePuzzleContent(text) {
    const blocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
    const fragments = [];

    for (let block of blocks) {
        // ── Example block ──
        if (/^example\b/i.test(block)) {
            const exampleDiv = document.createElement("div");
            exampleDiv.className = "example";

            const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const inMatch = line.match(/^in:\s*(.*)/i);
                const outMatch = line.match(/^out:\s*(.*)/i);
                if (inMatch || outMatch) {
                    const row = document.createElement("div");
                    row.className = "example-line";
                    const label = document.createElement("span");
                    label.className = "example-label";
                    label.textContent = inMatch ? "In:" : "Out:";
                    const val = document.createElement("span");
                    val.className = "example-value";
                    val.textContent = inMatch ? inMatch[1] : outMatch[1];
                    row.append(label, val);
                    exampleDiv.appendChild(row);
                } else {
                    const p = document.createElement("p");
                    p.style.margin = "0";
                    p.textContent = line;
                    exampleDiv.appendChild(p);
                }
            }
            const h3 = document.createElement("h3");
            h3.textContent = lines[0];
            fragments.push(h3);
            fragments.push(exampleDiv);
            continue;
        }

        // ── Constraints block ──
        if (/^constraints\b/i.test(block)) {
            const h3 = document.createElement("h3");
            h3.textContent = block.split("\n")[0].trim();
            fragments.push(h3);

            const ul = document.createElement("ul");
            const lines = block.split("\n").slice(1).map(l => l.trim()).filter(Boolean);
            for (const line of lines) {
                const li = document.createElement("li");
                li.innerHTML = line.replace(/\b(O\s*\([^)]+\))/g, '<code>$1</code>');
                ul.appendChild(li);
            }
            fragments.push(ul);
            continue;
        }

        // ── Tip / note box ──
        if (/\b(must|note:|time|O\s*\(n\))/i.test(block) && block.length < 200) {
            const bq = document.createElement("blockquote");
            bq.textContent = block;
            fragments.push(bq);
            continue;
        }

        // ── Description paragraph ──
        const p = document.createElement("p");
        p.innerHTML = block
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, "<br>");
        fragments.push(p);
    }

    return fragments;
}
