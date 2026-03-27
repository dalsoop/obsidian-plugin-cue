export interface Token {
	type: string;
	value: string;
}

const KEYWORDS = new Set([
	"package", "import", "let", "if", "for", "in",
	"true", "false", "null", "_|_",
]);

const BUILTINS = new Set([
	"len", "close", "and", "or", "div", "mod", "quo", "rem",
	"bool", "string", "bytes", "number", "int", "float",
	"uint", "uint8", "uint16", "uint32", "uint64", "uint128",
	"int8", "int16", "int32", "int64", "int128",
	"float32", "float64",
	"struct", "list",
]);

export function cueHighlight(source: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	while (i < source.length) {
		// Comments
		if (source[i] === "/" && source[i + 1] === "/") {
			let end = source.indexOf("\n", i);
			if (end === -1) end = source.length;
			tokens.push({ type: "comment", value: source.slice(i, end) });
			i = end;
			continue;
		}

		// Strings (double-quoted)
		if (source[i] === '"') {
			let end = i + 1;
			while (end < source.length && source[end] !== '"') {
				if (source[end] === "\\") end++;
				end++;
			}
			end++;
			tokens.push({ type: "string", value: source.slice(i, end) });
			i = end;
			continue;
		}

		// Multi-line strings
		if (source[i] === "#" && source[i + 1] === '"') {
			const closer = '"#';
			let end = source.indexOf(closer, i + 2);
			if (end === -1) end = source.length;
			else end += closer.length;
			tokens.push({ type: "string", value: source.slice(i, end) });
			i = end;
			continue;
		}

		// Numbers
		if (/[0-9]/.test(source[i]) || (source[i] === "-" && /[0-9]/.test(source[i + 1] || ""))) {
			let end = i;
			if (source[end] === "-") end++;
			while (end < source.length && /[0-9._eExXoObBa-fA-F]/.test(source[end])) end++;
			tokens.push({ type: "number", value: source.slice(i, end) });
			i = end;
			continue;
		}

		// Identifiers, keywords, definitions
		if (/[a-zA-Z_#]/.test(source[i])) {
			let end = i;
			if (source[i] === "#") end++; // skip # itself
			while (end < source.length && /[a-zA-Z0-9_]/.test(source[end])) end++;
			if (end === i) { // safety: no progress
				tokens.push({ type: "plain", value: source[i] });
				i++;
				continue;
			}
			const word = source.slice(i, end);

			if (word.startsWith("#")) {
				tokens.push({ type: "definition", value: word });
			} else if (KEYWORDS.has(word)) {
				tokens.push({ type: "keyword", value: word });
			} else if (BUILTINS.has(word)) {
				tokens.push({ type: "builtin", value: word });
			} else if (source[end] === ":") {
				tokens.push({ type: "field", value: word });
			} else {
				tokens.push({ type: "identifier", value: word });
			}
			i = end;
			continue;
		}

		// Operators
		if ("=!<>&|*+-.?:".includes(source[i])) {
			let end = i + 1;
			while (end < source.length && "=!<>&|*+-.?:~".includes(source[end])) end++;
			tokens.push({ type: "operator", value: source.slice(i, end) });
			i = end;
			continue;
		}

		// Brackets
		if ("{}[]()".includes(source[i])) {
			tokens.push({ type: "bracket", value: source[i] });
			i++;
			continue;
		}

		// Whitespace
		if (/\s/.test(source[i])) {
			let end = i;
			while (end < source.length && /\s/.test(source[end])) end++;
			tokens.push({ type: "whitespace", value: source.slice(i, end) });
			i = end;
			continue;
		}

		// Other
		tokens.push({ type: "plain", value: source[i] });
		i++;
	}

	return tokens;
}
