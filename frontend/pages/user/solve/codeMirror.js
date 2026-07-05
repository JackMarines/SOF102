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
        javascript(),
        theme,
        oneDark,
        EditorState.tabSize.of(4),
        indentUnit.of("    "),
        EditorView.lineWrapping
    ],
    parent: document.getElementById("codeEditor")
});

console.log("codemirror imported");
export { editor };