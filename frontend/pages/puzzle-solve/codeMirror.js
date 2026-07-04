import { EditorView, basicSetup, EditorState, Prec, indentWithTab, indentUnit, autocompletion, acceptCompletion } from "https://esm.sh/codemirror@6.0.2";
import { keymap } from "https://esm.sh/@codemirror/view@6.35.3";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark@6.1.2";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";
import { python } from "https://esm.sh/@codemirror/lang-python@6.1.6";
import { cpp } from "https://esm.sh/@codemirror/lang-cpp@6.0.2";


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

const editor = new EditorView({
    doc: "",
    extensions: [
        basicSetup,
        completionKey,
        tabKey,
        theme,
        oneDark,
        cpp(),
        EditorState.tabSize.of(4),
        indentUnit.of("    "),
        EditorView.lineWrapping
    ],
    parent: document.getElementById("codeEditor")
});

console.log("codemirror imported");
export { editor };