# Museo Mandarina 3D

Este es un museo virtual 3D explorable que utiliza Three.js.

## Cómo Ejecutarlo

Debido a que no se detectó Node.js en el sistema, el proyecto ha sido configurado para funcionar directamente en el navegador usando CDNs.

### Opción 1: Servidor Local (Recomendado)
Para evitar bloqueos de seguridad del navegador (CORS) con archivos locales, lo ideal es usar un pequeño servidor web.
- **VS Code**: Instala la extensión "Live Server" > Click derecho en `index.html` > "Open with Live Server".
- **Python**: Abre una terminal en esta carpeta y escribe: `python -m http.server`. Luego ve a `http://localhost:8000`.

### Opción 2: Abrir Directamente
Puedes intentar hacer doble click en `index.html`. 
*Nota: Algunas texturas o scripts pueden ser bloqueados por seguridad dependiendo del navegador.*

## Controles
- **Mouse**: Mirar alrededor. Haz click para "capturar" el mouse y jugar.
- **W, A, S, D**: Caminar.
- **Click Izquierdo**: Interactuar con cuadros cuando aparece el mensaje "Click para ver".
- **ESC**: Salir del modo juego / Cerrar imagen ampliada.

## Guía de Edición

### Agregar Nuevas Habitaciones (`src/World.js`)
Edita el método `init()` en `src/World.js`.
Usa la clase `Room`:
```javascript
const nuevaSala = new Room(this.scene, x, z, ancho, largo, colorHex);
this.addRoom(nuevaSala);
```

### Agregar Puertas
Para conectar salas, crea "puertas" (huecos) en las paredes:
```javascript
// Abre un hueco en la pared Norte de 4 metros de ancho
nuevaSala.addDoor('North', 4, 3);
```

### Agregar Cuadros
Usa el método helper de la sala:
```javascript
// Pared, Ancho, Alto, RutaImagen, Título, Descripción
nuevaSala.addPaintingToWall('East', 2, 2, 'cuadros/mi-imagen.jpg', 'Título', 'Descripción');
```
Guarda tus imágenes en la carpeta `cuadros` y pon la ruta relativa.
