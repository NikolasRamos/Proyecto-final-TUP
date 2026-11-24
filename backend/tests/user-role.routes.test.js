import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import Role from "../models/role.js";
import User from "../models/user.js";

const secret = "clave-de-pruebas-para-sesiones";
const roles = {
  administrador: Role.build({ idRol: 10, nombre: "administrador" }),
  organizador: Role.build({ idRol: 20, nombre: "organizador" }),
  participante: Role.build({ idRol: 30, nombre: "participante" }),
};

function token(idUsuario, idRol = 10, expiresIn = "1h") {
  return jwt.sign({ idUsuario, idRol }, secret, { expiresIn });
}

function assign(appRequest, role = "organizador", target = 2) {
  return appRequest.patch(`/api/users/${target}/role`).send({ role });
}

describe("Asignación de roles", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", secret);
    vi.spyOn(User, "findByPk").mockImplementation(async (id) => {
      if (id === 1) return User.build({ idUsuario: id, idRol: 10 });
      if (id === 2 || id === 3) return User.build({ idUsuario: id, idRol: 30 });
      if (id === 4) return User.build({ idUsuario: id, idRol: 20 });
      return null;
    });
    vi.spyOn(Role, "findByPk").mockImplementation(async (id) => {
      return Object.values(roles).find((role) => role.idRol === id) ?? null;
    });
    vi.spyOn(Role, "findOne").mockImplementation(async ({ where }) => {
      return roles[where.nombre] ?? null;
    });
    vi.spyOn(User, "update").mockResolvedValue([1]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("requiere una sesión", async () => {
    const response = await assign(request(app));

    expect(response.status).toBe(401);
    expect(User.findByPk).not.toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
  });

  it.each(["firma incorrecta", "sesión vencida", "cuenta inactiva"])(
    "devuelve 401 con %s",
    async (scenario) => {
      const authorization = {
        "firma incorrecta": jwt.sign({ idUsuario: 1 }, "otra-clave", {
          expiresIn: "1h",
        }),
        "sesión vencida": token(1, 10, "-1h"),
        "cuenta inactiva": token(99),
      }[scenario];

      const response = await assign(request(app)).set(
        "Authorization",
        `Bearer ${authorization}`,
      );

      expect(response.status).toBe(401);
      expect(User.update).not.toHaveBeenCalled();
    },
  );

  it.each([3, 4])(
    "consulta el rol actual y le niega el acceso al usuario %s",
    async (id) => {
      const response = await assign(request(app)).set(
        "Authorization",
        `Bearer ${token(id)}`,
      );

      expect(response.status).toBe(403);
      expect(User.update).not.toHaveBeenCalled();
    },
  );

  it.each(["organizador", "administrador"])(
    "permite que un administrador asigne el rol %s",
    async (role) => {
      const response = await assign(request(app), role).set(
        "Authorization",
        `Bearer ${token(1, 30)}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        idUsuario: 2,
        idRol: roles[role].idRol,
        role,
      });
      expect(User.update).toHaveBeenCalledWith(
        { idRol: roles[role].idRol },
        { where: { idUsuario: 2, idRol: 30 } },
      );
    },
  );

  it("rechaza un rol ajeno a los perfiles elevados", async () => {
    const response = await assign(request(app), "participante").set(
      "Authorization",
      `Bearer ${token(1)}`,
    );

    expect(response.status).toBe(400);
    expect(User.update).not.toHaveBeenCalled();
  });

  it("responde 404 si la cuenta de destino no existe", async () => {
    const response = await assign(request(app), "organizador", 99).set(
      "Authorization",
      `Bearer ${token(1)}`,
    );

    expect(response.status).toBe(404);
    expect(User.update).not.toHaveBeenCalled();
  });

  it("acepta repetir la misma asignación", async () => {
    const response = await assign(request(app), "organizador", 4).set(
      "Authorization",
      `Bearer ${token(1)}`,
    );

    expect(response.status).toBe(200);
    expect(User.update).not.toHaveBeenCalled();
  });

  it("devuelve 409 si la cuenta cambió durante la asignación", async () => {
    User.update.mockResolvedValue([0]);

    const response = await assign(request(app)).set(
      "Authorization",
      `Bearer ${token(1)}`,
    );

    expect(response.status).toBe(409);
  });

  it("separa la edición del perfil de la asignación de roles", async () => {
    const response = await request(app)
      .put("/api/users/2")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ idRol: 10 });

    expect(response.status).toBe(400);
    expect(User.update).not.toHaveBeenCalled();
  });

  it("protege las rutas que antes permitían editar roles sin sesión", async () => {
    const responses = await Promise.all([
      request(app).put("/api/users/2").send({ idRol: 10 }),
      request(app).put("/api/roles/30").send({ nombre: "otro" }),
      request(app).get("/api/users"),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401,
    ]);
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it("protege los roles base contra cambios de nombre", async () => {
    const response = await request(app)
      .put("/api/roles/30")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ nombre: "otro" });

    expect(response.status).toBe(409);
  });
});
