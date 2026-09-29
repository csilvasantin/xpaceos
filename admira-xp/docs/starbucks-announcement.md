# Aviso de cierre / Closing announcement

El altavoz negro junto a la escalera reproduce el aviso: «Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.». Primera voz gratuita: Mónica de macOS. La música continúa avanzando con volumen cero durante el aviso y recupera su volumen y estado de silencio al terminar, cancelar o fallar. Una segunda pulsación detiene el aviso. En Control Xtore, /sin autocompleta /sincro on o /sincro off según el estado contrario al actual; Enter ejecuta y Tab acepta. El texto sugerido se puede editar. Los paneles inferiores ocultan las barras de scroll y conservan desplazamiento y tiradores de tamaño.

The black speaker beside the staircase plays the Spanish closing announcement: “Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.” Initial free voice: macOS Mónica. Music keeps advancing at zero volume during the announcement; its volume and mute state are restored on completion, cancellation or failure. Click again to stop. In Control Xtore, /sin completes /sincro on or /sincro off, targeting the opposite current state; Enter runs it and Tab accepts. Suggested text remains editable. Bottom panels hide scrollbars while preserving scrolling and resize handles.

## MCP

matrix_announcement {expected_revision:N} increments announcementNext. Read matrix_state first. Authenticated fleet key required. Open Matrix pages apply new events once; newly opened pages do not replay old announcements. Browser audio permission is required: if blocked, click the speaker locally. Saved is not playback acknowledgement. The music playlist is unchanged.

ES: Leer matrix_state y enviar su revisión como expected_revision. El aviso sólo se aplica a clientes abiertos; no se repite al entrar. Si el navegador bloquea el audio, pulsar el altavoz. No modifica la playlist ni acredita reproducción en hardware.

Audio: https://www.xpaceos.com/admira-xp/assets/audio/starbucks-cierre-22h.m4a

Anclaje / Anchor: yaw -23.289684°, pitch 21.400960°. Fuente / Source: starbucks-announcement.mjs. Botón Experto / Expert button: Altavoz avisos / Announcement speaker.

Generación / Generation: macOS say, Mónica, rate 165; ffmpeg atempo=0.82, loudnorm -16 LUFS, AAC 128 kbps. Texto validado con transcripción local. / Text checked by local transcription.

## Experto · Vistas y altavoz / Expert · Views and speaker

ES: La tercera columna del menú Experto contiene Good, Better, Best y Matrix, el estado de la vista y Local view. La zona media queda para los controles operativos (players, playlists, cámara, audio). Ocultar/Mostrar afecta sólo a Local view: conserva el selector y ambos separadores. Arrastra los separadores para ajustar anchos y el tirador superior para la altura. Sin barras de desplazamiento visibles.

EN: The third Expert column contains Good, Better, Best and Matrix, view status and Local view. The middle column holds operational controls (players, playlists, camera, audio). Hide/Show only affects Local view: the selector and both dividers remain available. Drag the dividers to resize columns and the top handle to resize height. Scrollbars remain hidden.

ES: El altavoz de avisos de Starbucks usa un rectángulo sin icono, oculto hasta hover o foco de teclado. Al pasar el cursor o enfocarlo con teclado, su contorno fluctúa suavemente. Pulsa o usa Enter/Espacio para emitir o detener la cuña. Durante el aviso el contorno sólo se ve al pasar el ratón o recibir foco de teclado, sin símbolos. La preferencia de movimiento reducido elimina la animación. El botón «Altavoz avisos» centra la cámara en el altavoz; «Aviso de cierre» ofrece la misma acción desde Experto.

EN: The Starbucks announcement speaker uses a rectangle without an icon, hidden until hover or keyboard focus. Hovering or focusing it with the keyboard softly pulses its outline. Click or press Enter/Space to play or stop the announcement. While playing, the outline is visible only on hover or keyboard focus, without a symbol. Reduced-motion preferences disable animation. “Announcement speaker” centers the camera on the speaker; “Closing announcement” provides the same action in Expert.

MCP: matrix_announcement remains the authenticated announcement trigger with expected_revision. No new tools or physical-device controls. UI layout and hover are local presentation; audio priority, music restoration and the fixed 22h announcement are unchanged. Details: https://www.xpaceos.com/admira-xp/docs/starbucks-announcement.md
