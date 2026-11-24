import jwt from "jsonwebtoken";
import { col, fn, UniqueConstraintError, where } from "sequelize";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import Role from "../models/role.js";
import User from "../models/user.js";

const secret = "clave-local-de-prueba-para-firmar-tokens";
const credentials = {
  nombre: "Participante de prueba",
  email: "participante@example.test",
  password: "UnaClaveDeEjemplo42",
};

describe("Registro e inicio de sesión", () => {
  let insert;

  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", secret);
    vi.spyOn(User, "findOne").mockResolvedValue(null);
    vi.spyOn(User, "findAll").mockResolvedValue([]);
    vi.spyOn(Role, "findOne").mockResolvedValue(
      Role.build({ idRol: 12, nombre: "participante" }),
    );
    insert = vi.spyOn(User.queryInterface, "insert");
    insert.mockImplementation(async (user) => {
      user.setDataValue("idUsuario", 42);
      return [user, 1];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("registra y permite iniciar sesión con la misma contraseña", async () => {
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        ...credentials,
        nombre: ` ${credentials.nombre} `,
        email: ` ${credentials.email.toUpperCase()} `,
      });

    expect(registration.status).toBe(201);
    expect(registration.body.data).toMatchObject({
      idUsuario: 42,
      nombre: credentials.nombre,
      email: credentials.email,
      idRol: 12,
    });
    expect(registration.body.data).not.toHaveProperty("password");
    expect(Role.findOne).toHaveBeenCalledWith({
      where: { nombre: "participante" },
    });
    expect(insert).toHaveBeenCalledOnce();

    // Sequelize ejecutó los hooks del modelo antes de intentar persistirlo.
    const [savedUser] = insert.mock.calls[0];
    expect(savedUser.password).not.toBe(credentials.password);
    User.findAll.mockResolvedValue([savedUser]);

    const login = await request(app).post("/api/auth/login").send({
      email: credentials.email.toUpperCase(),
      password: credentials.password,
    });

    expect(User.findAll).toHaveBeenCalledWith({
      where: where(fn("lower", col("email")), credentials.email),
      limit: 2,
    });
    expect(login.status).toBe(200);
    expect(jwt.verify(login.body.token, secret)).toMatchObject({
      idUsuario: 42,
      idRol: 12,
    });
    expect(login.body.data).not.toHaveProperty("password");

    const denied = await request(app).post("/api/auth/login").send({
      email: credentials.email,
      password: "OtraClaveDistinta42",
    });
    expect(denied.status).toBe(401);
    expect(denied.body).not.toHaveProperty("token");
  });

  it.each([
    ["correo inválido", { email: "sin-arroba" }],
    ["contraseña corta", { password: "corta" }],
    ["contraseña de más de 72 bytes", { password: "ñ".repeat(37) }],
    ["rol enviado desde el cliente", { idRol: 1 }],
  ])("rechaza un registro con %s", async (_label, changes) => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...credentials, ...changes });

    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("responde 409 cuando el correo ya existe", async () => {
    User.findOne.mockResolvedValue(User.build({ idUsuario: 21 }));

    const response = await request(app)
      .post("/api/auth/register")
      .send(credentials);

    expect(response.status).toBe(409);
    expect(User.findOne).toHaveBeenCalledWith({
      attributes: ["idUsuario"],
      where: where(fn("lower", col("email")), credentials.email),
      paranoid: false,
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("responde 409 si el correo se registra durante otra solicitud", async () => {
    insert.mockRejectedValue(new UniqueConstraintError({ errors: [] }));

    const response = await request(app)
      .post("/api/auth/register")
      .send(credentials);

    expect(response.status).toBe(409);
  });

  it("rechaza un inicio de sesión con el cuerpo incompleto", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email });

    expect(response.status).toBe(400);
    expect(User.findAll).not.toHaveBeenCalled();
  });

  it("requiere un secreto configurado para emitir el token", async () => {
    vi.stubEnv("JWT_SECRET", "");

    const response = await request(app).post("/api/auth/login").send({
      email: credentials.email,
      password: credentials.password,
    });

    expect(response.status).toBe(500);
    expect(response.body).not.toHaveProperty("token");
  });
});
