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

function runFakeJudge() {
    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("statusText");
    const passResult = document.getElementById("passResult");
    const testCases = document.getElementById("testCases");

    const pass = Math.random() > 0.5;

    if (pass) {
        const params = new URLSearchParams(window.location.search);
        localStorage.removeItem("puzzle_code_" + params.get("id"));

        statusText.textContent = "Accepted";

        statusText.className = "status success";

        passResult.textContent = "true";

        passResult.style.color = "#4ade80";

    }

    else {

        statusText.textContent = "Failed";

        statusText.className = "status fail";

        passResult.textContent = "false";

        passResult.style.color = "#ef4444";

    }

    testCases.innerHTML = "";

    for (let i = 1; i <= 5; i++) {

        const ok = pass || Math.random() > 0.45;

        const div = document.createElement("div");

        div.className = "test-item";

        div.innerHTML = `
            <strong>Testcase ${i}</strong><br>
            Result :
            <span style="color:${ok ? '#4ade80' : '#ef4444'}">
                ${ok ? 'PASS' : 'FAIL'}
            </span>
        `;

        testCases.appendChild(div);

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

    showSpinner("puzzlePanel");

    const puzzle = await getPuzzleById(id)
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

        setTimeout(runFakeJudge, 1200);

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
