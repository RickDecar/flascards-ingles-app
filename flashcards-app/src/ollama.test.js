import { buildHttpErrorMessage, buildModelNotFoundMessage } from "./ollama";

describe("buildHttpErrorMessage", () => {
  it("indica modelo no encontrado con su nombre en un 404", () => {
    const mensaje = buildHttpErrorMessage(404, "modelo-x");
    expect(mensaje).toBe(buildModelNotFoundMessage("modelo-x"));
    expect(mensaje).toContain("ollama pull modelo-x");
  });

  it("describe un error interno en un 500 e incluye el detalle de Ollama", () => {
    const mensaje = buildHttpErrorMessage(500, "llama3.2", "out of memory");
    expect(mensaje).toContain("HTTP 500");
    expect(mensaje).toContain("out of memory");
    expect(mensaje).not.toContain("No se pudo conectar");
  });

  it("funciona en un 5xx sin detalle", () => {
    const mensaje = buildHttpErrorMessage(503, "llama3.2");
    expect(mensaje).toContain("HTTP 503");
    expect(mensaje).not.toContain(": .");
  });

  it("describe un rechazo en errores 4xx distintos de 404", () => {
    const mensaje = buildHttpErrorMessage(400, "llama3.2", "invalid request");
    expect(mensaje).toContain("rechazó la petición (HTTP 400): invalid request");
  });
});
