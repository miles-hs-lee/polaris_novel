export const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Welcome to Polaris Novel" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Polaris Novel은 " },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://github.com/miles-hs-lee/polaris_novel",
                target: "_blank",
              },
            },
          ],
          text: "Polaris Novel GitHub",
        },
        { type: "text", text: "를 기반으로 유지되는 Notion 스타일 에디터입니다. " },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://tiptap.dev/",
                target: "_blank",
              },
            },
          ],
          text: "TipTap",
        },
        { type: "text", text: " 기반으로 작성되었고 Markdown import/export 및 로컬 협업을 지원합니다." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Quick Start" }],
    },
    {
      type: "orderedList",
      attrs: { tight: true, start: 1 },
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "새 문단에서 " },
                { type: "text", marks: [{ type: "code" }], text: "/" },
                { type: "text", text: " 를 입력해 Slash 메뉴를 열어보세요." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "테이블은 " },
                { type: "text", marks: [{ type: "code" }], text: "/table" },
                { type: "text", text: " 로 추가할 수 있습니다." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "우측 상단 메뉴에서 " },
                { type: "text", marks: [{ type: "code" }], text: "MD 가져오기/내보내기" },
                { type: "text", text: "를 사용할 수 있습니다." },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Definition List Example" }],
    },
    {
      type: "definitionList",
      attrs: {},
      content: [
        {
          type: "definitionTerm",
          attrs: {},
          content: [{ type: "text", text: "Definition List" }],
        },
        {
          type: "definitionDescription",
          attrs: {},
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "용어와 설명을 묶어 문서를 구조화할 수 있습니다." }],
            },
          ],
        },
        {
          type: "definitionTerm",
          attrs: {},
          content: [{ type: "text", text: "Slash Command" }],
        },
        {
          type: "definitionDescription",
          attrs: {},
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "각 블록에서 " },
                { type: "text", marks: [{ type: "code" }], text: "/" },
                { type: "text", text: " 입력으로 기능을 빠르게 호출할 수 있습니다." },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Table Example (3 x 3)" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Feature" }] }],
            },
            {
              type: "tableHeader",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Command / UI" }] }],
            },
            {
              type: "tableHeader",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Status" }] }],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Definition List" }] }],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "/definition list" }] }],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Enabled" }] }],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Table Tools" }] }],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "셀 선택 시 인라인 메뉴" }] }],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Enabled" }] }],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "테이블 셀을 선택하면 행/열 추가, 셀 병합/분할, 헤더 토글, 삭제 도구를 사용할 수 있습니다.",
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Polaris Links" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "프로젝트 저장소: " },
                {
                  type: "text",
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: "https://github.com/miles-hs-lee/polaris_novel",
                        target: "_blank",
                      },
                    },
                  ],
                  text: "github.com/miles-hs-lee/polaris_novel",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "로컬 실행 가이드: " },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "README.md",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
