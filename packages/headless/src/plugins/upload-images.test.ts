import { describe, expect, it, vi } from "vitest";
import { createImageUpload, handleImageDrop, handleImagePaste } from "./upload-images";

type UploadView = Parameters<typeof handleImagePaste>[0];

const createViewStub = (options?: { selectionFrom?: number; dropPos?: number }) => {
  const tr = {
    selection: {
      empty: true,
    },
    deleteSelection: vi.fn(() => tr),
    setMeta: vi.fn(() => tr),
    replaceWith: vi.fn(() => tr),
    delete: vi.fn(() => tr),
  };

  return {
    state: {
      selection: {
        from: options?.selectionFrom ?? 5,
      },
      tr,
      schema: {
        nodes: {
          image: {
            create: vi.fn(() => ({ type: "image" })),
          },
        },
      },
    },
    posAtCoords: vi.fn(() => ({ pos: options?.dropPos ?? 11 })),
    dispatch: vi.fn(),
  } as unknown as UploadView;
};

describe("upload-images helpers", () => {
  it("passes pasted image file to upload function", () => {
    const file = new File(["image"], "paste.png", { type: "image/png" });
    const uploadFn = vi.fn();
    const preventDefault = vi.fn();
    const view = createViewStub({ selectionFrom: 9 });

    const handled = handleImagePaste(
      view,
      {
        clipboardData: { files: [file] },
        preventDefault,
      } as unknown as ClipboardEvent,
      uploadFn,
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(uploadFn).toHaveBeenCalledWith(file, view, 9);
  });

  it("ignores paste event when no files are present", () => {
    const uploadFn = vi.fn();
    const preventDefault = vi.fn();
    const view = createViewStub();

    const handled = handleImagePaste(
      view,
      {
        clipboardData: { files: [] },
        preventDefault,
      } as unknown as ClipboardEvent,
      uploadFn,
    );

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(uploadFn).not.toHaveBeenCalled();
  });

  it("passes dropped image file to upload function with position", () => {
    const file = new File(["image"], "drop.png", { type: "image/png" });
    const uploadFn = vi.fn();
    const preventDefault = vi.fn();
    const view = createViewStub({ dropPos: 18 });

    const handled = handleImageDrop(
      view,
      {
        clientX: 10,
        clientY: 20,
        dataTransfer: { files: [file] },
        preventDefault,
      } as unknown as DragEvent,
      false,
      uploadFn,
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(view.posAtCoords).toHaveBeenCalledWith({ left: 10, top: 20 });
    expect(uploadFn).toHaveBeenCalledWith(file, view, 18);
  });

  it("ignores drop when editor reports moved slice", () => {
    const file = new File(["image"], "drop.png", { type: "image/png" });
    const uploadFn = vi.fn();
    const preventDefault = vi.fn();
    const view = createViewStub();

    const handled = handleImageDrop(
      view,
      {
        clientX: 1,
        clientY: 2,
        dataTransfer: { files: [file] },
        preventDefault,
      } as unknown as DragEvent,
      true,
      uploadFn,
    );

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(uploadFn).not.toHaveBeenCalled();
  });

  it("skips upload when validate function rejects file", () => {
    const file = new File(["image"], "invalid.png", { type: "image/png" });
    const view = createViewStub();
    const validateFn = vi.fn(() => false);
    const onUpload = vi.fn(() => Promise.resolve("https://example.com/image.png"));
    const uploadFn = createImageUpload({ validateFn, onUpload });

    uploadFn(file, view, 3);

    expect(validateFn).toHaveBeenCalledWith(file);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("calls upload handler when file is valid", () => {
    const file = new File(["image"], "valid.png", { type: "image/png" });
    const view = createViewStub();
    const validateFn = vi.fn(() => true);
    const onUpload = vi.fn(() => new Promise(() => {}));
    const uploadFn = createImageUpload({ validateFn, onUpload });

    uploadFn(file, view, 3);

    expect(validateFn).toHaveBeenCalledWith(file);
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});
