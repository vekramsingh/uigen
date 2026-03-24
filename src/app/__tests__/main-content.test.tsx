import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn(),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn(),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div>Header Actions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

test("shows preview by default", async () => {
  render(<MainContent />);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("switches to code view when Code button is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("button", { name: "Code" }));

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("switches back to preview when Preview button is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("button", { name: "Code" }));
  expect(screen.queryByTestId("preview-frame")).toBeNull();

  await user.click(screen.getByRole("button", { name: "Preview" }));

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("toggle buttons are always visible regardless of active view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  expect(screen.getByRole("button", { name: "Preview" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Code" })).toBeDefined();

  await user.click(screen.getByRole("button", { name: "Code" }));

  expect(screen.getByRole("button", { name: "Preview" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Code" })).toBeDefined();
});
