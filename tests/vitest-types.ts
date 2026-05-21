import type { ExpectStatic, MockInstance, Mock } from "vitest";
import type { Env } from "../src/types/env";
import type {
  ClassificationType,
  ParseResponse,
  PredictedLabel,
  FeedbackData,
  MetricsData,
  PRData,
  PayloadMeta,
} from "../src/types/basic";

// Type aliases for commonly used types
export type TestEnv = Env;
export type MockFn = Mock;
export type MockedFn<T extends (...args: any[]) => any> = MockInstance<T>;
export type Expect = ExpectStatic;

// Helper type for mocked responses
export type MockResponse<T> = {
  [K in keyof T]: T[K];
};

// Helper type for test data
export type TestClassificationResult = ClassificationType;
export type TestParseResult = ParseResponse;
export type TestPredictedLabel = PredictedLabel;
export type TestFeedbackData = FeedbackData;
export type TestMetricsData = MetricsData;
export type TestPRData = PRData;
export type TestPayloadMeta = PayloadMeta;

// Mock request/response types
export type MockRequestInit = RequestInit & {
  env?: TestEnv;
};

// JSON response type
export type JsonResponseBody = Record<string, unknown>;
