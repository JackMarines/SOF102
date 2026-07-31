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

    document.title = 'DEVCLIMB | Solve (' + puzzle.language + ')';

    var fnEl = document.getElementById('solution-filename');
    var lang = (puzzle.language || '').toLowerCase();
    if (lang.includes('python')) fnEl.textContent = 'solution.py';
    else if (lang.includes('javascript') || lang.includes('node')) fnEl.textContent = 'solution.js';
    else if (lang.includes('php')) fnEl.textContent = 'solution.php';
    else fnEl.textContent = 'solution.txt';

    document.getElementById('solution-lang-name').textContent = puzzle.language;

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
        function_name: puzzleFuncName,
        prog_time: secondsGlobal,
        prog_code: typeof window.getEditorCode === 'function' ? window.getEditorCode() : ''
    };

    var result = await apiPost('/submit', body);
    console.log("FULL SUBMIT RESULT:", result);
console.log("FAILED TESTCASES:", result.testfailed);

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
        const timeBox = document.createElement('div');
        timeBox.style.cssText = 'padding:var(--space-8px) 0;font-size:0.8125rem;color:var(--text-secondary);';

        const timeSpan = document.createElement('span');
        timeSpan.textContent = 'Total runtime: ' + (result.time || 0) + 's';

        const solveTimeSpan = document.createElement('span');
        const m = String(Math.floor(secondsGlobal / 60)).padStart(2, '0');
        const s = String(secondsGlobal % 60).padStart(2, '0');
        solveTimeSpan.textContent = 'Total solve time: ' + m + ':' + s;

        timeBox.appendChild(timeSpan);
        timeBox.appendChild(document.createTextNode(' \u00b7 '));
        timeBox.appendChild(solveTimeSpan);
        testCases.appendChild(timeBox);
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

        // Trophy award popup
        if (result.trophyAwarded) {
            setTimeout(function () {
                Popup.open({
                    id: 'trophy-popup',
                    size: 'sm',
                    title: null,
                    className: 'trophy-popup',
                    render: function (ctx) {
                        ctx.footer.style.display = 'none';

                        var header = document.createElement('div');
                        header.className = 'trophy-popup-header';
                        var label = document.createElement('span');
                        label.textContent = 'REWARD_STDOUT';
                        header.appendChild(label);
                        var closeSquare = document.createElement('button');
                        closeSquare.className = 'trophy-popup-close';
                        closeSquare.addEventListener('click', function () { ctx.close(); });
                        header.appendChild(closeSquare);
                        ctx.body.parentElement.insertBefore(header, ctx.body);

                        ctx.body.style.padding = '0';
                        ctx.body.style.margin = '0';

                        var inner = document.createElement('div');
                        inner.className = 'trophy-popup-body';

                        var iconWrap = document.createElement('div');
                        iconWrap.className = 'trophy-popup-icon';
                        var icon = document.createElement('span');
                        icon.className = 'material-symbols-outlined';
                        icon.textContent = 'emoji_events';
                        iconWrap.appendChild(icon);
                        inner.appendChild(iconWrap);

                        var title = document.createElement('div');
                        title.className = 'trophy-popup-title';
                        title.textContent = 'REWARD UNLOCKED';
                        inner.appendChild(title);

                        var line = document.createElement('div');
                        line.className = 'trophy-popup-gradient-line';
                        inner.appendChild(line);

                        if (result.trophyAvatar) {
                            var imgContainer = document.createElement('div');
                            imgContainer.className = 'trophy-popup-image';
                            var img = document.createElement('img');
                            img.src = result.trophyAvatar;
                            img.alt = result.trophyName || '';
                            imgContainer.appendChild(img);
                            inner.appendChild(imgContainer);
                        }

                        var name = document.createElement('div');
                        name.className = 'trophy-popup-name';
                        name.textContent = result.trophyName || '';
                        inner.appendChild(name);

                        var desc = document.createElement('p');
                        desc.className = 'trophy-popup-desc';
                        desc.textContent = 'You completed all puzzles in this contest!';
                        inner.appendChild(desc);

                        var closeFull = document.createElement('button');
                        closeFull.style.cssText = 'width:100%;margin-top:var(--space-8px);padding:var(--space-12px);border:1px solid var(--accent);background:transparent;color:var(--accent);font-family:var(--font-mono);font-size:0.8125rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:all 150ms;';
                        closeFull.textContent = 'CLOSE';
                        closeFull.addEventListener('mouseenter', function () {
                            this.style.background = 'var(--accent)';
                            this.style.color = 'var(--bg-base)';
                        });
                        closeFull.addEventListener('mouseleave', function () {
                            this.style.background = 'transparent';
                            this.style.color = 'var(--accent)';
                        });
                        closeFull.addEventListener('click', function () { ctx.close(); });
                        inner.appendChild(closeFull);

                        ctx.body.appendChild(inner);

                        var footerBar = document.createElement('div');
                        footerBar.className = 'trophy-popup-footer-bar';
                        ctx.body.parentElement.appendChild(footerBar);
                    }
                });
            }, 300);
        }

        // Contest progress message
        if (result.contestProgress) {
            var cp = result.contestProgress;
            var progressMsg = document.createElement('div');
            progressMsg.style.cssText = 'margin-top:var(--space-16px);padding:var(--space-12px);background:var(--bg-elevated);border:1px solid var(--border-default);font-size:0.8125rem;color:var(--text-secondary);';
            var pct = cp.total > 0 ? Math.round((cp.solved / cp.total) * 100) : 0;
            progressMsg.innerHTML = '<span style="color:var(--accent);font-weight:600;">Contest progress:</span> ' + cp.solved + '/' + cp.total + ' puzzles completed (' + pct + '%)';
            testCases.appendChild(progressMsg);
        }
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
