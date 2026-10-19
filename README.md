# Metallicus, verificado / Metallicus, verified

Mapa interactivo de las personas, productos, socios y asuntos regulatorios de Metallicus, Inc. Cada dato enlaza a la fuente que lo respalda.

An interactive map of Metallicus, Inc.'s people, products, partners and regulatory matters. Every fact links to the source that backs it.

## Estados / Statuses

| Marca | Estado | Significado |
|---|---|---|
| ● | Confirmado / Confirmed | Registro oficial, publicación de ambas partes o 2+ fuentes independientes fiables |
| ○ | Según la parte interesada / Per the interested party | Solo lo afirma Metallicus, la propia persona o la propia empresa |
| ◐ | Fuentes discrepan / Sources disagree | Se muestran todas las versiones con sus fuentes |

No se incluyen rumores, publicaciones de redes sociales o foros, resúmenes automáticos ni nada que no se haya podido comprobar en una fuente enlazada.

Rumours, social media or forum posts, automated summaries and anything that could not be checked against a linked source are left out.

## Estructura / Structure

- `index.html`, `styles.css`, `app.js` — la web (estática, sin compilación) / the static site, no build step.
- `data/raw/*.json` — datos por bloque de investigación / research data per block.
- `data/curation.json` — duplicados eliminados / removed duplicates.
- `data/graph.json` — datos combinados que lee la web / merged data the site reads.
- `scripts/build_data.py` — combina y valida (descarta hechos sin fuente válida) / merges and validates (drops facts without a valid source).

```
python3 scripts/build_data.py
```

## Correcciones / Corrections

Abre un issue con el dato, el enlace a la fuente y la corrección. Open an issue with the fact, a link to the source and the correction.

No es asesoramiento financiero. Not financial advice.

## Licencia / License

Código: MIT. Textos y datos: CC BY 4.0. Code: MIT. Text and data: CC BY 4.0.
