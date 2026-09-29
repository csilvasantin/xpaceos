# Visibilidad de personas — 29 septiembre 2026

HandON: base publicada `279a5f3`, posterior al relevo de Xtanco del 15 de septiembre.
La cafebrería ya tiene barra, mesas, librería, lounge y entrada canónica
`/xpacios/cafebreria/`. Mantiene la restricción anterior a Good; este cambio no
certifica ni habilita Better/Best/Matrix para esa vertical.

En el modo experto:

- `/gente on` y `/gente off`: personal y clientes juntos.
- `/personal on` y `/personal off`: solo los trabajadores.
- `/clientes on` y `/clientes off`: solo los clientes.

Se admiten mayúsculas y minúsculas. Cada orden cambia el grupo indicado;
`/gente off` seguido de `/personal on` deja visibles únicamente los trabajadores.
Son controles de presentación locales: preservan plantilla, visitantes,
simulación, ventas y aforo. Se guardan con la partida. Los viandantes exteriores
y actores especiales conservan sus controles propios.

El compositor, `__xtExec` y `xtAPI.command` usan el mismo manejador.
Los usos anteriores (`/clientes <n>`, `/gente store <n>`, `/personal dashboard`)
conservan su ruta. Canvas Good y snapshots de las otras vistas comparten estado.

Verificación: seis combinaciones en Chrome, entrada real del modo experto,
zonas de clic y snapshot de actores. 385 de 386 pruebas generales pasan;
`anonymizer-launch.test.mjs` tiene el fallo previo `scene is not defined`,
reproducido sin los cambios sobre `279a5f3`.

Seguimiento: Yokup `DCL-44f4acbe2054dd3a0bd435e2` · OraculoMacMini.
