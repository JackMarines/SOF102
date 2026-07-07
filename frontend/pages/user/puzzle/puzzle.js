// current active filters
let currentSearch = '';
let currentDifficulty = '';

function updateDropdownText() {
    const btn = document.getElementById("dropdownButton");
    btn.textContent = currentDifficulty || "Difficulty";
}

// fetch puzzles with current filters, then render
async function fetchPuzzles(page) {
    const response = await getFilteredPuzzles(currentSearch, currentDifficulty, page, 6);
    renderPuzzles(response);
}

// search by title
async function searchPuzzles() {
    const input = document.getElementById("input");
    currentSearch = input.value.trim();
    loadPuzzles(1);
}

// filter by difficulty
function sortPuzzlesDifficulty(difficulty) {
    currentDifficulty = difficulty;
    updateDropdownText();
    loadPuzzles(1);
}

// clear difficulty filter
function clearFilter() {
    currentDifficulty = '';
    updateDropdownText();
    loadPuzzles(1);
}

async function renderPuzzles(response) {
    const container = document.getElementById("puzzleList");
    container.innerHTML = '';

    // render each puzzle row
    for (const puzzle of response.data) {
        const link = document.createElement("a");
        link.href = `/solve?id=${puzzle.id}`;

        const row = document.createElement("div");
        row.classList.add("puzzle-item")

        const id = document.createElement("span");
        id.textContent = puzzle.id
        id.classList.add("id")

        const title = document.createElement("span");
        title.textContent = puzzle.title
        title.classList.add("puzzle-title")

        const language = document.createElement("span");
        language.textContent = puzzle.language
        language.classList.add("lang")

        const difficulty = document.createElement("span");
        difficulty.textContent = puzzle.difficulty
        if (difficulty.textContent === "Easy") {
            difficulty.classList.add("easy");
        } else if (difficulty.textContent === "Medium") {
            difficulty.classList.add("medium");
        } else if (difficulty.textContent === "Hard") {
            difficulty.classList.add("hard");
        }
        row.append(id, title, language, difficulty);
        link.appendChild(row)
        container.appendChild(link);
    }

    // pagination: sliding window of 3 page buttons
    const currentPage = response.pagination.page
    const totalPages = response.pagination.totalPages

    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, currentPage + 1);

    if (end - start < 2) {
        if (start === 1) end = Math.min(3, totalPages);
        else start = Math.max(1, totalPages - 2);
    }

    // build pagination buttons
    const paginationDiv = document.getElementById("pagination");
    paginationDiv.onclick = function (e) {
        const text = e.target.textContent;
        if (text === "Prev" && currentPage > 1) loadPuzzles(currentPage - 1);
        else if (text === "Next" && currentPage < totalPages) loadPuzzles(currentPage + 1);
        else if (text === "First") loadPuzzles(1);
        else if (text === "Last") loadPuzzles(totalPages);
        else {
            const pageNum = parseInt(text);
            if (!isNaN(pageNum)) loadPuzzles(pageNum);
        }
    };
    paginationDiv.innerHTML = '';

    const first = document.createElement("a");
    first.textContent = "First";
    first.classList.add("page");
    paginationDiv.append(first);

    const prev = document.createElement("a");
    prev.textContent = "Prev";
    prev.classList.add("page");
    paginationDiv.append(prev);

    for (let i = start; i <= end; i++) {
        const pageNum = document.createElement("a");
        pageNum.textContent = i
        pageNum.classList.add("page");
        if (i === currentPage) {
            pageNum.classList.add("active");
        }
        paginationDiv.append(pageNum);
    }

    const next = document.createElement("a");
    next.textContent = "Next";
    next.classList.add("page");
    paginationDiv.append(next);

    const last = document.createElement("a");
    last.textContent = "Last";
    last.classList.add("page");
    paginationDiv.append(last);
}

// orchestrator: load a page (keeps current filters)
async function loadPuzzles(page = 1) {
    fetchPuzzles(page);
}

checkAuth().then(() => loadPuzzles())
