async function loadPuzzles() {
    console.log("consolelog online")

    const response = await findAllPuzzles();

    const container = document.getElementById("puzzleList");

    for (const puzzle of response.data) {
        const row = document.createElement("div");
        row.classList.add("puzzle-item")

        const id = document.createElement("span");
        id.textContent = puzzle.id
        id.classList.add("id")

        const title = document.createElement("span");
        title.textContent = puzzle.title
        title.classList.add("title")

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

        row.append(id,title,language, difficulty);
        container.appendChild(row);
    }
}

loadPuzzles();
