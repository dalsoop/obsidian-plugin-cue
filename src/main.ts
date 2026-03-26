import { Plugin, MarkdownPostProcessorContext, MarkdownView } from "obsidian";
import { cueHighlight } from "./highlight";

export default class CuePlugin extends Plugin {
	async onload() {
		// 1. ```cue 코드블록 렌더러
		this.registerMarkdownCodeBlockProcessor("cue", (source, el, ctx) => {
			this.renderCueBlock(source, el);
		});

		// 2. .cue 파일 뷰어
		this.registerExtensions(["cue"], "markdown");

		// 3. CUE 스니펫 커맨드
		this.addCommand({
			id: "insert-cue-block",
			name: "Insert CUE code block",
			editorCallback: (editor) => {
				editor.replaceSelection("```cue\n\n```");
				const cursor = editor.getCursor();
				editor.setCursor({ line: cursor.line - 1, ch: 0 });
			},
		});

		this.addCommand({
			id: "insert-cue-schema",
			name: "Insert CUE schema template",
			editorCallback: (editor) => {
				const template = `\`\`\`cue
package config

#Schema: {
    name:    string
    version: string & =~"^v[0-9]+\\\\.[0-9]+\\\\.[0-9]+$"
    env:     "dev" | "staging" | "prod"
    port:    int & >0 & <65536
    debug:   bool | *false
}
\`\`\``;
				editor.replaceSelection(template);
			},
		});

		this.addCommand({
			id: "insert-cue-config",
			name: "Insert CUE config template",
			editorCallback: (editor) => {
				const template = `\`\`\`cue
package config

import "encoding/json"

config: {
    host:     string | *"localhost"
    port:     int | *8080
    database: #Database
}

#Database: {
    host:     string
    port:     int | *5432
    name:     string
    user:     string
    password: string
}
\`\`\``;
				editor.replaceSelection(template);
			},
		});

		console.log("CUE Language plugin loaded");
	}

	onunload() {
		console.log("CUE Language plugin unloaded");
	}

	private renderCueBlock(source: string, el: HTMLElement) {
		const pre = el.createEl("pre", { cls: "cue-code-block" });
		const code = pre.createEl("code", { cls: "language-cue" });

		const tokens = cueHighlight(source);
		for (const token of tokens) {
			const span = code.createEl("span", { cls: `cue-${token.type}` });
			span.textContent = token.value;
		}
	}
}
