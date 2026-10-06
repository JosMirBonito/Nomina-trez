// Devuelve si el estudio está abierto ahora (hora de Lima).
// GET /api/estado  ->  { abierto, hoy, mensaje }
// Ajusta HORARIO con los horarios reales del estudio. null = cerrado.
const HORARIO = {
  0: null,              // domingo
  1: [11, 20],          // lunes
  2: [11, 20],
  3: [11, 20],
  4: [11, 20],
  5: [11, 21],
  6: [10, 21],          // sábado
};
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default async () => {
  const lima = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
  const dia = lima.getDay();
  const hora = lima.getHours() + lima.getMinutes() / 60;
  const h = HORARIO[dia];
  const abierto = !!h && hora >= h[0] && hora < h[1];

  let mensaje;
  if (abierto) mensaje = `Abierto ahora · hasta las ${h[1]}:00`;
  else {
    let d = (dia + (h && hora < h[0] ? 0 : 1)) % 7;
    while (!HORARIO[d]) d = (d + 1) % 7;
    const cuando = d === dia ? "hoy" : d === (dia + 1) % 7 ? "mañana" : `el ${DIAS[d]}`;
    mensaje = `Cerrado · abrimos ${cuando} a las ${HORARIO[d][0]}:00`;
  }

  return Response.json(
    { abierto, hoy: DIAS[dia], mensaje },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
};
