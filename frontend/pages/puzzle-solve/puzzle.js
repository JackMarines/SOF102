// ===========================
// ELEMENTS
// ===========================

import { editor } from './CodeMirror.js';

const codeEditor = document.getElementById("codeEditor");

const codeEditorContent = document.getElementById("codeEditor").textContent;

const timer = document.getElementById("timer");

const submitBtn = document.getElementById("submitBtn");

const statusText = document.getElementById("statusText");

const passResult = document.getElementById("passResult");

const testCases = document.getElementById("testCases");

const workspace = document.querySelector(".workspace");

const topPanel = document.querySelector(".top-panel");

const verticalResizer = document.getElementById("verticalResizer");

const horizontalResizer = document.getElementById("horizontalResizer");

const code = "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nExample:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: [4,-1,2,1] has the largest sum = 6.\n\nConstraints:\n- 1 <= nums.length <= 10^5\n- -10^4 <= nums[i] <= 10^4"

// ===========================
// set code template
// ===========================

function setCode(code) {
    editor.dispatch({
        changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: code
        }
    });
}

setCode(code);

// ===========================
// get user's code input
// ===========================

function getCode() {
    return editor.state.doc.toString();
}

// ===========================
// TIMER
// ===========================

let started = false;

let seconds = 0;

let timerInterval;

function updateTimer() {

    const m = String(Math.floor(seconds / 60)).padStart(2, "0");

    const s = String(seconds % 60).padStart(2, "0");

    timer.textContent = `${m}:${s}`;

}

codeEditor.addEventListener("input", () => {

    if (!started) {

        started = true;

        timerInterval = setInterval(() => {

            seconds++;

            updateTimer();

        }, 1000);

    }

});

// ===========================
// SUBMIT
// ===========================

submitBtn.addEventListener("click", () => {

    submitBtn.disabled = true;


    statusText.className = "status pending";

    statusText.textContent = "Running";

    setTimeout(runFakeJudge, 1200);

});

function runFakeJudge() {
    const code = getCode();
    console.log(code);
    const pass = Math.random() > 0.5;

    if (pass) {

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
// RESIZE LEFT / RIGHT
// ===========================

let isVertical = false;

verticalResizer.addEventListener("mousedown", () => {

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

// ===========================
// RESIZE TOP / BOTTOM
// ===========================

let isHorizontal = false;

horizontalResizer.addEventListener("mousedown", () => {

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

// // ===========================
// // STOP SELECT TEXT WHEN DRAG
// // ===========================

// document.addEventListener("dragstart", (e) => {

//     e.preventDefault();

// });

// // ===========================
// // TAB KEY
// // ===========================

// codeEditor.addEventListener("keydown", function (e) {

//     if (e.key === "Tab") {

//         e.preventDefault();

//         const start = this.selectionStart;

//         const end = this.selectionEnd;

//         this.value =
//             this.value.substring(0, start) +
//             "    " +
//             this.value.substring(end);

//         this.selectionStart =

//         this.selectionEnd = start + 4;

//     }

// });

// // ===========================
// // CTRL + ENTER
// // ===========================

// codeEditor.addEventListener("keydown", (e) => {

//     if (e.ctrlKey && e.key === "Enter") {

//         submitBtn.click();

//     }

// });