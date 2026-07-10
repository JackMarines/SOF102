// ===========================
// TIMER
// ===========================

let started = false;

let seconds = 0;

let timerInterval;

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

    seconds = 0;

    updateTimerDisplay();

}

// ===========================
// JUDGE
// ===========================

let puzzleIdGlobal = null;
let puzzleFuncName = null;
let puzzleLangId = 1;

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

    // ---- Error path ----
    if (result.error) {
        statusText.textContent = 'Error';
        statusText.className = 'status fail';
        passResult.textContent = '0/0';

        const p = document.createElement('p');
        p.className = 'placeholder';
        p.textContent = result.errorMsg || result.error;
        testCases.appendChild(p);

        if (result.compile_output) {
            testCases.appendChild(document.createElement('hr'));
            const strong = document.createElement('strong');
            strong.textContent = 'Compiler Output:';
            testCases.appendChild(strong);
            const pre = document.createElement('pre');
            pre.textContent = result.compile_output;
            testCases.appendChild(pre);
        }

        if (result.stderr) {
            testCases.appendChild(document.createElement('hr'));
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

    // ---- Success / failure path ----
    passResult.textContent = result.testpassed + '/' + result.testcount;
    statusText.textContent = result.puzzlepass ? 'Accepted' : 'Failed';
    statusText.className = result.puzzlepass ? 'status success' : 'status fail';

    // Execution stats
    if (result.time || result.memory) {
        const stats = document.createElement('div');
        stats.className = 'execution-stats';

        const timeSpan = document.createElement('span');
        timeSpan.textContent = 'Time: ' + (result.time || 0) + 's';

        const memorySpan = document.createElement('span');
        memorySpan.textContent = 'Memory: ' + (result.memory || 0) + ' KB';

        stats.append(timeSpan, memorySpan);
        testCases.appendChild(stats);
    }

    // Failed test cases
    if (result.testfailed && result.testfailed.length > 0) {
        testCases.appendChild(document.createElement('hr'));
        const strong = document.createElement('strong');
        strong.textContent = 'Failed Test Cases:';
        testCases.appendChild(strong);

        result.testfailed.forEach(function(f) {
            const div = document.createElement('div');
            div.className = 'testcase-row failed';

            const input = document.createElement('div');
            input.textContent = 'Input: ' + f.input;
            div.appendChild(input);

            const expected = document.createElement('div');
            expected.textContent = 'Expected: ' + f.expected;
            div.appendChild(expected);

            const got = document.createElement('div');
            got.textContent = 'Got: ' + f.got;
            div.appendChild(got);

            if (f.status) {
                const statusDiv = document.createElement('div');
                statusDiv.textContent = 'Status: ' + f.status;
                div.appendChild(statusDiv);
            }

            if (f.time) {
                const timeDiv = document.createElement('div');
                timeDiv.textContent = 'Time: ' + f.time + 's';
                div.appendChild(timeDiv);
            }

            if (f.memory) {
                const memoryDiv = document.createElement('div');
                memoryDiv.textContent = 'Memory: ' + f.memory + ' KB';
                div.appendChild(memoryDiv);
            }

            if (f.stderr) {
                const stderrDiv = document.createElement('div');
                stderrDiv.className = 'stderr';
                stderrDiv.textContent = 'Stderr: ' + f.stderr;
                div.appendChild(stderrDiv);
            }

            testCases.appendChild(div);
        });
    }

    // Compiler output
    if (result.compile_output) {
        testCases.appendChild(document.createElement('hr'));
        const strong = document.createElement('strong');
        strong.textContent = 'Compiler Output:';
        testCases.appendChild(strong);
        const pre = document.createElement('pre');
        pre.textContent = result.compile_output;
        testCases.appendChild(pre);
    }

    // Stderr
    if (result.stderr) {
        testCases.appendChild(document.createElement('hr'));
        const strong = document.createElement('strong');
        strong.textContent = 'Stderr:';
        testCases.appendChild(strong);
        const pre = document.createElement('pre');
        pre.textContent = result.stderr;
        testCases.appendChild(pre);
    }

    // Nothing added → all passed
    if (testCases.children.length === 0) {
        const p = document.createElement('p');
        p.className = 'placeholder';
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

// ===========================
// LOAD PUZZLE
// ===========================

checkAuth();

async function loadPuzzle(setLanguage, setCode) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    puzzleIdGlobal = id;
    puzzleFuncName = null;
    puzzleLangId = 1;

    showSpinner("puzzlePanel");

    const puzzle = await getPuzzleById(id);
    puzzleFuncName = puzzle.functionName;
    var lang = (puzzle.language || '').toLowerCase();
    if (lang.includes('python')) puzzleLangId = 1;
    else if (lang.includes('javascript') || lang.includes('node')) puzzleLangId = 2;
    else if (lang.includes('php')) puzzleLangId = 3;

    const container = document.getElementById("puzzlePanel");
    hideSpinner("puzzlePanel");

    const panelHeader = document.createElement("div");
    panelHeader.classList.add("panel-header")

    const title = document.createElement("h2");
    title.textContent = `${puzzle.id}. ${puzzle.title}`

    const badges = document.createElement("div");
    badges.classList.add("badges")

        const difficulty = document.createElement("span");
        difficulty.textContent = puzzle.difficulty
        if (difficulty.textContent === "Easy") {
            difficulty.classList.add("easy");
        } else if (difficulty.textContent === "Medium") {
            difficulty.classList.add("medium");
        } else if (difficulty.textContent === "Hard") {
            difficulty.classList.add("hard");
        }

        const language = document.createElement("span");
        language.textContent = puzzle.language
        language.classList.add("language")
        setLanguage(puzzle.language)



    const panelContent = document.createElement("div");
    panelContent.classList.add("panel-content")

    const content = document.createElement("p");
    content.textContent = puzzle.content



    panelHeader.append(title, badges);
    panelContent.append(content);
    badges.append(language, difficulty);
    container.append(panelHeader, panelContent);

    const saved = localStorage.getItem("puzzle_code_" + id);
    if (saved) {
        setCode(saved);
    } else {
        setCode(await initSignature(puzzle.language, puzzle.functionName));
    }
}

// ===========================
// SOLVE TABS
// ===========================

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

// ===========================
// SUBMIT
// ===========================

function initSubmit() {
    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("statusText");

    submitBtn.addEventListener("click", () => {

        stopTimer();

        submitBtn.disabled = true;

        statusText.className = "status pending";

        statusText.textContent = "Running";

        handleSubmit();

    });
}

// ===========================
// RESIZE LEFT / RIGHT
// ===========================

function initVerticalResize() {
    const resizer = document.getElementById("verticalResizer");
    const topPanel = document.querySelector(".top-panel");

    let isVertical = false;

    resizer.addEventListener("mousedown", () => {

        isVertical = true;

    });

    document.addEventListener("mouseup", () => {

        isVertical = false;

    });

    document.addEventListener("mousemove", (e) => {

        if (!isVertical) return;

        const total = topPanel.offsetWidth;

        let left = e.clientX;

        left = Math.max(250, left);

        left = Math.min(total - 350, left);

        topPanel.style.gridTemplateColumns =
            `${left}px 6px auto`;

    });
}

async function initSignature(language, functname) {
    const response = await fetch("/frontend/assets/text/signature_"+language+".txt");
    const text = await response.text();
    const result = text.replaceAll("${FUNC_NAME}", functname )
    console.log(result);
    return result;
}
