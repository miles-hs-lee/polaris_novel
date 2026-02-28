"use client";
import { defaultEditorContent } from "@/lib/content";
import { LocalBroadcastProvider } from "@/lib/collab/local-provider";
import { getLocalCollabUser } from "@/lib/collab/user";
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  ImageResizer,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import * as Y from "yjs";
import { createExtensions } from "./extensions";
import { ColorSelector } from "./selectors/color-selector";
import { LinkSelector } from "./selectors/link-selector";
import { MathSelector } from "./selectors/math-selector";
import { NodeSelector } from "./selectors/node-selector";
import { TableSelector } from "./selectors/table-selector";
import { Separator } from "./ui/separator";
import Menu from "./ui/menu";

import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";

const hljs = require("highlight.js");

type TailwindAdvancedEditorProps = {
  docId: string;
};

const TailwindAdvancedEditor = ({ docId }: TailwindAdvancedEditorProps) => {
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [syncStatus, setSyncStatus] = useState<"connecting" | "disconnected" | "synced">("connecting");
  const [charsCount, setCharsCount] = useState<number>();

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  const bootstrapTimerRef = useRef<number | null>(null);
  const [collab, setCollab] = useState<{
    doc: Y.Doc;
    provider: LocalBroadcastProvider;
  } | null>(null);

  const collabUser = useMemo(() => getLocalCollabUser(), []);
  const extensions = useMemo(() => {
    if (!collab) return null;

    return [
      ...createExtensions({
        doc: collab.doc,
        provider: collab.provider,
        user: collabUser,
      }),
      slashCommand,
    ];
  }, [collab, collabUser]);

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());
    window.localStorage.setItem("html-content", highlightCodeblocks(editor.getHTML()));
    window.localStorage.setItem("novel-content", JSON.stringify(json));
    window.localStorage.setItem("markdown", editor.storage.markdown.getMarkdown());
    setSaveStatus("Saved");
  }, 500);

  useEffect(() => {
    setSyncStatus("connecting");
    setCollab(null);

    const doc = new Y.Doc();
    const provider = new LocalBroadcastProvider({ doc, docId });

    setCollab({ doc, provider });

    const handleStatus = ({ status }: { status: "connected" | "disconnected" }) => {
      setSyncStatus(status === "connected" ? "connecting" : "disconnected");
    };
    const handleSynced = () => {
      setSyncStatus("synced");
    };

    provider.on("status", handleStatus);
    provider.on("synced", handleSynced);

    if (provider.restoredFromSnapshot) {
      setSyncStatus("synced");
    }

    return () => {
      provider.off("status", handleStatus);
      provider.off("synced", handleSynced);

      if (bootstrapTimerRef.current) {
        window.clearTimeout(bootstrapTimerRef.current);
        bootstrapTimerRef.current = null;
      }

      provider.destroy();
      doc.destroy();
      setCollab((current) => (current?.provider === provider ? null : current));
    };
  }, [docId]);

  const syncBadgeLabel =
    syncStatus === "synced" ? "Synced" : syncStatus === "connecting" ? "Connecting..." : "Disconnected";

  if (!collab || !extensions) return null;

  return (
    <div className="relative w-full max-w-screen-lg">
      <EditorRoot>
        <EditorContent
          extensions={extensions}
          className="relative min-h-[500px] w-full max-w-screen-lg border-muted bg-background sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
            },
          }}
          onCreate={({ editor }) => {
            setCharsCount(editor.storage.characterCount.words());

            if (bootstrapTimerRef.current) {
              window.clearTimeout(bootstrapTimerRef.current);
            }

            bootstrapTimerRef.current = window.setTimeout(() => {
              if (collab.provider.restoredFromSnapshot) return;
              if (collab.provider.hasRemoteUpdates()) return;
              if (collab.provider.getPeerCount() > 0) return;

              if (editor.isEmpty) {
                editor.commands.setContent(defaultEditorContent);
              }
            }, 400);
          }}
          onUpdate={({ editor }) => {
            debouncedUpdates(editor);
            setSaveStatus("Unsaved");
          }}
          slotAfter={<ImageResizer />}
        >
          <div className="flex absolute right-5 top-5 z-10 mb-5 items-center gap-2">
            <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">{syncBadgeLabel}</div>
            <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">{saveStatus}</div>
            <div className={charsCount ? "rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground" : "hidden"}>
              {charsCount} Words
            </div>
            <Menu />
          </div>
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />

            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <MathSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch>
          <TableSelector />
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

export default TailwindAdvancedEditor;
