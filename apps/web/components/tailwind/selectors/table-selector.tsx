import { Button } from "@/components/tailwind/ui/button";
import { EditorBubble, useEditor } from "novel";

type TableEditor = NonNullable<ReturnType<typeof useEditor>["editor"]>;

type TableAction = {
  label: string;
  command: (editor: TableEditor) => boolean;
  isEnabled: (editor: TableEditor) => boolean;
};

const TABLE_ACTIONS: TableAction[] = [
  {
    label: "행 위 추가",
    command: (editor) => editor.chain().focus().addRowBefore().run(),
    isEnabled: (editor) => editor.can().addRowBefore(),
  },
  {
    label: "행 아래 추가",
    command: (editor) => editor.chain().focus().addRowAfter().run(),
    isEnabled: (editor) => editor.can().addRowAfter(),
  },
  {
    label: "열 왼쪽 추가",
    command: (editor) => editor.chain().focus().addColumnBefore().run(),
    isEnabled: (editor) => editor.can().addColumnBefore(),
  },
  {
    label: "열 오른쪽 추가",
    command: (editor) => editor.chain().focus().addColumnAfter().run(),
    isEnabled: (editor) => editor.can().addColumnAfter(),
  },
  {
    label: "셀 병합",
    command: (editor) => editor.chain().focus().mergeCells().run(),
    isEnabled: (editor) => editor.can().mergeCells(),
  },
  {
    label: "셀 분할",
    command: (editor) => editor.chain().focus().splitCell().run(),
    isEnabled: (editor) => editor.can().splitCell(),
  },
  {
    label: "헤더 행 토글",
    command: (editor) => editor.chain().focus().toggleHeaderRow().run(),
    isEnabled: (editor) => editor.can().toggleHeaderRow(),
  },
  {
    label: "행 삭제",
    command: (editor) => editor.chain().focus().deleteRow().run(),
    isEnabled: (editor) => editor.can().deleteRow(),
  },
  {
    label: "열 삭제",
    command: (editor) => editor.chain().focus().deleteColumn().run(),
    isEnabled: (editor) => editor.can().deleteColumn(),
  },
  {
    label: "테이블 삭제",
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
      className="flex max-w-[95vw] flex-wrap gap-1 rounded-md border border-muted bg-background p-1 shadow-xl"
    >
      {TABLE_ACTIONS.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          disabled={!item.isEnabled(editor)}
          onClick={() => item.command(editor)}
        >
          {item.label}
        </Button>
      ))}
    </EditorBubble>
  );
};
