# Navidad en el Lab

Fondo de pantalla animado para la pantalla táctil del laboratorio (página estática en GitHub Pages).
El lab está **dibujado** (inspirado en la foto panorámica, sin gente, limpio y liviano: no usa imágenes) y es
**circular**: la cámara gira lento y continuo, como si estuvieras parado al medio. Una vuelta tarda ~9 minutos.
Aparecen los integrantes en estilo ilustrado, bacterias de la clase *Acidithiobacillia* (Moya-Beltrán et al. 2021),
los **peluches** de la repisa que cobran vida y cantan, y easter eggs navideños. Todo suave y con música baja.

## Cómo se ve

- **Secciones del lab** (en círculo): TV, póster del Copahue y puerta con corona → mesón largo con repisas y matraces →
  refrigerador vidriado, reactivos y percha con delantales → ventanal con palmera y persianas → bioinformática
  (pizarra con el árbol de los 5 géneros, escritorios con monitores, reloj con la hora real) → repisa con los
  peluches en sus cajas de colores, póster y mesón 2 → vuelve a la TV.
- **Decoración**: guirnalda de pino con moños, banderines "FELIZ NAVIDAD" y "LAB 2026", copos de papel, luces que
  parpadean suave.
- **Integrantes** (carpeta `Integrantes`): 14 personas con sus rasgos (pelo, barba, lentes, audífonos, ropa) y una **tarjeta de identificación** colgada con su nombre. Los de
  mesón usan **delantal**; los de bioinformática (Abraham, Issotta, Camila) y la PI (Raquel), no. Los de bioinfo
  aparecen sentados detrás de los monitores.
- **Peluches** con sus nombres (etiquetas de cuero): *A. thiooxidans*, *A. ferrivorans*, *A. caldus*,
  *A. ferrooxidans*, *A. albertensis*, *A. sulfuriphilus*. Cuando les toca, la cámara se acerca a la repisa.
- **Bacterias del paper** paseando con su nombre en latín. **TV** (chimenea, globo de nieve, árbol filogenético,
  aurora, saludo), **matraces** que burbujean, **noche** en la ventana (desde las 19:30).

## Eventos (no se repiten hasta pasar por todos)

- **Comunes** (cada 7–15 s): paseos con material de lab, trabajo en el mesón (pipeta, matraz), charlas, café,
  bacterias, cambio de luces, matraces, TV, nieve afuera, escritorios de bioinfo ("¡Ensambló!", "Segmentation fault…").
- **Especiales** (cada 1–2 min): los peluches cantan un villancico con gorro, los peluches saludan, pan de pascua,
  cola de mono, amigo secreto, ronda de la PI, paper aceptado, bailecito, conga de bacterias, nieve mágica,
  siesta en bioinfo, arbolito, bacteria que sale del póster del Copahue.
- **Raros** (cada 3–5 min): trineo del Viejito Pascuero por la ventana, visita del Viejito Pascuero, reno perdido,
  galleta de jengibre que escapa, gruñón verde que roba las luces (y las devuelve), duende ordenando reactivos,
  cascanueces, monito (de la página *monito*), pingüino, mono de nieve que se derrite, bacteria gigante.

## Al tocar la pantalla

Persona → saluda y dice algo · bacteria/personaje → salta y habla · **repisa de peluches** → la cámara se acerca y se
presentan · **TV** → cambia de canal · **ventana** → nieve (y a veces pasa el trineo) · **matraces** → burbujas y
sale una bacteria · **póster del Copahue** → sale *I. copahuensis* · **póster grande** → datos del paper ·
**monitor rosado** → mensaje de terminal · **refrigerador** → pingüino · **luces** → cambian de patrón ·
suelo → chispitas y a veces una bacteria · 7 toques rápidos → un easter egg al azar.
**Reloj** → dice la hora · **puerta** → entra alguien especial · **pizarra** → datos del paper.

## Música

Generada en el navegador (Web Audio): villancicos de dominio público con arreglos que cambian cada vez
(tonalidad, tempo, instrumentos, armonías) alternados con piezas ambientales no navideñas. **Siempre encendida y
baja.** La TV solo deja sonar audio después del primer toque. Botón ◀) abajo a la derecha para silenciar.

## Rendimiento (TV antigua)

En la TV (Tizen) se dibuja a ~30 cuadros por segundo. El lab y los personajes se pintan una sola vez al cargar
(en trozos) y luego solo se mueven; la página pesa ~150 KB. Se recarga sola a las 5 AM.

## Parámetros de prueba (en la URL)

`?debug` (coordenadas, cps, errores) · `?ev=peluchesCantan` (lanza un evento; ver `EVENTS` en `js/director.js`) ·
`?x=6000` (posición de la cámara) · `?giro=18` (velocidad de giro, 0 = quieta) · `?noche=1` · `?turbo=5` · `?lento` (modo TV en un PC) · `?bajo` (fondo liviano) ·
`?vol=0.3` · `?musica=off` · `?galeria` (todos los personajes juntos) · `?sim=10` (adelanta 10 s).

## Archivos

- `js/labart.js`: el dibujo del lab. `js/scene.js`: coordenadas (pasillos, mesones, escritorios, ventana, TV…) y la
  cámara circular. Con `?debug` se ven y al tocar se imprime la coordenada en la consola.
- `js/people.js`: integrantes (colores y rasgos en `N.PEOPLE`). `js/critters.js`: bacterias y personajes navideños.
- `js/plush.js`: peluches. `js/director.js`: eventos y frases. `js/music.js`: música. `js/fx.js`: efectos.
