import { describe, test, expect } from "bun:test";
import {
  convertDocToLegacy,
  convertDocsToLegacy,
  convertLegacyToDoc,
  convertLegacyToDocs,
} from "./spec-converter";
import { type DocSpec } from "./spec";
import { meta as actualMeta } from "@/content/doc/_meta";
import type { DocMetaItem } from "./legacy-doc-meta";

describe("DocSpec to Legacy conversion", () => {
  test("convertDocToLegacy converts basic document", () => {
    const doc: DocSpec = {
      slug: "test",
      label: "Test Document",
    };

    const legacy = convertDocToLegacy(doc);
    expect(legacy.title).toBe("Test Document");
    expect(legacy.items).toBeUndefined();
  });

  test("convertDocToLegacy preserves hasExtractableSnippets", () => {
    const doc: DocSpec = {
      slug: "test",
      label: "Test Document",
      hasExtractableSnippets: true,
    };

    const legacy = convertDocToLegacy(doc);
    expect(legacy.hasExtractableSnippets).toBe(true);
  });

  test("convertDocToLegacy handles nested children", () => {
    const doc: DocSpec = {
      slug: "parent",
      label: "Parent",
      children: [
        {
          slug: "child1",
          label: "Child 1",
        },
        {
          slug: "child2",
          label: "Child 2",
        },
      ],
    };

    const legacy = convertDocToLegacy(doc);
    expect(legacy.title).toBe("Parent");
    expect(legacy.items).toBeDefined();
    expect(Object.keys(legacy.items!).length).toBe(2);
    expect(legacy.items!.child1.title).toBe("Child 1");
    expect(legacy.items!.child2.title).toBe("Child 2");
  });
});

describe("Legacy to DocSpec conversion", () => {
  test("convertLegacyToDoc converts basic document", () => {
    const legacyItem: DocMetaItem = {
      title: "Test Document",
    };

    const doc = convertLegacyToDoc("test", legacyItem);
    expect(doc.slug).toBe("test");
    expect(doc.label).toBe("Test Document");
  });

  test("convertLegacyToDoc preserves hasExtractableSnippets", () => {
    const legacyItem: DocMetaItem = {
      title: "Test Document",
      hasExtractableSnippets: true,
    };

    const doc = convertLegacyToDoc("test", legacyItem);
    expect(doc.hasExtractableSnippets).toBe(true);
  });

  test("convertLegacyToDoc handles nested children", () => {
    const legacyItem: DocMetaItem = {
      title: "Parent",
      items: {
        child1: {
          title: "Child 1",
        },
        child2: {
          title: "Child 2",
        },
      },
    };

    const doc = convertLegacyToDoc("parent", legacyItem);
    expect(doc.slug).toBe("parent");
    expect(doc.label).toBe("Parent");
    expect(doc.children).toBeDefined();
    expect(doc.children!.length).toBe(2);
    expect(doc.children![0].slug).toBe("child1");
    expect(doc.children![1].slug).toBe("child2");
  });
});

describe("Round trip conversion", () => {
  test("Simple round trip conversion preserves structure", () => {
    // Create a simple test document
    const originalDoc: DocSpec = {
      slug: "test",
      label: "Test Document",
      hasExtractableSnippets: true,
      children: [
        {
          slug: "child1",
          label: "Child 1",
        },
        {
          slug: "child2",
          label: "Child 2",
          hasExtractableSnippets: true,
        },
      ],
    };

    // Convert to legacy
    const legacyDoc = convertDocToLegacy(originalDoc);

    // Convert back to new format
    const roundTripDoc = convertLegacyToDoc("test", legacyDoc);

    // Verify key properties
    expect(roundTripDoc.slug).toBe(originalDoc.slug);
    expect(roundTripDoc.label).toBe(originalDoc.label);
    expect(roundTripDoc.hasExtractableSnippets).toBe(true); // We know this is true from the test data
    expect(roundTripDoc.children).toBeDefined();
    expect(roundTripDoc.children!.length).toBe(originalDoc.children!.length);

    // Check children
    expect(roundTripDoc.children![0].slug).toBe("child1");
    expect(roundTripDoc.children![0].label).toBe("Child 1");
    expect(roundTripDoc.children![1].slug).toBe("child2");
    expect(roundTripDoc.children![1].label).toBe("Child 2");
    expect(roundTripDoc.children![1].hasExtractableSnippets).toBe(true);
  });

  test("Round trip of entire structure preserves shape", () => {
    // Convert actual meta to new format
    const newDocs = convertLegacyToDocs(actualMeta);

    // Convert back to legacy format
    const roundTripDocs = convertDocsToLegacy(newDocs);

    // Check products
    expect(Object.keys(roundTripDocs).sort()).toEqual(Object.keys(actualMeta).sort());

    // Check one product in detail
    const productName = Object.keys(actualMeta)[0]; // e.g., 'mirascope'
    const originalProduct = actualMeta[productName];
    const roundTripProduct = roundTripDocs[productName];

    // Check items
    expect(Object.keys(roundTripProduct.items).sort()).toEqual(
      Object.keys(originalProduct.items).sort()
    );

    // Check sections
    expect(Object.keys(roundTripProduct.sections).sort()).toEqual(
      Object.keys(originalProduct.sections).sort()
    );

    // Check sections in detail
    for (const sectionKey of Object.keys(originalProduct.sections)) {
      const originalSection = originalProduct.sections[sectionKey];
      const roundTripSection = roundTripProduct.sections[sectionKey];

      // Check section title
      expect(roundTripSection.title).toBe(originalSection.title);

      // Check section items
      expect(Object.keys(roundTripSection.items).sort()).toEqual(
        Object.keys(originalSection.items).sort()
      );

      // Check section groups if they exist
      if (originalSection.groups) {
        expect(roundTripSection.groups).toBeDefined();
        expect(Object.keys(roundTripSection.groups!).sort()).toEqual(
          Object.keys(originalSection.groups).sort()
        );
      }
    }
  });

  test("Actual _meta.ts round trip produces JSON-equivalent structure", () => {
    // Function to strip undefined values (which don't survive JSON serialization)
    const stripUndefined = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(stripUndefined);
      }

      if (typeof obj === "object") {
        const result: any = {};

        for (const key in obj) {
          if (obj[key] !== undefined) {
            result[key] = stripUndefined(obj[key]);
          }
        }

        return result;
      }

      return obj;
    };

    // Convert actual meta to new format
    const newDocs = convertLegacyToDocs(actualMeta);

    // Convert back to legacy format
    const roundTripDocs = convertDocsToLegacy(newDocs);

    // Compare using JSON stringification to ignore reference issues
    const originalJson = JSON.stringify(stripUndefined(actualMeta), null, 2);
    const roundTripJson = JSON.stringify(stripUndefined(roundTripDocs), null, 2);

    expect(roundTripJson).toBe(originalJson);
  });
});
