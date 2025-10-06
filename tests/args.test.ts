/**
 * Tests for command line argument parsing
 */

import { describe, expect, test } from "bun:test";
import { parseArgs } from "../src/cli/args";

describe("parseArgs", () => {
  test("should parse query argument", () => {
    const args = ["--query", "SELECT * FROM users"];
    expect(parseArgs(args)).toEqual({
      "--query": "SELECT * FROM users",
    });
  });

  test("should parse query argument with short option", () => {
    const args = ["-q", "SELECT * FROM users"];
    expect(parseArgs(args)).toEqual({
      "--query": "SELECT * FROM users",
    });
  });

  test("should parse file argument", () => {
    const args = ["--file", "query.sql"];
    expect(parseArgs(args)).toEqual({
      "--file": "query.sql",
    });
  });

  test("should parse file argument with short option", () => {
    const args = ["-f", "query.sql"];
    expect(parseArgs(args)).toEqual({
      "--file": "query.sql",
    });
  });

  test("should parse data-plane-id argument", () => {
    const args = ["--data-plane-id", "123"];
    expect(parseArgs(args)).toEqual({
      "--data-plane-id": "123",
    });
  });

  test("should parse data-plane-id argument with short option", () => {
    const args = ["-d", "123"];
    expect(parseArgs(args)).toEqual({
      "--data-plane-id": "123",
    });
  });

  test("should parse limit argument", () => {
    const args = ["--limit", "100"];
    expect(parseArgs(args)).toEqual({
      "--limit": "100",
    });
  });

  test("should parse limit argument with short option", () => {
    const args = ["-l", "100"];
    expect(parseArgs(args)).toEqual({
      "--limit": "100",
    });
  });

  test("should parse no-poll flag", () => {
    const args = ["--no-poll"];
    expect(parseArgs(args)).toEqual({
      "--no-poll": true,
    });
  });

  test("should parse poll-interval argument", () => {
    const args = ["--poll-interval", "5"];
    expect(parseArgs(args)).toEqual({
      "--poll-interval": "5",
    });
  });

  test("should parse poll-interval argument with short option", () => {
    const args = ["-p", "5"];
    expect(parseArgs(args)).toEqual({
      "--poll-interval": "5",
    });
  });

  test("should parse list-datasets flag", () => {
    const args = ["--list-datasets"];
    expect(parseArgs(args)).toEqual({
      "--list-datasets": true,
    });
  });

  test("should parse list-datasets flag with short option", () => {
    const args = ["--ld"];
    expect(parseArgs(args)).toEqual({
      "--list-datasets": true,
    });
  });

  test("should parse delete-dataset argument", () => {
    const args = ["--delete-dataset", "123"];
    expect(parseArgs(args)).toEqual({
      "--delete-dataset": "123",
    });
  });

  test("should parse delete-dataset argument with short option", () => {
    const args = ["--dd", "123"];
    expect(parseArgs(args)).toEqual({
      "--delete-dataset": "123",
    });
  });

  test("should parse log flag", () => {
    const args = ["--log"];
    expect(parseArgs(args)).toEqual({
      "--log": true,
    });
  });

  test("should parse show-log flag", () => {
    const args = ["--show-log"];
    expect(parseArgs(args)).toEqual({
      "--show-log": true,
    });
  });

  test("should parse rollback argument", () => {
    const args = ["--rollback", "timestamp"];
    expect(parseArgs(args)).toEqual({
      "--rollback": "timestamp",
    });
  });

  test("should parse help flag", () => {
    const args = ["--help"];
    expect(parseArgs(args)).toEqual({
      "--help": true,
    });
  });

  test("should parse help flag with short option", () => {
    const args = ["-h"];
    expect(parseArgs(args)).toEqual({
      "--help": true,
    });
  });

  test("should parse multiple arguments", () => {
    const args = [
      "--query",
      "SELECT * FROM users",
      "--data-plane-id",
      "123",
      "--limit",
      "100",
      "--no-poll",
      "--log",
    ];
    expect(parseArgs(args)).toEqual({
      "--query": "SELECT * FROM users",
      "--data-plane-id": "123",
      "--limit": "100",
      "--no-poll": true,
      "--log": true,
    });
  });

  test("should ignore invalid arguments", () => {
    const args = ["--invalid", "value", "--query", "SELECT * FROM users"];
    expect(parseArgs(args)).toEqual({
      "--query": "SELECT * FROM users",
    });
  });
});
