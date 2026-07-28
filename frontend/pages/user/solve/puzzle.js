// Solve page orchestrator — manages code editor, submission, and result display
import { setLanguage, setCode, getCode,setSubmitCallback, editor, languages } from './codeMirror.js';

setSubmitCallback(() => document.getElementById("submitBtn").click());
const codeEditor = document.getElementById("codeEditor");


loadPuzzle(setLanguage, setCode);

const puzzleId = new URLSearchParams(window.location.search).get("id");

window.getEditorCode = getCode;

codeEditor.addEventListener("input", () => {

    startTimer();

    localStorage.setItem("puzzle_code_" + puzzleId, getCode());

});

initSubmit();
initSolveTabs();
