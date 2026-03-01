import {
  AIHighlight,
  CharacterCount,
  CodeBlockLowlight,
  Color,
  CustomKeymap,
  DefinitionDescription,
  DefinitionListDragGuard,
  DefinitionList,
  DefinitionTerm,
  GlobalDragHandle,
  HighlightExtension,
  HorizontalRule,
  Mathematics,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TableDragGuard,
  TextStyle,
  TiptapTable,
  TiptapTableCell,
  TiptapTableHeader,
  TiptapTableRow,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  Twitter,
  UpdatedImage,
  UploadImagesPlugin,
  Youtube,
} from "novel";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import type { CollabProvider } from "@/lib/collab/types";
import type { Doc as YDoc } from "yjs";

import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";

export type CollaborationConfig = {
  doc: YDoc;
  provider: CollabProvider;
  user: {
    color: string;
    name: string;
  };
};

//TODO I am using cx here to get tailwind autocomplete working, idk if someone else can write a regex to just capture the class key in objects
const aiHighlight = AIHighlight;
//You can overwrite the placeholder with your own configuration
const placeholder = Placeholder;
const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
    ),
  },
});

const tiptapImage = TiptapImage.extend({
  addProseMirrorPlugins() {
    return [
      UploadImagesPlugin({
        imageClass: cx("opacity-40 rounded-lg border border-stone-200"),
      }),
    ];
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx("rounded-lg border border-muted"),
  },
});

const updatedImage = UpdatedImage.configure({
  HTMLAttributes: {
    class: cx("rounded-lg border border-muted"),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx("not-prose pl-2 "),
  },
});
const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx("flex gap-2 items-start my-4"),
  },
  nested: true,
});
const definitionList = DefinitionList.configure({
  HTMLAttributes: {
    class: cx("my-4"),
  },
});
const definitionTerm = DefinitionTerm.configure({
  HTMLAttributes: {
    class: cx("mt-3 font-semibold"),
  },
});
const definitionDescription = DefinitionDescription.configure({
  HTMLAttributes: {
    class: cx("ml-5 mb-2 text-muted-foreground"),
  },
});
const table = TiptapTable.configure({
  resizable: false,
  allowTableNodeSelection: true,
  HTMLAttributes: {
    class: cx("not-prose w-full border-collapse"),
  },
});
const tableRow = TiptapTableRow;
const tableHeader = TiptapTableHeader;
const tableCell = TiptapTableCell;

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx("mt-4 mb-6 border-t border-muted-foreground"),
  },
});

const createStarterKit = (isCollaborationMode: boolean) =>
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: cx("list-disc list-outside leading-3 -mt-2"),
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: cx("list-decimal list-outside leading-3 -mt-2"),
      },
    },
    listItem: {
      HTMLAttributes: {
        class: cx("leading-normal -mb-2"),
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: cx("border-l-4 border-primary"),
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class: cx("rounded-md bg-muted text-muted-foreground border p-5 font-mono font-medium"),
      },
    },
    code: {
      HTMLAttributes: {
        class: cx("rounded-md bg-muted  px-1.5 py-1 font-mono font-medium"),
        spellcheck: "false",
      },
    },
    horizontalRule: false,
    dropcursor: {
      color: "#DBEAFE",
      width: 4,
    },
    gapcursor: false,
    history: isCollaborationMode ? false : undefined,
  });

const codeBlockLowlight = CodeBlockLowlight.configure({
  // configure lowlight: common /  all / use highlightJS in case there is a need to specify certain language grammars only
  // common: covers 37 language grammars which should be good enough in most cases
  lowlight: createLowlight(common),
});

const youtube = Youtube.configure({
  HTMLAttributes: {
    class: cx("rounded-lg border border-muted"),
  },
  inline: false,
});

const twitter = Twitter.configure({
  HTMLAttributes: {
    class: cx("not-prose"),
  },
  inline: false,
});

const mathematics = Mathematics.configure({
  HTMLAttributes: {
    class: cx("text-foreground rounded p-1 hover:bg-accent cursor-pointer"),
  },
  katexOptions: {
    throwOnError: false,
  },
});

const characterCount = CharacterCount.configure();

const markdownExtension = Markdown.configure({
  html: true,
  tightLists: true,
  tightListClass: "tight",
  bulletListMarker: "-",
  linkify: false,
  breaks: false,
  transformPastedText: false,
  transformCopiedText: false,
});

export const createExtensions = (collaboration?: CollaborationConfig) => {
  const extensions = [
    createStarterKit(Boolean(collaboration)),
    placeholder,
    tiptapLink,
    tiptapImage,
    updatedImage,
    taskList,
    taskItem,
    definitionList,
    definitionTerm,
    definitionDescription,
    table,
    tableRow,
    tableHeader,
    tableCell,
    horizontalRule,
    aiHighlight,
    codeBlockLowlight,
    youtube,
    twitter,
    mathematics,
    characterCount,
    TiptapUnderline,
    markdownExtension,
    HighlightExtension,
    TextStyle,
    Color,
    CustomKeymap,
    GlobalDragHandle,
    TableDragGuard,
    DefinitionListDragGuard,
  ];

  if (!collaboration) {
    return extensions;
  }

  return [
    ...extensions,
    Collaboration.configure({
      document: collaboration.doc,
    }),
    CollaborationCursor.configure({
      provider: collaboration.provider,
      user: collaboration.user,
    }),
  ];
};
