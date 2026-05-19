import { describe, expect, it } from "vitest";
import { createErrorResponse, createSuccessResponse } from "../src/utils";

describe("Utils", () => {
  describe("createErrorResponse", () => {
    it("should create error response with Error instance", () => {
      const error = new Error("Test error");
      const response = createErrorResponse(error, 400);

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create error response with string error", () => {
      const error = "Test error string";
      const response = createErrorResponse(error, 500);

      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create error response with default status", () => {
      const error = new Error("Test error");
      const response = createErrorResponse(error);

      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("createSuccessResponse", () => {
    it("should create success response with data", () => {
      const data = { message: "Success", value: 42 };
      const response = createSuccessResponse(data, 201);

      expect(response.status).toBe(201);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create success response with default status", () => {
      const data = { message: "Success" };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create success response with null data", () => {
      const response = createSuccessResponse(null, 200);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
