# Aviso de cierre / Closing announcement

El altavoz negro junto a la escalera reproduce el aviso: «Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.». Primera voz gratuita: Mónica de macOS. La música continúa avanzando con volumen cero durante el aviso y recupera su volumen y estado de silencio al terminar, cancelar o fallar. Una segunda pulsación detiene el aviso. En Control Xtore, /sin autocompleta /sincro on o /sincro off según el estado contrario al actual; Enter ejecuta y Tab acepta. El texto sugerido se puede editar. Los paneles inferiores ocultan las barras de scroll y conservan desplazamiento y tiradores de tamaño.

The black speaker beside the staircase plays the Spanish closing announcement: “Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.” Initial free voice: macOS Mónica. Music keeps advancing at zero volume during the announcement; its volume and mute state are restored on completion, cancellation or failure. Click again to stop. In Control Xtore, /sin completes /sincro on or /sincro off, targeting the opposite current state; Enter runs it and Tab accepts. Suggested text remains editable. Bottom panels hide scrollbars while preserving scrolling and resize handles.

## MCP

matrix_announcement {expected_revision:N} increments announcementNext. Read matrix_state first. Authenticated fleet key required. Open Matrix pages apply new events once; newly opened pages do not replay old announcements. Browser audio permission is required: if blocked, click the speaker locally. Saved is not playback acknowledgement. The music playlist is unchanged.

ES: Leer matrix_state y enviar su revisión como expected_revision. El aviso sólo se aplica a clientes abiertos; no se repite al entrar. Si el navegador bloquea el audio, pulsar el altavoz. No modifica la playlist ni acredita reproducción en hardware.

Audio: https://www.xpaceos.com/admira-xp/assets/audio/starbucks-cierre-22h.m4a

Anclaje / Anchor: yaw -23.289684°, pitch 21.400960°. Fuente / Source: starbucks-announcement.mjs. Botón Experto / Expert button: Altavoz avisos / Announcement speaker.

Generación / Generation: macOS say, Mónica, rate 165; ffmpeg atempo=0.82, loudnorm -16 LUFS, AAC 128 kbps. Texto validado con transcripción local. / Text checked by local transcription.
