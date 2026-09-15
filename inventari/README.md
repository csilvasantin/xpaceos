# Inventari · mobiliario de la Xperience

Página pública `/inventari/`, con 18 tipos nativos y catálogo `furni` de Pixeria (25 piezas en la copia inicial). No requiere iniciar el simulador para explorar las piezas. La creación original continúa en https://www.pixeria.com/crear/ con su propia autenticación.

## Representaciones

8/16/32 designan estilos. Nativos: vistas interpretadas desde la geometría compartida de `life-scene.mjs`, con raster pixelado, materiales simplificados y PBR respectivamente. No se afirma que la miniatura Good sea una captura del sprite legacy. Pixeria: sprite original (separación de cuatro caras cuando el registro lo indica) y relieves de vóxeles derivados a dos resoluciones. No se inventa la geometría posterior ni se presenta una reconstrucción hiperrealista.

Una única instancia WebGL genera miniaturas bajo demanda; las imágenes remotas se limitan al endpoint de assets de Admira. Fallos de CORS/carga se indican. La copia inicial permite consultar el catálogo aunque falle `/stock/list`; Actualizar consulta hasta 200 registros y avisa si el servidor limita la respuesta. No se descargan ni republican binarios de Pixeria.

## Identidad y visibilidad

`native:<type>` y `pixeria:<stock-id>` identifican modelos. Los IDs del layout identifican ejemplares. Ocultar uno no oculta otros ejemplares ni otros Xpacios. El juego conserva el layout lógico y publica una copia local; Good y el snapshot de Better/Best consumen el mismo filtro de presentación.

Se persiste en localStorage por Xpacio y se propaga entre pestañas del mismo origen. No es sincronización multiusuario ni cambia dispositivos, recorridos o colisiones. La distribución base se identifica como tal hasta recibir un layout del gemelo. El gemelo puede recibir distribuciones de su servicio existente; esas variaciones no son cambios del inventario.

Better y Best operativos corresponden al Xtanco. Las vistas de catálogo existen para todos los tipos; Supermercado/Creator conservan sus capacidades Good actuales. La CMDB patrimonial anterior se enlaza sin migrar ni sobrescribir datos.

## Best editable

Al abrir con `inventory=1`, o al tener una instancia oculta, Best monta objetos independientes del snapshot usando el renderer PBR compartido. Mantiene la cámara alineada, controles generales y simulación. La referencia fotográfica y personas recortadas se conservan en Best normal cuando no se solicita edición ni hay piezas ocultas. Best editable se identifica como PBR y no como el escenario fotográfico. No implica paridad de las 30 funciones del catálogo MCP.

## Verificación

`node --test inventari/*.test.mjs admira-xp/scripts/*.test.mjs xpacios/lab/assets.test.mjs homepage-twin-cta.test.mjs mcp/*.test.mjs help/funcionalidades/*.test.mjs`

QA navegador: ficha Mostrador, Good/Better/Best, ocultar/restaurar (Best 16 → 17 objetos visibles, ID counter y posición 1,6 conservados), búsqueda de sofá Pixeria y separación de sus cuatro caras. Rutas externas de creación requieren autorización propia. No añade credenciales, tools MCP ni llamadas de pago.

Misión de entrega: DCL-05d05f2d3c78975819d24430 · proyecto xpaceos.
