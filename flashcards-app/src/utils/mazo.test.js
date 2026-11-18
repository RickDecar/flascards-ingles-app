import { barajar, conservarOrden } from "./mazo";

const tarjetas = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

describe("barajar", () => {
  it("no modifica el arreglo original y conserva todos los elementos", () => {
    const resultado = barajar(tarjetas, () => 0.3);
    expect(tarjetas.map(t => t.id)).toEqual([1, 2, 3, 4]);
    expect(resultado.map(t => t.id).sort()).toEqual([1, 2, 3, 4]);
  });

  it("devuelve arreglo vacío o de un elemento sin errores", () => {
    expect(barajar([])).toEqual([]);
    expect(barajar([{ id: 9 }])).toEqual([{ id: 9 }]);
  });
});

describe("conservarOrden", () => {
  it("mantiene el orden previo aunque cambie el orden de entrada", () => {
    const resultado = conservarOrden(tarjetas, [3, 1, 4, 2]);
    expect(resultado.map(t => t.id)).toEqual([3, 1, 4, 2]);
  });

  it("omite las tarjetas que ya no existen", () => {
    const resultado = conservarOrden([{ id: 1 }, { id: 3 }], [3, 2, 1]);
    expect(resultado.map(t => t.id)).toEqual([3, 1]);
  });

  it("coloca las tarjetas nuevas al final", () => {
    const resultado = conservarOrden([{ id: 1 }, { id: 5 }, { id: 2 }], [2, 1]);
    expect(resultado.map(t => t.id)).toEqual([2, 1, 5]);
  });

  it("con orden previo vacío conserva el orden de entrada", () => {
    expect(conservarOrden(tarjetas, []).map(t => t.id)).toEqual([1, 2, 3, 4]);
  });
});
