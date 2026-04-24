# 🐛 Solución: Problemas de Desarrollo

Este documento explica los dos problemas que experimentabas y sus soluciones.

---

## Problema 1: Sesión se pierde al recargar (✅ RESUELTO)

### ¿Qué pasaba?
Cada vez que recargabas la página (F5), te devolvía al login. Esto ocurría porque la sesión se guardaba solo en memoria (React state).

### Solución implementada
Se agregó persistencia de sesión usando **localStorage**:
- Cuando haces login, el usuario se guarda en `localStorage.setItem('agendly_user', JSON.stringify(user))`
- Cuando el app monta (recarga), se restaura desde `localStorage.getItem('agendly_user')`
- Cuando haces logout, se limpia con `localStorage.removeItem('agendly_user')`

**Resultado**: Ahora puedes recargar la página sin perder la sesión ✅

---

## Problema 2: Necesitas eliminar todo el proyecto para que funcione

### ¿Qué pasaba?
Incluso con `podman-compose up --build`, algunos cambios no aparecían. Tenías que ejecutar:
```bash
podman compose down -v
podman rm -f db web
podman network prune -f
```

### Causa raíz
El archivo `podman-compose.yml` **no tenía volúmenes configurados** para desarrollo:
- Los cambios en tu código **no se reflejaban** en los contenedores sin reconstruir
- El backend (Django) usaba `runserver` que debería hacer hot reload, pero sin volúmenes no veía los cambios
- El frontend (Vite) necesita volúmenes para que el hot reload funcione correctamente

### Soluciones implementadas

#### 1️⃣ Archivo de composición para DESARROLLO (`podman-compose.dev.yml`)

Úsalo mientras desarrollas **localmente**:
```bash
# Primera vez
podman compose -f podman-compose.dev.yml up --build

# Cambios posteriores (sin necesidad de rebuild)
podman compose -f podman-compose.dev.yml up
```

**Características**:
- ✅ Volúmenes compartidos para backend y frontend
- ✅ Hot reload en ambos lados
- ✅ Contenedores nombrados con sufijo `_dev` para no conflictuar
- ✅ Datos de BD separados (`postgres_data_dev`)
- ✅ Backend usa `runserver` de Django (más eficiente que Gunicorn)
- ✅ Acceso directo a PostgreSQL en `localhost:5432` si lo necesitas

#### 2️⃣ Archivo de composición para PRODUCCIÓN (`podman-compose.yml`)

Este es el archivo **original** - úsalo para simular producción:
```bash
podman compose -f podman-compose.yml up --build
```

**Características**:
- ✅ Sin volúmenes (código incluido en la imagen)
- ✅ Backend usa Gunicorn (producción)
- ✅ Sin hot reload

#### 3️⃣ Script de limpieza (`clean-and-rebuild.sh`)

Si tienes problemas persistentes, ejecuta:
```bash
# Desarrollo
chmod +x clean-and-rebuild.sh
./clean-and-rebuild.sh dev

# O producción
./clean-and-rebuild.sh prod
```

---

## 📋 Flujo de trabajo recomendado

### Durante DESARROLLO (mientras trabajas en el código):
```bash
# Primera vez o por primera vez en esta rama
podman compose -f podman-compose.dev.yml up --build

# Cambios posteriores (los volúmenes hacen que se reflejen automáticamente)
# Solo necesitas recargar el navegador en el frontend
# Para cambios en Django, recarga la página en el navegador también
```

**Puntos claves**:
- Los cambios en `frontend/src/**` se reflejan **inmediatamente** (Vite hot reload)
- Los cambios en `core/**` o `agendly/**` se reflejan al recargar el navegador
- Las migraciones de BD: `podman exec web_dev python manage.py migrate`
- Los logs: `podman compose -f podman-compose.dev.yml logs -f`

### Antes de hacer PUSH/DEPLOY:
```bash
# Prueba la configuración de producción
./clean-and-rebuild.sh prod

# O manualmente
podman compose -f podman-compose.yml up --build --force-recreate
```

---

## 🆘 Troubleshooting

### "Still getting old code changes..."
```bash
# Asegúrate de que los volúmenes estén correctos
podman volume ls | grep dev

# Si no aparecen, recrea todo
./clean-and-rebuild.sh dev
```

### "Backend still not reflecting changes..."
```bash
# Django a veces cachea. Recarga el navegador
# Si sigue sin funcionar, reinicia el contenedor
podman restart web_dev
```

### "Port already in use"
```bash
# Probablemente tienes ambas composiciones corriendo
podman ps | grep web

# Detén la que no necesitas
podman compose -f podman-compose.yml down
# o
podman compose -f podman-compose.dev.yml down
```

### "Database errors after switching between dev/prod"
```bash
# Los volúmenes son separados, pero la lógica de BD es igual
# Si tienes conflictos, limpia y recrea
./clean-and-rebuild.sh dev
```

---

## 📊 Comparación rápida

| Característica | `podman-compose.dev.yml` | `podman-compose.yml` |
|---|---|---|
| Volúmenes | ✅ Sí | ❌ No |
| Hot reload | ✅ Sí | ❌ No |
| Django runserver | ✅ Sí (rápido) | ❌ Gunicorn (producción) |
| Reconstruir sempre? | ❌ No | ✅ Sí |
| Acceso BD directo | ✅ Puerto 5432 | ❌ No |
| Ideal para | 👨‍💻 Desarrollo | 🚀 Producción |

---

## ✅ Resumen de cambios

1. **`App.jsx`**: Agregada persistencia de sesión con localStorage
2. **`podman-compose.dev.yml`**: Nueva configuración para desarrollo con volúmenes
3. **`clean-and-rebuild.sh`**: Script para limpiar y reconstruir fácilmente

¡Ahora tu flujo de desarrollo será mucho más fluido! 🎉



# Primera vez
podman compose -f podman-compose.dev.yml up --build
# Cambios posteriores
# Solo recarga el navegador - eso es todo!

# Verifica que funcione en "producción"
./clean-and-rebuild.sh prod


./clean-and-rebuild.sh dev   # Limpia y reinicia desarrollo
./clean-and-rebuild.sh prod  # Limpia y reinicia producción