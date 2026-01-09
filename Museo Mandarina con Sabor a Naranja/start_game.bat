@echo off
echo Iniciando servidor local para Museo Mandarina...
echo Esto es necesario para cargar los modulos y texturas correctamente.
echo.
echo Por favor, manten esta ventana abierta mientras juegas.
echo.
start "" "http://localhost:8000"
python -m http.server 8000
pause
