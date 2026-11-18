import {
  buildHttpErrorMessage,
  buildModelNotFoundMessage,
  CONNECTION_ERROR_MESSAGE,
} from "./ollama";

describe("buildHttpErrorMessage", () => {
  it("indica modelo no encontrado con su nombre en un 404", () => {
    const mensaje = buildHttpErrorMessage(404, "modelo-x");
    expect(mensaje).toBe(buildModelNotFoundMessage("modelo-x"));
    expect(mensaje).toContain("modelo-x");
    expect(mensaje).toContain("ollama pull modelo-x");
  });

  it("mantiene el mensaje de conexión para otros códigos de error", () => {
    expect(buildHttpErrorMessage(500, "llama3.2")).toBe(CONNECTION_ERROR_MESSAGE);
    expect(buildHttpErrorMessage(400, "llama3.2")).toBe(CONNECTION_ERROR_MESSAGE);
  });
});
