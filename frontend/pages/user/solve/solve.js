// Solve page orchestrator — manages puzzle panel, code editor, submission, and result display
// Gọi từ puzzle.js (module) — các hàm này phải ở global scope

// ── Puzzle Panel ──

var puzzleIdGlobal = null;
var puzzleFuncName = null;
var puzzleLangId = 1;
var puzzleLanguage = '';
var puzzleSetCode = null;

async function loadPuzzle(setLanguage, setCode) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    puzzleIdGlobal = id;
    puzzleFuncName = null;
    puzzleLangId = 1;

    showSkeleton("puzzlePanel", "solve-panel");

    const puzzle = await getPuzzleById(id);
    puzzleFuncName = puzzle.functionName;
    puzzleLanguage = puzzle.language;
    puzzleSetCode = setCode;
    var lang = (puzzle.language || '').toLowerCase();
    if (lang.includes('python')) puzzleLangId = 1;
    else if (lang.includes('javascript') || lang.includes('node')) puzzleLangId = 2;
    else if (lang.includes('php')) puzzleLangId = 3;

    const container = document.getElementById("puzzlePanel");
    hideSkeleton("puzzlePanel");

    // ── Xây dựng panel header ──
    const problemLabel = document.createElement("span");
    problemLabel.className = "problem-label";
    problemLabel.textContent = "Problem " + String(puzzle.id).padStart(2, "0");

    const title = document.createElement("h2");
    title.className = "problem-title-main";
    title.textContent = puzzle.title;

    const badges = document.createElement("div");
    badges.className = "problem-badges";

    const difficulty = document.createElement("span");
    const diffClass = (puzzle.difficulty || "").toLowerCase();
    difficulty.className = "diff-badge " + diffClass;
    difficulty.textContent = puzzle.difficulty;

    const langBadge = document.createElement("span");
    langBadge.className = "lang-badge";
    langBadge.textContent = puzzle.language;
    setLanguage(puzzle.language)

    badges.append(difficulty, langBadge);

    // ── Xây dựng panel content (parse plain text into structured sections) ──
    const panelContent = document.createElement("div");
    panelContent.className = "panel-content";
    panelContent.append(...parsePuzzleContent(puzzle.content || ""));
    container.append(problemLabel, title, badges, panelContent);

    // Load code đã lưu hoặc signature mặc định
    const saved = localStorage.getItem("puzzle_code_" + id);
    if (saved) {
        setCode(saved);
    } else {
        setCode(await initSignature(puzzle.language, puzzle.functionName));
    }
}

// ── Parse puzzle content (plain text → structured sections) ──

function parsePuzzleContent(text) {
    const blocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
    const fragments = [];

    for (let block of blocks) {
        // ── Example block ──
        if (/^example\b/i.test(block)) {
            const exampleDiv = document.createElement("div");
            exampleDiv.className = "example";

            const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
            // First line is heading (e.g. "Example 1:"), skip it
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
            // Prepend heading
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

// ── Fetch signature template từ static file ──

async function initSignature(language, functname) {
    const response = await fetch("/frontend/assets/text/signature_"+language+".txt");
    const text = await response.text();
    return text.replaceAll("${FUNC_NAME}", functname );
}

// ── Solve Tabs ──

function initSolveTabs() {
    const tabs = document.querySelectorAll('.solve-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.solve-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.solve-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            const content = document.querySelector(`[data-tab-content="${target}"]`);
            if (content) content.classList.add('active');
            // Tắt/bật editor khi chuyển tab
            if (target === 'results') {
                const editor = document.querySelector('.cm-editor');
                if (editor) editor.style.pointerEvents = 'none';
            } else {
                const editor = document.querySelector('.cm-editor');
                if (editor) editor.style.pointerEvents = '';
            }
        });
    });
}

// ══════════════════════════════════════════════════════
// TIMER
// ══════════════════════════════════════════════════════

var started = false;
var seconds = 0;
var secondsGlobal = 0;
var timerInterval;
document.addEventListener('DOMContentLoaded',function(){var r=document.getElementById('resetBtn');if(!r)return;r.addEventListener('click',async function(){if(timerInterval){clearInterval(timerInterval);timerInterval=null}started=false;document.getElementById('timer').textContent='00:00';localStorage.removeItem('puzzle_code_'+puzzleIdGlobal);document.getElementById('statusText').textContent='Waiting...';document.getElementById('passResult').textContent='-';var tc=document.getElementById('testCases');if(tc)tc.innerHTML='';if(puzzleSetCode)puzzleSetCode(await initSignature(puzzleLanguage,puzzleFuncName))})});

function updateTimerDisplay() {
    const timerEl = document.getElementById("timer");
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
}

function startTimer() {
    if (!started) {
        started = true;
        document.querySelector(".timer")?.classList.add("running");
        timerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.querySelector(".timer")?.classList.remove("running");
    started = false;
    secondsGlobal = seconds
    seconds = 0;
    updateTimerDisplay();
}

// ══════════════════════════════════════════════════════
// SUBMIT & RESULTS
// ══════════════════════════════════════════════════════

async function handleSubmit() {
    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("statusText");
    const passResult = document.getElementById("passResult");
    const testCases = document.getElementById("testCases");

    if (!puzzleIdGlobal || !puzzleFuncName) {
        statusText.textContent = "Error: Puzzle not loaded";
        statusText.className = "status fail";
        submitBtn.disabled = false;
        return;
    }

    const body = {
        puz_id: parseInt(puzzleIdGlobal),
        lang_id: puzzleLangId,
        user_code: typeof window.getEditorCode === 'function' ? window.getEditorCode() : '',
        function_name: puzzleFuncName
    };

    var result = await apiPost('/submit', body);

    statusText.className = '';
    testCases.innerHTML = '';

    // ── Lỗi ──
    if (result.error) {
        statusText.textContent = 'Error';
        statusText.className = 'status fail';
        passResult.textContent = '0/0';

        const p = document.createElement('p');
        p.textContent = result.errorMsg || result.error;
        testCases.appendChild(p);

        if (result.compile_output) {
            const strong = document.createElement('strong');
            strong.textContent = 'Compiler Output:';
            testCases.appendChild(strong);
            const pre = document.createElement('pre');
            pre.textContent = result.compile_output;
            testCases.appendChild(pre);
        }

        if (result.stderr) {
            const strong = document.createElement('strong');
            strong.textContent = 'Stderr:';
            testCases.appendChild(strong);
            const pre = document.createElement('pre');
            pre.textContent = result.stderr;
            testCases.appendChild(pre);
        }

        submitBtn.disabled = false;
        return;
    }

    // ── Thành công / thất bại ──
    passResult.textContent = result.testpassed + '/' + result.testcount;
    statusText.textContent = result.puzzlepass ? 'Accepted' : 'Failed';
    statusText.className = result.puzzlepass ? 'status success' : 'status fail';

    // Hiển thị thời gian thực thi
    if (result.time || result.memory) {
        const timeSpan = document.createElement('span');
        timeSpan.textContent = 'Total runtime: ' + (result.time || 0) + 's';

        const solveTimeSpan = document.createElement('span');
        const m = String(Math.floor(secondsGlobal / 60)).padStart(2, '0');
        const s = String(secondsGlobal % 60).padStart(2, '0');
        solveTimeSpan.textContent = 'Total solve time: ' + m + ':' + s;

        testCases.appendChild(timeSpan)
        testCases.appendChild(solveTimeSpan);
    }

    // Hiển thị test cases
    if (result.testcases) {
        const heading = document.createElement('strong');
        heading.textContent = 'Test Cases';
        testCases.appendChild(heading);

        result.testcases.forEach(function(tc) {
            const wrap = document.createElement('pre')
            const div = document.createElement('div');
            div.className = tc.passed ? 'testcase-row success' : 'testcase-row fail';

            const indexDiv = document.createElement('div');
            indexDiv.textContent = 'Test Case #' + tc.index;
            div.appendChild(indexDiv);

            const statusDiv = document.createElement('div');
            statusDiv.textContent = 'Status: ' + (tc.status || '-');
            div.appendChild(statusDiv);

            const timeDiv = document.createElement('div');
            timeDiv.textContent = 'Time: ' + (tc.time || 0) + 's';
            div.appendChild(timeDiv);

            const memoryDiv = document.createElement('div');
            memoryDiv.textContent = 'Memory: ' + (tc.memory || 0) + ' KB';
            div.appendChild(memoryDiv);

            wrap.appendChild(div)
            testCases.appendChild(wrap);
        });
    }

    // Compiler output
    if (result.compile_output) {
        const strong = document.createElement('strong');
        strong.textContent = 'Compiler Output:';
        testCases.appendChild(strong);
        const pre = document.createElement('pre');
        pre.textContent = result.compile_output;
        testCases.appendChild(pre);
    }

    // Stderr
    if (result.stderr) {
        const strong = document.createElement('strong');
        strong.textContent = 'Stderr:';
        testCases.appendChild(strong);
        const pre = document.createElement('pre');
        pre.textContent = result.stderr;
        testCases.appendChild(pre);
    }

    // Không có gì → tất cả test cases pass
    if (testCases.children.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'All test cases passed!';
        testCases.appendChild(p);
    }

    if (result.puzzlepass) {
        localStorage.removeItem("puzzle_code_" + puzzleIdGlobal);
    }

    submitBtn.disabled = false;

    const resultsTab = document.querySelector('.solve-tab[data-tab="results"]');
    if (resultsTab) resultsTab.click();
}

function initSubmit() {
    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("statusText");

    submitBtn.addEventListener("click", () => {
        if (submitBtn.disabled) return;
        stopTimer();
        submitBtn.disabled = true;
        statusText.className = "status pending";
        statusText.textContent = "Running";
        handleSubmit();
    });

    document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            submitBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            var code = typeof window.getEditorCode === 'function' ? window.getEditorCode() : '';
            if (puzzleIdGlobal && code) {
                localStorage.setItem("puzzle_code_" + puzzleIdGlobal, code);
                if (statusText) {
                    statusText.className = "status success";
                    statusText.textContent = "Saved";
                    setTimeout(function() {
                        if (statusText) {
                            statusText.className = "";
                            statusText.textContent = "";
                        }
                    }, 2000);
                }
            }
        }
    });
}
