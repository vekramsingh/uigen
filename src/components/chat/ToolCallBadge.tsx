"use client";

import { Loader2, FilePlus, FilePen, FileSearch, Trash2, FolderInput, FileCode } from "lucide-react";

type StrReplaceArgs = {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
};

type FileManagerArgs = {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
};

type ToolInvocation =
  | { toolName: "str_replace_editor"; args: Partial<StrReplaceArgs>; state: "call" | "partial-call" | "result"; result?: unknown }
  | { toolName: "file_manager"; args: Partial<FileManagerArgs>; state: "call" | "partial-call" | "result"; result?: unknown };

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

function getFileName(path: string | undefined): string {
  if (!path) return "";
  return path.split("/").filter(Boolean).pop() ?? path;
}

function getLabel(tool: ToolInvocation): { icon: React.ReactNode; text: string } {
  const pending = tool.state !== "result";

  if (tool.toolName === "str_replace_editor") {
    const { command, path } = tool.args as Partial<StrReplaceArgs>;
    const name = getFileName(path);

    switch (command) {
      case "create":
        return {
          icon: <FilePlus className="w-3 h-3" />,
          text: name ? `Creating ${name}` : "Creating file",
        };
      case "str_replace":
      case "insert":
        return {
          icon: <FilePen className="w-3 h-3" />,
          text: name ? `Editing ${name}` : "Editing file",
        };
      case "view":
        return {
          icon: <FileSearch className="w-3 h-3" />,
          text: name ? `Reading ${name}` : "Reading file",
        };
      default:
        return {
          icon: <FileCode className="w-3 h-3" />,
          text: name ? `Processing ${name}` : "Processing file",
        };
    }
  }

  if (tool.toolName === "file_manager") {
    const { command, path, new_path } = tool.args as Partial<FileManagerArgs>;
    const name = getFileName(path);
    const newName = getFileName(new_path);

    switch (command) {
      case "delete":
        return {
          icon: <Trash2 className="w-3 h-3" />,
          text: name ? `Deleting ${name}` : "Deleting file",
        };
      case "rename":
        return {
          icon: <FolderInput className="w-3 h-3" />,
          text: name && newName ? `Renaming ${name} → ${newName}` : "Renaming file",
        };
      default:
        return {
          icon: <FileCode className="w-3 h-3" />,
          text: "Managing file",
        };
    }
  }

  return { icon: <FileCode className="w-3 h-3" />, text: "Processing" };
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const pending = tool.state !== "result";
  const { icon, text } = getLabel(tool);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {pending ? (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      )}
      <span className="text-neutral-600">{icon}</span>
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
