import { Button } from "@/components/tailwind/ui/button";
import { Separator } from "@/components/tailwind/ui/separator";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Heading,
  TableCellsMerge,
  TableCellsSplit,
  TableColumnsSplit,
  TableRowsSplit,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { EditorBubble, useEditor } from "novel";

type TableEditor = NonNullable<ReturnType<typeof useEditor>["editor"]>;

type TableAction = {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
  isActive?: (editor: TableEditor) => boolean;
  command: (editor: TableEditor) => boolean;
  isEnabled: (editor: TableEditor) => boolean;
};

const INSERT_ACTIONS: TableAction[] = [
  {
    label: "행 위 추가",
    icon: ArrowUpToLine,
    command: (editor) => editor.chain().focus().addRowBefore().run(),
    isEnabled: (editor) => editor.can().addRowBefore(),
  },
  {
    label: "행 아래 추가",
    icon: ArrowDownToLine,
    command: (editor) => editor.chain().focus().addRowAfter().run(),
    isEnabled: (editor) => editor.can().addRowAfter(),
  },
  {
    label: "열 왼쪽 추가",
    icon: ArrowLeftToLine,
    command: (editor) => editor.chain().focus().addColumnBefore().run(),
    isEnabled: (editor) => editor.can().addColumnBefore(),
  },
  {
    label: "열 오른쪽 추가",
    icon: ArrowRightToLine,
    command: (editor) => editor.chain().focus().addColumnAfter().run(),
    isEnabled: (editor) => editor.can().addColumnAfter(),
  },
];

const STRUCTURE_ACTIONS: TableAction[] = [
  {
    label: "셀 병합",
    icon: TableCellsMerge,
    command: (editor) => editor.chain().focus().mergeCells().run(),
    isEnabled: (editor) => editor.can().mergeCells(),
  },
  {
    label: "셀 분할",
    icon: TableCellsSplit,
    command: (editor) => editor.chain().focus().splitCell().run(),
    isEnabled: (editor) => editor.can().splitCell(),
  },
  {
    label: "헤더 행 토글",
    icon: Heading,
    isActive: (editor) => editor.isActive("tableHeader"),
    command: (editor) => editor.chain().focus().toggleHeaderRow().run(),
    isEnabled: (editor) => editor.can().toggleHeaderRow(),
  },
];

const DELETE_ACTIONS: TableAction[] = [
  {
    label: "행 삭제",
    icon: TableRowsSplit,
    tone: "danger",
    command: (editor) => editor.chain().focus().deleteRow().run(),
    isEnabled: (editor) => editor.can().deleteRow(),
  },
  {
    label: "열 삭제",
    icon: TableColumnsSplit,
    tone: "danger",
    command: (editor) => editor.chain().focus().deleteColumn().run(),
    isEnabled: (editor) => editor.can().deleteColumn(),
  },
  {
    label: "테이블 삭제",
    icon: Trash2,
    tone: "danger",
    command: (editor) => editor.chain().focus().deleteTable().run(),
    isEnabled: (editor) => editor.can().deleteTable(),
  },
];

export const TableSelector = () => {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <EditorBubble
      shouldShow={({ editor: currentEditor }) => {
        if (!currentEditor.isEditable) return false;
        return (
          currentEditor.isActive("table") ||
          currentEditor.isActive("tableCell") ||
          currentEditor.isActive("tableHeader")
        );
      }}
      tippyOptions={{ placement: "top-start" }}
      className="flex w-fit max-w-[95vw] items-center gap-1 overflow-x-auto rounded-md border border-muted bg-background p-1 shadow-xl"
    >
      {INSERT_ACTIONS.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          type="button"
          title={item.label}
          aria-label={item.label}
          className={cn("h-8 w-8 rounded-none p-0")}
          disabled={!item.isEnabled(editor)}
          onClick={() => item.command(editor)}
        >
          <item.icon className="h-4 w-4" />
        </Button>
      ))}
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      {STRUCTURE_ACTIONS.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          type="button"
          title={item.label}
          aria-label={item.label}
          className={cn("h-8 w-8 rounded-none p-0", {
            "text-blue-500": item.isActive?.(editor),
          })}
          disabled={!item.isEnabled(editor)}
          onClick={() => item.command(editor)}
        >
          <item.icon className="h-4 w-4" />
        </Button>
      ))}
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      {DELETE_ACTIONS.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          type="button"
          title={item.label}
          aria-label={item.label}
          className={cn("h-8 w-8 rounded-none p-0", {
            "text-destructive hover:text-destructive": item.tone === "danger",
          })}
          disabled={!item.isEnabled(editor)}
          onClick={() => item.command(editor)}
        >
          <item.icon className="h-4 w-4" />
        </Button>
      ))}
    </EditorBubble>
  );
};
