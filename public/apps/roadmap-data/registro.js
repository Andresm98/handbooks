/* Registro del contenido ampliado del roadmap.
   Cada archivo de esta carpeta llama a:
     RoadmapPlus.temas({ '<id-tema>': { conceptos, profundidad, recurrentes, casos, escenarios } })
     RoadmapPlus.nuevo({ ...tema completo con el mismo esquema que roadmap.html, más plus })
     RoadmapPlus.transversales([ { tema, resumen, capas, regla, temas } ])
   Formato ligero permitido en los textos: `código` y **negrita**.
   scripts/validate.ts comprueba ids, campos obligatorios y referencias cruzadas en cada build. */
window.ROADMAP_PLUS = { temas: {}, nuevos: [], transversales: [] };
window.RoadmapPlus = {
  temas(obj) { Object.assign(window.ROADMAP_PLUS.temas, obj); },
  nuevo(ch) { window.ROADMAP_PLUS.nuevos.push(ch); },
  transversales(list) { window.ROADMAP_PLUS.transversales.push(...list); }
};
