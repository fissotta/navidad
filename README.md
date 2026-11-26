# Navidad en el Lab

Fondo de pantalla animado para la pantalla táctil del laboratorio (página estática en GitHub Pages).
Sobre la foto panorámica real del lab aparecen los integrantes **en plastilina**, bacterias de la clase
*Acidithiobacillia* (Moya-Beltrán et al. 2021), los **peluches** de la repisa que cobran vida y cantan, y
easter eggs navideños. Todo con movimientos suaves y música baja, para no distraer.

## Cómo se ve

- **Cámara lenta** que recorre el lab en tres zonas (izquierda, centro, derecha) y se queda 1–2 minutos en cada una.
- **Integrantes** (carpeta `Integrantes`): 14 personas en plastilina con sus rasgos (pelo, barba, lentes, audífonos,
  ropa). Los de mesón usan **delantal**; los de bioinformática (Abraham, Issotta, Camila) y la PI (Raquel), no.
  Los de bioinfo aparecen sentados detrás de los monitores.
- **Peluches**: primer plano de la repisa (fotos `bacterias1/2`), con nombres según sus etiquetas:
  *A. thiooxidans*, *A. ferrivorans*, *A. caldus*, *A. ferrooxidans*, *A. albertensis*, *A. sulfuriphilus*.
- **Bacterias del paper** paseando con su nombre en latín (17 especies y candidatas).
- **Guirnaldas de luces** en las repisas y la ventana, **TV de la pared** (chimenea, globo de nieve, árbol
  filogenético, aurora, saludo), **matraces** que burbujean, **noche** en la ventana (desde las 19:30).

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

Persona → saluda y dice algo · bacteria/personaje → salta y habla · **repisa de peluches** → primer plano y se
presentan · **TV** → cambia de canal · **ventana** → nieve (y a veces pasa el trineo) · **matraces** → burbujas y
sale una bacteria · **póster del Copahue** → sale *I. copahuensis* · **póster grande** → datos del paper ·
**monitor rosado** → mensaje de terminal · **refrigerador** → pingüino · **luces** → cambian de patrón ·
suelo → chispitas y a veces una bacteria · 7 toques rápidos → un easter egg al azar.
En el primer plano de los peluches, tocar fuera de ellos vuelve al lab.

## Música

Generada en el navegador (Web Audio): villancicos de dominio público con arreglos que cambian cada vez
(tonalidad, tempo, instrumentos, armonías) alternados con piezas ambientales no navideñas. **Siempre encendida y
baja.** La TV solo deja sonar audio después del primer toque. Botón ◀) abajo a la derecha para silenciar.

## Rendimiento (TV antigua)

En la TV (Tizen) se dibuja a ~30 cuadros por segundo con el fondo de 1080 px de alto; en un PC 4K usa el fondo de
2160 px. Los personajes se pintan una sola vez al cargar y luego solo se mueven. Se recarga sola a las 5 AM.

## Parámetros de prueba (en la URL)

`?debug` (coordenadas, cps, errores) · `?ev=peluchesCantan` (lanza un evento; ver `EVENTS` en `js/director.js`) ·
`?zona=left|center|right` · `?noche=1` · `?turbo=5` · `?lento` (modo TV en un PC) · `?bajo` (fondo liviano) ·
`?vol=0.3` · `?musica=off` · `?galeria` (todos los personajes juntos) · `?sim=10` (adelanta 10 s).

## Archivos

- `js/scene.js`: coordenadas del lab (pasillos, mesones, escritorios, ventana, TV…). Con `?debug` se ven y al tocar
  se imprime la coordenada en la consola.
- `js/people.js`: integrantes (colores y rasgos en `N.PEOPLE`). `js/critters.js`: bacterias y personajes navideños.
- `js/plush.js`: peluches. `js/director.js`: eventos y frases. `js/music.js`: música. `js/fx.js`: efectos.
- `assets/`: fondo en trozos (`bg/`), muebles recortados que tapan a la gente (`occ/`), peluches (`plush/`).
