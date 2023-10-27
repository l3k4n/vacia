import { vi, describe, test, beforeEach, expect } from "vitest";
import ElementLayer from "@core/elementLayer";
import { createShapeElement } from "@core/elements";
import { CanvasElement } from "@core/types";

const mockOnChange = vi.fn();

describe("ElementLayer", () => {
  let elementLayer: ElementLayer;
  let sampleElements: CanvasElement[];

  beforeEach(() => {
    mockOnChange.mockClear();
    elementLayer = new ElementLayer(mockOnChange);

    sampleElements = [
      createShapeElement({ shape: "rect", x: 20, y: 20, w: 100, h: 100 }),
      createShapeElement({ shape: "ellipse", x: 533, y: 200, w: 100, h: 100 }),
      createShapeElement({ shape: "rect", x: 220, y: 435, w: 234, h: 567 }),
    ];
  });

  test("should add an element to the elements array", () => {
    elementLayer.addCreatingElement(sampleElements[0]);
    expect(elementLayer.getAllElements()).toContain(sampleElements[0]);
    expect(elementLayer.getCreatingElement()).toBe(sampleElements[0]);
  });

  test("should remove an element from the elements array when deleted", () => {
    elementLayer.addCreatingElement(sampleElements[0]);
    elementLayer.deleteElement(sampleElements[0]);

    expect(elementLayer.getAllElements()).not.toContain(sampleElements[0]);
  });

  test("should select and unselect elements", () => {
    elementLayer.selectElements([sampleElements[1]]);
    expect(elementLayer.getSelectedElements()).toContain(sampleElements[1]);

    elementLayer.unselectElements([sampleElements[1]]);
    expect(elementLayer.getSelectedElements()).not.toContain(sampleElements[1]);

    elementLayer.selectElements([sampleElements[1], sampleElements[2]]);
    elementLayer.unselectAllElements();

    expect(elementLayer.getSelectedElements()).toEqual([]);
  });

  test("should finish creating an element", () => {
    elementLayer.addCreatingElement(sampleElements[0]);
    elementLayer.finishCreatingElement();

    expect(elementLayer.getCreatingElement()).toBeNull();
  });

  test("should mutate an element", () => {
    const mutations = { x: 10, y: 20 };
    elementLayer.mutateElement(sampleElements[0], mutations);

    expect(sampleElements[0]).toMatchObject(mutations);
  });

  test("should return correct selection onChange", () => {
    // Select elements
    elementLayer.selectElements([sampleElements[0], sampleElements[1]]);

    // Verify that the onChange callback was called with the correct selection
    expect(mockOnChange).toHaveBeenCalledWith({
      elements: elementLayer.getAllElements(),
      selectedElements: [sampleElements[0], sampleElements[1]],
    });
  });
});
