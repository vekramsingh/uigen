import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => cleanup());

function makeStrReplace(command: string, path: string, state: "call" | "result" = "result") {
  return { toolName: "str_replace_editor" as const, args: { command, path }, state };
}

function makeFileManager(command: string, path: string, new_path?: string, state: "call" | "result" = "result") {
  return { toolName: "file_manager" as const, args: { command, path, new_path }, state };
}

// str_replace_editor — labels

test("shows 'Creating <filename>' for create command", () => {
  render(<ToolCallBadge tool={makeStrReplace("create", "/src/App.jsx")} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace command", () => {
  render(<ToolCallBadge tool={makeStrReplace("str_replace", "/src/components/Button.tsx")} />);
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for insert command", () => {
  render(<ToolCallBadge tool={makeStrReplace("insert", "/src/index.ts")} />);
  expect(screen.getByText("Editing index.ts")).toBeDefined();
});

test("shows 'Reading <filename>' for view command", () => {
  render(<ToolCallBadge tool={makeStrReplace("view", "/src/App.jsx")} />);
  expect(screen.getByText("Reading App.jsx")).toBeDefined();
});

test("shows fallback label when path is missing", () => {
  render(<ToolCallBadge tool={{ toolName: "str_replace_editor", args: { command: "create" }, state: "result" }} />);
  expect(screen.getByText("Creating file")).toBeDefined();
});

// file_manager — labels

test("shows 'Deleting <filename>' for delete command", () => {
  render(<ToolCallBadge tool={makeFileManager("delete", "/src/old.tsx")} />);
  expect(screen.getByText("Deleting old.tsx")).toBeDefined();
});

test("shows 'Renaming <from> → <to>' for rename command", () => {
  render(<ToolCallBadge tool={makeFileManager("rename", "/src/Foo.tsx", "/src/Bar.tsx")} />);
  expect(screen.getByText("Renaming Foo.tsx → Bar.tsx")).toBeDefined();
});

// pending vs done state

test("shows spinner when state is 'call'", () => {
  const { container } = render(<ToolCallBadge tool={makeStrReplace("create", "/src/App.jsx", "call")} />);
  expect(container.querySelector(".animate-spin")).toBeTruthy();
});

test("shows green dot when state is 'result'", () => {
  const { container } = render(<ToolCallBadge tool={makeStrReplace("create", "/src/App.jsx", "result")} />);
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
