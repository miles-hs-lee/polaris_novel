import { Button } from "@/components/tailwind/ui/button";
import { Separator } from "@/components/tailwind/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tailwind/ui/tooltip";
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

  const renderActionGroup = (actions: TableAction[]) => (
    <div className="flex items-center gap-0.5 rounded-md border border-muted bg-muted/30 p-0.5">
      {actions.map((item) => {
        const isActive = item.isActive?.(editor) ?? false;

        return (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-label={item.label}
                  aria-pressed={item.isActive ? isActive : undefined}
                  className={cn(
                    "h-7 w-7 rounded-sm p-0 text-muted-foreground transition-colors hover:text-foreground",
                    {
                      "bg-accent text-foreground": isActive,
                      "hover:bg-destructive/10 hover:text-destructive": item.tone === "danger",
                    },
                  )}
                  disabled={!item.isEnabled(editor)}
                  onClick={() => item.command(editor)}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );

  return (
    <TooltipProvider delayDuration={100}>
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
        className="flex w-fit max-w-[95vw] items-center gap-1.5 overflow-x-auto rounded-lg border border-muted/80 bg-background/95 px-1.5 py-1 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/85"
      >
        {renderActionGroup(INSERT_ACTIONS)}
        <Separator orientation="vertical" className="h-5" />
        {renderActionGroup(STRUCTURE_ACTIONS)}
        <Separator orientation="vertical" className="h-5" />
        {renderActionGroup(DELETE_ACTIONS)}
      </EditorBubble>
    </TooltipProvider>
  );
};
