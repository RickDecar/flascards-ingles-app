import { resolverCategoria, VALOR_NUEVA_CATEGORIA } from "./categorias";

describe("resolverCategoria", () => {
  it("devuelve la categoría seleccionada si no es nueva", () => {
    expect(resolverCategoria("Verbos", "ignorado")).toBe("Verbos");
  });

  it("devuelve el nombre completo y recortado de la nueva categoría", () => {
    expect(resolverCategoria(VALOR_NUEVA_CATEGORIA, "  Mi categoría ")).toBe("Mi categoría");
  });

  it("devuelve null si se eligió crear una y el nombre está vacío o en blanco", () => {
    expect(resolverCategoria(VALOR_NUEVA_CATEGORIA, "")).toBeNull();
    expect(resolverCategoria(VALOR_NUEVA_CATEGORIA, "   ")).toBeNull();
    expect(resolverCategoria(VALOR_NUEVA_CATEGORIA, undefined)).toBeNull();
  });
});
