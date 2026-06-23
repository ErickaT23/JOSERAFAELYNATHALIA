# boda-joseymariandre

## Firebase

La invitación está preparada para usar la sombrilla de Realtime Database:

- `eventos/joseandres-mariandrea-2026/config`
- `eventos/joseandres-mariandrea-2026/invitados`
- `eventos/joseandres-mariandrea-2026/rsvp`
- `eventos/joseandres-mariandrea-2026/deseos`

La configuración Firebase está en `database.js`.

Después de publicar o abrir la invitación con Firebase activo, entra una vez a:

```text
index.html?seedGuests=1
```

Eso creará/actualizará el config del evento y los 92 invitados en Realtime Database.

El administrador está en:

```text
admin.html?key=twodesign123
```

El dashboard está en:

```text
dashboard.html
```
