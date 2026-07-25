import { afterEach, describe, expect, test } from "vitest";
import { getFile, isDirExists, isFileExist } from "../../src/utils/filesUtil.js";

const originalConfigDir = process.env.CONFIG_DIR;

describe("filesUtil paths", () => {
  afterEach(() => {
    if (originalConfigDir === undefined) delete process.env.CONFIG_DIR;
    else process.env.CONFIG_DIR = originalConfigDir;
  });

  test("builds paths and detects existing fixture directory", () => {
    process.env.CONFIG_DIR = "./tests";
    expect(getFile("client")).toMatch(/tests[\\/]client\.ovpn$/);
    expect(isDirExists()).toBe(true);
    expect(isFileExist("missing-client")).toBe(false);
  });
});
