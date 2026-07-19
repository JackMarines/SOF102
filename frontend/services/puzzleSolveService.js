let puzzleIdGlobal = null;
let puzzleFuncName = null;
let puzzleLangId = 1;

// ===========================
// LOAD PUZZLE
// ===========================

checkAuth().then(function () { document.body.style.display=''; });

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
