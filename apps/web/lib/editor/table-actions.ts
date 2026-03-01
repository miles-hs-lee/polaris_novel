export type TableActionKey =
  | "addRowBefore"
  | "addRowAfter"
  | "addColumnBefore"
  | "addColumnAfter"
  | "mergeCells"
  | "splitCell"
  | "toggleHeaderRow"
  | "deleteRow"
  | "deleteColumn"
  | "deleteTable";

export type TableEditorLike = {
  isEditable: boolean;
  isActive: (name: string) => boolean;
  chain: () => {
    focus: () => {
      addRowBefore: () => { run: () => boolean };
      addRowAfter: () => { run: () => boolean };
      addColumnBefore: () => { run: () => boolean };
      addColumnAfter: () => { run: () => boolean };
      mergeCells: () => { run: () => boolean };
      splitCell: () => { run: () => boolean };
      toggleHeaderRow: () => { run: () => boolean };
      deleteRow: () => { run: () => boolean };
      deleteColumn: () => { run: () => boolean };
      deleteTable: () => { run: () => boolean };
    };
  };
  can: () => {
    addRowBefore: () => boolean;
    addRowAfter: () => boolean;
    addColumnBefore: () => boolean;
    addColumnAfter: () => boolean;
    mergeCells: () => boolean;
    splitCell: () => boolean;
    toggleHeaderRow: () => boolean;
    deleteRow: () => boolean;
    deleteColumn: () => boolean;
    deleteTable: () => boolean;
  };
};

export const shouldShowTableBubble = (editor: Pick<TableEditorLike, "isEditable" | "isActive">) => {
  if (!editor.isEditable) return false;
  return editor.isActive("table") || editor.isActive("tableCell") || editor.isActive("tableHeader");
};

export const isTableHeaderActive = (editor: Pick<TableEditorLike, "isActive">) => {
  return editor.isActive("tableHeader");
};

export const canRunTableAction = (editor: Pick<TableEditorLike, "can">, action: TableActionKey) => {
  const abilities = editor.can();

  switch (action) {
    case "addRowBefore":
      return abilities.addRowBefore();
    case "addRowAfter":
      return abilities.addRowAfter();
    case "addColumnBefore":
      return abilities.addColumnBefore();
    case "addColumnAfter":
      return abilities.addColumnAfter();
    case "mergeCells":
      return abilities.mergeCells();
    case "splitCell":
      return abilities.splitCell();
    case "toggleHeaderRow":
      return abilities.toggleHeaderRow();
    case "deleteRow":
      return abilities.deleteRow();
    case "deleteColumn":
      return abilities.deleteColumn();
    case "deleteTable":
      return abilities.deleteTable();
  }
};

export const runTableAction = (editor: Pick<TableEditorLike, "chain">, action: TableActionKey) => {
  const chain = editor.chain().focus();

  switch (action) {
    case "addRowBefore":
      return chain.addRowBefore().run();
    case "addRowAfter":
      return chain.addRowAfter().run();
    case "addColumnBefore":
      return chain.addColumnBefore().run();
    case "addColumnAfter":
      return chain.addColumnAfter().run();
    case "mergeCells":
      return chain.mergeCells().run();
    case "splitCell":
      return chain.splitCell().run();
    case "toggleHeaderRow":
      return chain.toggleHeaderRow().run();
    case "deleteRow":
      return chain.deleteRow().run();
    case "deleteColumn":
      return chain.deleteColumn().run();
    case "deleteTable":
      return chain.deleteTable().run();
  }
};
