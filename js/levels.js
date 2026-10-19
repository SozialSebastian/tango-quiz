/* Orquesta – Schwierigkeit je Song, nach Bekanntheit der Aufnahme auf Milongas
   leicht = Klassiker, die fast jede:r kennt · schwer = selten gespielt · alles andere = mittel.
   Schlüssel: "Orchester|Titel" wie im Archiv. Eigene/importierte Songs sind „mittel“, im Archiv änderbar. */
"use strict";

const LEVELS = { leicht: "Leicht", mittel: "Mittel", schwer: "Schwer" };

const LEVEL_EASY = [
  // Juan D'Arienzo
  "Juan D'Arienzo|La cumparsita", "Juan D'Arienzo|El choclo", "Juan D'Arienzo|Paciencia", "Juan D'Arienzo|La puñalada",
  "Juan D'Arienzo|Don Juan", "Juan D'Arienzo|Canaro en París", "Juan D'Arienzo|Nueve de julio", "Juan D'Arienzo|El flete",
  "Juan D'Arienzo|Pensalo bien", "Juan D'Arienzo|La morocha", "Juan D'Arienzo|Loca", "Juan D'Arienzo|Felicia",
  "Juan D'Arienzo|Hotel Victoria", "Juan D'Arienzo|Desde el alma", "Juan D'Arienzo|Lágrimas y sonrisas",
  "Juan D'Arienzo|Milonga vieja milonga",
  // Carlos Di Sarli
  "Carlos Di Sarli|Bahía Blanca", "Carlos Di Sarli|A la gran muñeca", "Carlos Di Sarli|El amanecer", "Carlos Di Sarli|Don Juan",
  "Carlos Di Sarli|Comme il faut", "Carlos Di Sarli|El ingeniero", "Carlos Di Sarli|Germaine", "Carlos Di Sarli|Rodríguez Peña",
  "Carlos Di Sarli|La cumparsita", "Carlos Di Sarli|Milonguero viejo", "Carlos Di Sarli|Indio manso", "Carlos Di Sarli|Champagne tango",
  "Carlos Di Sarli|Organito de la tarde", "Carlos Di Sarli|Porteño y bailarín",
  // Osvaldo Pugliese
  "Osvaldo Pugliese|La yumba", "Osvaldo Pugliese|Gallo ciego", "Osvaldo Pugliese|Recuerdo", "Osvaldo Pugliese|Negracha",
  "Osvaldo Pugliese|Corrientes y Esmeralda", "Osvaldo Pugliese|Malandraca", "Osvaldo Pugliese|Emancipación",
  // Aníbal Troilo
  "Aníbal Troilo|Malena", "Aníbal Troilo|Uno", "Aníbal Troilo|Quejas de bandoneón", "Aníbal Troilo|Tinta roja",
  "Aníbal Troilo|En esta tarde gris", "Aníbal Troilo|Gricel", "Aníbal Troilo|Toda mi vida", "Aníbal Troilo|Naranjo en flor",
  "Aníbal Troilo|Yo soy el tango", "Aníbal Troilo|Romance de barrio",
  // weitere Orchester
  "Miguel Caló|Al compás del corazón", "Miguel Caló|Bajo un cielo de estrellas", "Miguel Caló|Trasnochando",
  "Francisco Canaro|Milonga sentimental", "Francisco Canaro|Poema", "Francisco Canaro|Milonga criolla",
  "Ricardo Tanturi|Así se baila el tango", "Ricardo Tanturi|Una emoción", "Ricardo Tanturi|Recuerdo malevo",
  "Ángel D'Agostino|Tres esquinas", "Ángel D'Agostino|Café Domínguez",
  "Lucio Demare|Malena",
  "Rodolfo Biagi|Campo afuera", "Rodolfo Biagi|Lágrimas y sonrisas",
  "Edgardo Donato|Carnaval de mi barrio"
];

const LEVEL_HARD = [
  // Juan D'Arienzo
  "Juan D'Arienzo|Corazón de artista",
  "Juan D'Arienzo|Bien pulenta", "Juan D'Arienzo|El puntazo", "Juan D'Arienzo|Orillas del Plata",
  "Juan D'Arienzo|Visión celeste", "Juan D'Arienzo|Silueta porteña", "Juan D'Arienzo|Mentías", "Juan D'Arienzo|Valsecito criollo",
  "Juan D'Arienzo|Estampa de varón", "Juan D'Arienzo|Castigo", "Juan D'Arienzo|Ay Aurora", "Juan D'Arienzo|De antaño",
  "Juan D'Arienzo|La cicatriz", "Juan D'Arienzo|Salí de perdedor", "Juan D'Arienzo|Flor del mal", "Juan D'Arienzo|Adiós querida",
  "Juan D'Arienzo|Tu pañuelo", "Juan D'Arienzo|Cortada de San Ignacio", "Juan D'Arienzo|El entrerriano", "Juan D'Arienzo|Independencia",
  "Juan D'Arienzo|El internado", "Juan D'Arienzo|El porteño",
  "Juan D'Arienzo|Cuatro palabras", "Juan D'Arienzo|El vals de los abuelos",
  // Carlos Di Sarli
  "Carlos Di Sarli|Corazón",
  "Carlos Di Sarli|El caburé", "Carlos Di Sarli|El once",
  "Carlos Di Sarli|Volver a soñar", "Carlos Di Sarli|Griseta", "Carlos Di Sarli|Decime qué pasó", "Carlos Di Sarli|Adiós te vas",
  "Carlos Di Sarli|Anselmo Acuña el resero", "Carlos Di Sarli|Cómo se hace un tango",
  "Carlos Di Sarli|Los muñequitos", "Carlos Di Sarli|Navegante", "Carlos Di Sarli|Zorro plateado", "Carlos Di Sarli|Un día llegará",
  "Carlos Di Sarli|Va a cantar un ruiseñor", "Carlos Di Sarli|Estampa federal", "Carlos Di Sarli|Julián Centeya",
  "Carlos Di Sarli|Entre pitada y pitada", "Carlos Di Sarli|Patotero sentimental",
  "Carlos Di Sarli|Cuando un viejo se enamora",
  // Osvaldo Pugliese
  "Osvaldo Pugliese|La rayuela", "Osvaldo Pugliese|El rodeo", "Osvaldo Pugliese|Nochero soy",
  // Aníbal Troilo
  "Aníbal Troilo|Marioneta", "Aníbal Troilo|Luna llena", "Aníbal Troilo|Equipaje",
  "Aníbal Troilo|Llorarás, llorarás", "Aníbal Troilo|Cimarrón de ausencia", "Aníbal Troilo|Confesión",
  "Aníbal Troilo|Y dicen que no te quiero", "Aníbal Troilo|Cordón de oro",
  "Aníbal Troilo|Margarita Gauthier",
  // Miguel Caló, Francisco Canaro, Ricardo Tanturi, Pedro Laurenz
  "Miguel Caló|Lejos de Buenos Aires", "Miguel Caló|Dos fracasos",
  "Francisco Canaro|Retintín", "Francisco Canaro|Reliquias porteñas", "Francisco Canaro|Parque Patricios",
  "Francisco Canaro|Milonga de mis amores",
  "Ricardo Tanturi|Encuentro",
  "Pedro Laurenz|Orgullo criollo", "Pedro Laurenz|Desconsuelo", "Pedro Laurenz|Abandono", "Pedro Laurenz|No me extraña",
  // Rodolfo Biagi
  "Rodolfo Biagi|El incendio", "Rodolfo Biagi|Una pena", "Rodolfo Biagi|Lejos de ti", "Rodolfo Biagi|Loca de amor",
  "Rodolfo Biagi|Viejo portón", "Rodolfo Biagi|La maleva", "Rodolfo Biagi|Alma de bohemio", "Rodolfo Biagi|Son cosas del bandoneón",
  "Rodolfo Biagi|Queja indiana", "Rodolfo Biagi|Dichas que viví", "Rodolfo Biagi|A mí no me interesa", "Rodolfo Biagi|Cicatrices",
  "Rodolfo Biagi|El estribo", "Rodolfo Biagi|Todo te nombra", "Rodolfo Biagi|Por un beso de amor", "Rodolfo Biagi|Humillación", "Rodolfo Biagi|Zaraza", "Rodolfo Biagi|Didi", "Rodolfo Biagi|El entrerriano",
  "Rodolfo Biagi|Cuatro palabras", "Rodolfo Biagi|Marcheta", "Rodolfo Biagi|Picante", "Rodolfo Biagi|Amor y vals",
  "Rodolfo Biagi|Magdala", "Rodolfo Biagi|Tus labios me dirán",
  // weitere
  "Osvaldo Fresedo|Sollozos",
  "Orquesta Típica Victor|Pato", "Orquesta Típica Victor|Puente Alsina",
  "Enrique Rodríguez|Cómo has cambiado pebeta"
];

const _easy = new Set(LEVEL_EASY), _hard = new Set(LEVEL_HARD);
// eigene Einstellung im Archiv (s.level) hat Vorrang
function songLevel(s) {
  if (s.level && LEVELS[s.level]) return s.level;
  const k = `${s.orq}|${s.title}`;
  return _easy.has(k) ? "leicht" : _hard.has(k) ? "schwer" : "mittel";
}
