import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, vi } from "vitest";

import Role from "../models/role.js";
import User from "../models/user.js";

const secret = "secreto-para-pruebas-de-rutas";

export function useAuthenticatedRequests(app, role = "organizador") {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", secret);
    vi.spyOn(User, "findByPk").mockResolvedValue({ idUsuario: 1, idRol: 3 });
    vi.spyOn(Role, "findByPk").mockResolvedValue({ nombre: role });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  return () => {
    const token = jwt.sign({ idUsuario: 1 }, secret, { expiresIn: "5m" });
    return request.agent(app).set("Authorization", `Bearer ${token}`);
  };
}
