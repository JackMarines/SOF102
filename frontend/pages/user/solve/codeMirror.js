// CodeMirror editor wrapper — handles language switching, code persistence, and submission callback
import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { keymap } from "https://esm.sh/@codemirror/view";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript";
import { python } from "https://esm.sh/@codemirror/lang-python";
import { EditorState } from "https://esm.sh/@codemirror/state";
import { indentWithTab } from "https://esm.sh/@codemirror/commands";
import { indentUnit } from "https://esm.sh/@codemirror/language";
import { Prec } from "https://esm.sh/@codemirror/state";
import {autocompletion,acceptCompletion} from "https://esm.sh/@codemirror/autocomplete";
import { php } from "https://esm.sh/@codemirror/lang-php";
import { Compartment } from "https://esm.sh/@codemirror/state";



const language = new Compartment();
const submitKeyCompartment = new Compartment();

const tabKey = keymap.of([
    indentWithTab
]);

const completionKey = keymap.of([
    {
        key: "Tab",
        run: acceptCompletion
    }
]);

const theme = EditorView.theme({
    ".cm-selectionBackground": {
        backgroundColor: "rgba(100, 150, 255, 0.35)"
    }
});

export const languages = {
    JavaScript: javascript(),
    PHP: php(),
    Python: python()
};

const editor = new EditorView({
    doc: "",
    extensions: [
        submitKeyCompartment.of([]),
        basicSetup,
        completionKey,
        tabKey,
        language.of(javascript()),
        theme,
        oneDark,
        EditorState.tabSize.of(4),
        indentUnit.of("    "),
        EditorView.lineWrapping
    ],
    parent: document.getElementById("codeEditor")
});

export function setLanguage(lang) {
    editor.dispatch({
        effects: language.reconfigure(
            languages[lang] ?? javascript(),
        )
    });
}

export function setCode(code) {
    editor.dispatch({
        changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: code
        }
    });
}

export function getCode() {
    return editor.state.doc.toString();
}

export const setSubmitCallback = (fn) => {
    editor.dispatch({
        effects: submitKeyCompartment.reconfigure(
            keymap.of([{
                key: "Ctrl-Enter",
                mac: "Cmd-Enter",
                run: () => { fn(); return true; }
            }])
        )
    });
};

console.log("codemirror imported");
export { editor };