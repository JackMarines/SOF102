import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark";
import { python } from "https://esm.sh/@codemirror/lang-python";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript";
import { php } from "https://esm.sh/@codemirror/lang-php";
import { EditorState } from "https://esm.sh/@codemirror/state";
import { indentUnit } from "https://esm.sh/@codemirror/language";

var langMap = { Python: python, JavaScript: javascript, PHP: php };

export function createCodeModule(container, code, lang) {
  var ext = lang === 'Python' ? 'py' : lang === 'JavaScript' ? 'js' : 'php';

  container.style.padding = '0';
  container.style.alignItems = 'stretch';

  var win = document.createElement('div');
  win.className = 'code-window';
  Object.assign(win.style, {
    margin: '0',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '100%'
  });

  win.innerHTML =
    '<div class="code-bar">' +
      '<div class="code-dots">' +
        '<span class="dot red"></span>' +
        '<span class="dot yellow"></span>' +
        '<span class="dot green"></span>' +
      '</div>' +
      '<span class="code-filename">solution.' + ext + '</span>' +
    '</div>' +
    '<div class="code-module-editor" style="flex:1;min-height:0;"></div>';

  container.appendChild(win);

  var parent = win.querySelector('.code-module-editor');

  var languageFn = langMap[lang];
  if (!languageFn) languageFn = python;

  new EditorView({
    doc: code,
    extensions: [
      basicSetup,
      languageFn(),
      oneDark,
      EditorState.tabSize.of(4),
      indentUnit.of("    "),
      EditorView.lineWrapping,
      EditorView.editable.of(false),
      EditorView.theme({
        ".cm-selectionBackground": {
          backgroundColor: "rgba(100, 150, 255, 0.35)"
        }
      })
    ],
    parent: parent
  });
}
