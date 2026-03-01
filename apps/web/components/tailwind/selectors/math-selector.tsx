import { Button } from "@/components/tailwind/ui/button";
import { toggleMathSelection } from "@/lib/editor/math-toggle";
import { cn } from "@/lib/utils";
import { SigmaIcon } from "lucide-react";
import { useEditor } from "novel";

export const MathSelector = () => {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-none w-12"
      onClick={() => {
        toggleMathSelection(editor);
      }}
    >
      <SigmaIcon
        className={cn("size-4", { "text-blue-500": editor.isActive("math") })}
        strokeWidth={2.3}
      />
    </Button>
  );
};
