import express from "express";
import request from "supertest";
import { describe, expect, test } from "vitest";
import "../../src/extensions/responseGenerator.js";

describe("sendServerJson", () => {
  test("supports response objects and positional arguments", async () => {
    const app = express();
    app.get("/object", (_req, res) => res.sendServerJson({ code: 201, message: "CREATED", data: { id: 1 } }));
    app.get("/args", (_req, res) => res.sendServerJson(202, "ACCEPTED", { id: 2 }));
    app.get("/invalid", (_req, res) => res.sendServerJson("bad" as any));

    expect((await request(app).get("/object")).status).toBe(201);
    expect((await request(app).get("/args")).body.data).toEqual({ id: 2 });
    expect((await request(app).get("/invalid")).status).toBe(500);
  });
});
