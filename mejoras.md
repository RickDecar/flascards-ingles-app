Añade a la interfaz de usuario las siguientes funcionalidades para reforzar el repaso de tarjetas con errores:

Checkbox "Incidir sobre la tarjeta" en cada tarjeta flash.

Al activarse, el estado se guarda de forma persistente en la base de datos de tarjetas (asociado al id de la tarjeta), de modo que se mantenga aunque el usuario cierre la sesión o recargue la app.
Al desactivarse, se actualiza igualmente en la base de datos (deja de marcarse para repaso).


Botón "Incidir sobre mis errores" en la interfaz general.

Al pulsarlo, se filtra el mazo de tarjetas mostrando únicamente aquellas que tengan el checkbox incidir = true.
Si no hay ninguna tarjeta marcada, mostrar un mensaje indicando que no hay tarjetas pendientes de repaso (en vez de una lista vacía sin contexto).



Consideraciones técnicas a especificar:

Modelo de datos: añadir el campo incidir: boolean (por defecto false) al esquema de la tarjeta.
El checkbox debe reflejar siempre el estado actual guardado al cargar la tarjeta (no resetearse).
Definir si el modo "incidir sobre mis errores" es una vista temporal/filtro o si reemplaza la sesión de estudio normal hasta que el usuario salga de ese modo.
Opcional: permitir desmarcar la tarjeta como "incidir" automáticamente tras un número configurable de aciertos consecutivos.