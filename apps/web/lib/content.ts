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
        { type: "text", text: "를 기반으로 유지되는 협업 에디터입니다. 아래 문서에서 주요 기능을 바로 체험해보세요." },
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
                { type: "text", text: " 를 입력해 Slash 메뉴를 여세요." },
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
                { type: "text", text: ", 정의목록은 " },
                { type: "text", marks: [{ type: "code" }], text: "/definition list" },
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
                { type: "text", text: "코드 블록은 " },
                { type: "text", marks: [{ type: "code" }], text: "/code" },
                { type: "text", text: ", 이미지 업로드는 " },
                { type: "text", marks: [{ type: "code" }], text: "/image" },
                { type: "text", text: " 를 사용하세요." },
              ],
            },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Feature Tour" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "아래 샘플 블록은 Polaris Novel에서 기본 제공되는 주요 기능들입니다." }],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Code Block" }],
    },
    {
      type: "codeBlock",
      attrs: { language: "ts" },
      content: [
        {
          type: "text",
          text: "const features = [\"table\", \"math\", \"twitter\", \"youtube\"];\nconst enabled = features.every(Boolean);\nconsole.log(`Polaris ready: ${enabled}`);",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Image" }],
    },
    {
      type: "image",
      attrs: {
        src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
        alt: "Sample landscape",
        title: "Polaris Sample Image",
      },
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "이미지는 /image로 업로드하거나 붙여넣기로 추가할 수 있습니다." }],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Math" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "인라인 수식 예시: " },
        { type: "math", attrs: { latex: "E = mc^2" } },
        { type: "text", text: " 와 " },
        { type: "math", attrs: { latex: "e^{i\\pi} + 1 = 0" } },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "math", attrs: { latex: "\\int_0^1 x^2\\,dx = \\frac{1}{3}" } }],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Embeds (YouTube / Twitter)" }],
    },
    {
      type: "youtube",
      attrs: {
        src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    },
    {
      type: "twitter",
      attrs: {
        src: "https://x.com/seanpk/status/1800145949580517852",
      },
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "네트워크/쿠키 정책에 따라 임베드 로딩이 지연되거나 제한될 수 있습니다." }],
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
              content: [{ type: "text", text: "용어(DD/DT)를 묶어 문서 구조를 명확하게 정리할 수 있습니다." }],
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
                { type: "text", text: "블록 시작 지점에서 " },
                { type: "text", marks: [{ type: "code" }], text: "/" },
                { type: "text", text: " 입력으로 대부분의 블록을 빠르게 생성할 수 있습니다." },
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
              content: [{ type: "paragraph", content: [{ type: "text", text: "How to Use" }] }],
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
              content: [{ type: "paragraph", content: [{ type: "text", text: "Table Inline Menu" }] }],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "셀 선택 후 아이콘 메뉴 사용" }] }],
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
              content: [{ type: "paragraph", content: [{ type: "text", text: "Embeds" }] }],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: [{ type: "text", text: "/youtube, /twitter" }] }],
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
      content: [{ type: "text", text: "테이블 셀을 선택하면 행/열 추가, 셀 병합/분할, 헤더 토글, 삭제 도구를 사용할 수 있습니다." }],
    },
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Polaris Links & Checklist" }],
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
                { type: "text", text: "프로젝트 저장소 확인: " },
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
                { type: "text", text: "로컬 실행 가이드 확인: " },
                { type: "text", marks: [{ type: "code" }], text: "README.md" },
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
              content: [{ type: "text", text: "이 문서에서 각 블록을 직접 수정/삭제/추가해 편집 흐름을 테스트해보세요." }],
            },
          ],
        },
      ],
    },
  ],
};
