/**
 * Tests for SQL utility functions
 */

import { describe, expect, test } from "bun:test";
import { extractViewName, stripSqlComments } from "../src/utils/sql";

describe("stripSqlComments", () => {
  test("should return empty string when input is empty", () => {
    expect(stripSqlComments("")).toBe("");
  });

  test("should return original string when no comments", () => {
    const sql = "SELECT * FROM users WHERE id = 1";
    expect(stripSqlComments(sql)).toBe(sql);
  });

  test("should remove single-line comments", () => {
    const sql = "SELECT * FROM users -- Get all users\nWHERE id = 1";
    expect(stripSqlComments(sql)).toBe("SELECT * FROM users \nWHERE id = 1");
  });

  test("should remove multi-line comments", () => {
    const sql = "SELECT * FROM users /* Get all\nactive users */ WHERE active = 1";
    expect(stripSqlComments(sql)).toBe("SELECT * FROM users \n WHERE active = 1");
  });

  test("should preserve newlines in multi-line comments", () => {
    const sql = "SELECT *\n/* Line 1\nLine 2\nLine 3 */\nFROM users";
    expect(stripSqlComments(sql)).toBe("SELECT *\n\n\n\nFROM users");
  });

  test("should not affect string literals with comment-like content", () => {
    const sql = "SELECT * FROM users WHERE comment = '-- This is not a comment'";
    expect(stripSqlComments(sql)).toBe(sql);

    const sql2 = "SELECT * FROM users WHERE comment = '/* This is not a comment */'";
    expect(stripSqlComments(sql2)).toBe(sql2);
  });

  test("should handle escaped quotes in string literals", () => {
    const sql = "SELECT * FROM users WHERE text = 'Don\\'t -- remove this'";
    expect(stripSqlComments(sql)).toBe(sql);
  });

  test("should handle multiple comments of different types", () => {
    const sql = `
      -- Comment 1
      SELECT * 
      /* Comment 2 */
      FROM users
      -- Comment 3
      WHERE id = 1
    `;
    const expected = `
      
      SELECT * 
      
      FROM users
      
      WHERE id = 1
    `;
    expect(stripSqlComments(sql)).toBe(expected);
  });
});

describe("extractViewName", () => {
  test("should extract view name from CREATE MATERIALIZED VIEW statement", () => {
    const sql = "CREATE MATERIALIZED VIEW my_view AS SELECT * FROM users";
    expect(extractViewName(sql)).toBe("my_view");
  });

  test("should handle case insensitivity", () => {
    const sql = "create materialized view my_view AS SELECT * FROM users";
    expect(extractViewName(sql)).toBe("my_view");
  });

  test("should handle extra whitespace", () => {
    const sql = "CREATE   MATERIALIZED    VIEW     my_view    AS SELECT * FROM users";
    expect(extractViewName(sql)).toBe("my_view");
  });

  test("should return 'Unnamed view' when no CREATE MATERIALIZED VIEW statement", () => {
    const sql = "SELECT * FROM users";
    expect(extractViewName(sql)).toBe("Unnamed view");
  });

  test("should handle view names with special characters", () => {
    const sql = "CREATE MATERIALIZED VIEW `my-view.1` AS SELECT * FROM users";
    expect(extractViewName(sql)).toBe("`my-view.1`");
  });
});
