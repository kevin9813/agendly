# agendly
# 🚀 Guía Rápida: Desarrollo vs Producción

## Problema 1: Rechargos en navegador ← Se pierde sesión ✅ RESUELTO

**Cambio implementado**: La sesión ahora se guarda en `localStorage`. Ya no pierde sesión al recargar.

---

## Problema 2: Cambios requieren eliminar todo ✅ RESUELTO

### Para DESARROLLO (recomendado mientras codificas):
```bash
podman compose -f podman-compose.dev.yml up --build
```

**Ventajas**:
- ✅ Hot reload automático (cambios aparecen al recargar)
- ✅ Sin necesidad de `podman compose down -v` cada vez
- ✅ Backend con Django runserver (más rápido)
- ✅ Acceso directo a la BD en localhost:5432

### Para PRODUCCIÓN (antes de hacer deploy):
```bash
podman compose -f podman-compose.yml up --build
```

### Si tienes problemas:
```bash
./clean-and-rebuild.sh dev    # Limpia y reinicia (desarrollo)
# o
./clean-and-rebuild.sh prod   # Limpia y reinicia (producción)
```

---

**Más detalles en [`DEVELOPMENT.md`](./DEVELOPMENT.md)**
