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

    if (result.error) {
        statusText.textContent = 'Error';
        statusText.className = 'status fail';
        passResult.textContent = '0/0';
        var html = '<p class="placeholder">' + (result.errorMsg || result.error) + '</p>';
        if (result.compile_output) {
            html += '<hr><strong>Compiler Output:</strong><pre>'
                  + result.compile_output + '</pre>';
        }
        if (result.stderr) {
            html += '<hr><strong>Stderr:</strong><pre>'
                  + result.stderr + '</pre>';
        }
        testCases.innerHTML = html;
        submitBtn.disabled = false;
        return;
    }

    passResult.textContent = result.testpassed + '/' + result.testcount;
    statusText.textContent = result.puzzlepass ? 'Accepted' : 'Failed';
    statusText.className = result.puzzlepass ? 'status success' : 'status fail';

    var html = '';

    if (result.time || result.memory) {
        html += '<div class="execution-stats">'
              + '<span>Time: ' + (result.time || 0) + 's</span>'
              + '<span>Memory: ' + (result.memory || 0) + ' KB</span>'
              + '</div>';
    }

    if (result.testfailed && result.testfailed.length > 0) {
        html += '<hr><strong>Failed Test Cases:</strong>';
        result.testfailed.forEach(function(f) {
            html += '<div class="testcase-row failed">'
                  + '<div>Input: ' + f.input + '</div>'
                  + '<div>Expected: ' + f.expected + '</div>'
                  + '<div>Got: ' + f.got + '</div>'
                  + (f.time ? '<div>Time: ' + f.time + 's</div>' : '')
                  + (f.memory ? '<div>Memory: ' + f.memory + ' KB</div>' : '')
                  + (f.stderr ? '<div class="stderr">Stderr: ' + f.stderr + '</div>' : '')
                  + '</div>';
        });
    }

    if (result.compile_output) {
        html += '<hr><strong>Compiler Output:</strong><pre>'
              + result.compile_output + '</pre>';
    }

    if (result.stderr) {
        html += '<hr><strong>Stderr:</strong><pre>'
              + result.stderr + '</pre>';
    }

    testCases.innerHTML = html
        || '<p class="placeholder">All test cases passed!</p>';

    if (result.puzzlepass) {
        localStorage.removeItem("puzzle_code_" + puzzleIdGlobal);
    }

    submitBtn.disabled = false;
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
    else if (lang.includes('java')) puzzleLangId = 4;
    else if (lang.includes('c++') || lang.includes('cpp')) puzzleLangId = 5;
    else if (lang.includes('c ')) puzzleLangId = 6;
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

// ===========================
// RESIZE TOP / BOTTOM
// ===========================

function initHorizontalResize() {
    const resizer = document.getElementById("horizontalResizer");
    const workspace = document.querySelector(".workspace");

    let isHorizontal = false;

    resizer.addEventListener("mousedown", () => {

        isHorizontal = true;

    });

    document.addEventListener("mouseup", () => {

        isHorizontal = false;

    });

    document.addEventListener("mousemove", (e) => {

        if (!isHorizontal) return;

        const top = workspace.getBoundingClientRect().top;

        const totalHeight = workspace.offsetHeight;

        let h = e.clientY - top;

        h = Math.max(220, h);

        h = Math.min(totalHeight - 180, h);

        workspace.style.gridTemplateRows =
            `${h}px 6px auto`;

    });
}

async function initSignature(language, functname) {
    const response = await fetch("/frontend/assets/text/signature_"+language+".txt");
    const text = await response.text();
    const result = text.replaceAll("${FUNC_NAME}", functname )
    console.log(result);
    return result;
}
