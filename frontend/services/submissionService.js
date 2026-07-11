// ===========================
// TIMER
// ===========================

let started = false;

let seconds = 0;

let secondsGlobal = 0;

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

    secondsGlobal = seconds

    seconds = 0;

    updateTimerDisplay();

}

// ===========================
// JUDGE
// ===========================

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

        const timeSpan = document.createElement('span');
        timeSpan.textContent = 'Total runtime: ' + (result.time || 0) + 's';

        const solveTimeSpan = document.createElement('span');
        const m = String(Math.floor(secondsGlobal / 60)).padStart(2, '0');
        const s = String(secondsGlobal % 60).padStart(2, '0');
        solveTimeSpan.textContent = 'Total solve time: ' + m + ':' + s;


        testCases.appendChild(timeSpan)
        testCases.appendChild(solveTimeSpan);
        
    }

    // Test cases
    if (result.testcases) {
        testCases.appendChild(document.createElement('hr'));
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

    // Nothing added -> all passed
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
