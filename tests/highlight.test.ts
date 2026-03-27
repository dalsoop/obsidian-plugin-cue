import { describe, it, expect } from "vitest";
import { cueHighlight, Token } from "../src/highlight";

const VALID_TYPES = ["keyword", "builtin", "definition", "field", "string", "number",
  "comment", "operator", "bracket", "identifier", "whitespace", "plain"] as const;

describe("cueHighlight", () => {
  it("should return valid Token array", () => {
    const tokens = cueHighlight('package config');
    expect(tokens.length).toBeGreaterThan(0);

    for (const token of tokens) {
      expect(VALID_TYPES).toContain(token.type);
      expect(token.value.length).toBeGreaterThan(0);
    }
  });

  it("should highlight keywords", () => {
    const tokens = cueHighlight('package import let if for in true false null');
    const keywords = tokens.filter(t => t.type === "keyword");
    expect(keywords.map(k => k.value)).toEqual(
      expect.arrayContaining(["package", "import", "let", "if", "for", "in", "true", "false", "null"])
    );
  });

  it("should highlight definitions (#Name)", () => {
    const tokens = cueHighlight('#Schema #Config #Database');
    const defs = tokens.filter(t => t.type === "definition");
    expect(defs.map(d => d.value)).toEqual(
      expect.arrayContaining(["#Schema", "#Config", "#Database"])
    );
  });

  it("should NOT freeze on # without identifier", () => {
    // 이 테스트가 무한루프 버그를 잡음
    const start = Date.now();
    const tokens = cueHighlight('#"hello"#');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100); // 100ms 이내
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("should NOT freeze on lone #", () => {
    const start = Date.now();
    const tokens = cueHighlight('# just a hash');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("should highlight strings", () => {
    const tokens = cueHighlight('"hello world"');
    const strings = tokens.filter(t => t.type === "string");
    expect(strings.length).toBe(1);
    expect(strings[0].value).toBe('"hello world"');
  });

  it("should highlight numbers", () => {
    const tokens = cueHighlight('42 3.14 0xFF');
    const nums = tokens.filter(t => t.type === "number");
    expect(nums.length).toBe(3);
  });

  it("should highlight comments", () => {
    const tokens = cueHighlight('// this is a comment\npackage foo');
    const comments = tokens.filter(t => t.type === "comment");
    expect(comments.length).toBe(1);
    expect(comments[0].value).toBe("// this is a comment");
  });

  it("should highlight fields (name followed by :)", () => {
    const source = 'name: "test"\nport: 8080';
    const tokens = cueHighlight(source);
    const fields = tokens.filter(t => t.type === "field");
    expect(fields.map(f => f.value)).toEqual(
      expect.arrayContaining(["name", "port"])
    );
  });

  it("should highlight builtins", () => {
    const tokens = cueHighlight('string int bool float');
    const builtins = tokens.filter(t => t.type === "builtin");
    expect(builtins.map(b => b.value)).toEqual(
      expect.arrayContaining(["string", "int", "bool", "float"])
    );
  });

  it("should handle complex CUE schema", () => {
    const source = `
package config

#Service: {
    name:     string & =~"^[a-z]+"
    version:  string | *"latest"
    port:     int & >0 & <65536
    debug:    bool | *false
}
`;
    const start = Date.now();
    const tokens = cueHighlight(source);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(tokens.filter(t => t.type === "keyword").map(t => t.value)).toContain("package");
    expect(tokens.filter(t => t.type === "definition").map(t => t.value)).toContain("#Service");
    expect(tokens.filter(t => t.type === "field").map(t => t.value)).toEqual(
      expect.arrayContaining(["name", "version", "port", "debug"])
    );
  });

  it("should always make progress (no infinite loops)", () => {
    // 엣지 케이스 모음
    const edgeCases = [
      "",
      "#",
      "##",
      "#\"\"#",
      "=~\"^[a-z]+$\"",
      "_|_",
      "...",
      "<<<>>>",
      "🎉 emoji",
      "\t\n\r",
    ];

    for (const input of edgeCases) {
      const start = Date.now();
      const tokens = cueHighlight(input);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
      // 빈 입력 외에는 토큰이 있어야 함
      if (input.length > 0) {
        expect(tokens.length).toBeGreaterThan(0);
      }
    }
  });
});
