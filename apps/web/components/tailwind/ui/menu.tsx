"use client";

import {
  applyAppearanceTheme,
  createNewDocument,
  exportJsonDocument,
  exportMarkdownDocument,
  loadFeatureDocument,
} from "@/lib/editor/menu-actions";
import { useEffect, useState } from "react";
import { BookOpen, Check, Download, FileJson, FilePlus, FileUp, Menu as MenuIcon, Monitor, Moon, SunDim } from "lucide-react";
import { useTheme } from "next-themes";
import { useEditor } from "novel";
import { toast } from "sonner";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// TODO implement multiple fonts editor
// const fonts = [
//   {
//     font: "Default",
//     icon: <FontDefault className="h-4 w-4" />,
//   },
//   {
//     font: "Serif",
//     icon: <FontSerif className="h-4 w-4" />,
//   },
//   {
//     font: "Mono",
//     icon: <FontMono className="h-4 w-4" />,
//   },
// ];
const appearances = [
  {
    theme: "System",
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    theme: "Light",
    icon: <SunDim className="h-4 w-4" />,
  },
  {
    theme: "Dark",
    icon: <Moon className="h-4 w-4" />,
  },
];

export default function Menu() {
  // const { font: currentFont, setFont } = useContext(AppContext);
  const [mounted, setMounted] = useState(false);
  const { theme: currentTheme, setTheme } = useTheme();
  const { editor } = useEditor();
  const disabled = !editor;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImportMarkdown = () => {
    if (!editor) {
      toast.error("에디터가 아직 준비되지 않았습니다.");
      return;
    }

    const confirmed = window.confirm("현재 내용을 Markdown 파일 내용으로 바꿀까요?");
    if (!confirmed) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;
        const markdown = await file.text();
        editor.commands.setContent(markdown, true);
        editor.commands.focus("start");
        toast.success("Markdown 파일을 불러왔습니다.");
      } catch {
        toast.error("Markdown 파일을 불러오지 못했습니다.");
      }
    };
    input.click();
  };

  const handleCreateNewDocument = () => {
    if (!editor) {
      toast.error("에디터가 아직 준비되지 않았습니다.");
      return;
    }

    const confirmed = window.confirm("현재 문서를 지우고 새 문서를 만들까요?");
    if (!confirmed) return;

    try {
      createNewDocument(editor);
      toast.success("새 문서를 만들었습니다.");
    } catch {
      toast.error("새 문서를 만들지 못했습니다.");
    }
  };

  const handleLoadFeatureDocument = () => {
    if (!editor) {
      toast.error("에디터가 아직 준비되지 않았습니다.");
      return;
    }

    const confirmed = window.confirm("현재 문서를 기능 소개 문서로 바꿀까요?");
    if (!confirmed) return;

    try {
      loadFeatureDocument(editor);
      toast.success("기능 소개 문서를 불러왔습니다.");
    } catch {
      toast.error("기능 소개 문서를 불러오지 못했습니다.");
    }
  };

  const handleExportMarkdown = () => {
    if (!editor) {
      toast.error("에디터가 아직 준비되지 않았습니다.");
      return;
    }

    exportMarkdownDocument(editor);
    toast.success("Markdown 파일을 내보냈습니다.");
  };

  const handleExportJson = () => {
    if (!editor) {
      toast.error("에디터가 아직 준비되지 않았습니다.");
      return;
    }

    exportJsonDocument(editor);
    toast.success("JSON 파일을 내보냈습니다.");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon width={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        {/* <div className="p-2">
          <p className="p-2 text-xs font-medium text-stone-500">Font</p>
          {fonts.map(({ font, icon }) => (
            <button
              key={font}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
              onClick={() => {
                setFont(font);
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="rounded-sm border border-stone-200 p-1">
                  {icon}
                </div>
                <span>{font}</span>
              </div>
              {currentFont === font && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div> */}
        <p className="p-2 text-xs font-medium text-muted-foreground">Document</p>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
          onClick={handleCreateNewDocument}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <div className="rounded-sm border p-1">
              <FilePlus className="h-4 w-4" />
            </div>
            <span>새 문서</span>
          </div>
        </Button>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
          onClick={handleLoadFeatureDocument}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <div className="rounded-sm border p-1">
              <BookOpen className="h-4 w-4" />
            </div>
            <span>기능 소개</span>
          </div>
        </Button>

        <div className="my-1 h-px bg-border" />
        <p className="p-2 text-xs font-medium text-muted-foreground">Import / Export</p>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
          onClick={handleImportMarkdown}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <div className="rounded-sm border p-1">
              <FileUp className="h-4 w-4" />
            </div>
            <span>MD 가져오기</span>
          </div>
        </Button>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
          onClick={handleExportMarkdown}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <div className="rounded-sm border p-1">
              <Download className="h-4 w-4" />
            </div>
            <span>MD 내보내기</span>
          </div>
        </Button>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
          onClick={handleExportJson}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <div className="rounded-sm border p-1">
              <FileJson className="h-4 w-4" />
            </div>
            <span>JSON 내보내기</span>
          </div>
        </Button>

        <div className="my-1 h-px bg-border" />
        <p className="p-2 text-xs font-medium text-muted-foreground">Appearance</p>
        {appearances.map(({ theme, icon }) => (
          <Button
            variant="ghost"
            key={theme}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
            onClick={() => {
              applyAppearanceTheme(setTheme, theme);
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-sm border  p-1">{icon}</div>
              <span>{theme}</span>
            </div>
            {mounted && currentTheme === theme.toLowerCase() && <Check className="h-4 w-4" />}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
