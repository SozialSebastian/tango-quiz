/* Orquesta – Standard-Archiv: bekannte Aufnahmen der Época de Oro
   Jede Zeile: [Orchester, Titel, Jahr, Sänger, Art]
   Sänger: "" = instrumental, null = nicht hinterlegt. Art: tango | vals | milonga
   Neue Songs unten anhängen und ARCHIVE_VERSION erhöhen – sie kommen dann bei allen dazu,
   eigene Änderungen im Archiv bleiben erhalten. */
"use strict";

const ARCHIVE_VERSION = 1;

const ARCHIVE_DEFAULT = [
  // Juan D'Arienzo
  ["Juan D'Arienzo", "Hotel Victoria", 1935, "", "tango"],
  ["Juan D'Arienzo", "Re-fa-si", 1935, "", "tango"],
  ["Juan D'Arienzo", "Joaquina", 1935, "", "tango"],
  ["Juan D'Arienzo", "De pura cepa", 1935, null, "milonga"],
  ["Juan D'Arienzo", "Desde el alma", 1935, null, "vals"],
  ["Juan D'Arienzo", "El flete", 1936, "", "tango"],
  ["Juan D'Arienzo", "El irresistible", 1936, "", "tango"],
  ["Juan D'Arienzo", "Lágrimas y sonrisas", 1936, null, "vals"],
  ["Juan D'Arienzo", "Corazón de artista", 1936, null, "vals"],
  ["Juan D'Arienzo", "El choclo", 1937, "", "tango"],
  ["Juan D'Arienzo", "Paciencia", 1937, "Enrique Carbel", "tango"],
  ["Juan D'Arienzo", "Jueves", 1937, null, "tango"],
  ["Juan D'Arienzo", "La morocha", 1937, null, "tango"],
  ["Juan D'Arienzo", "La cumparsita", 1937, "", "tango"],
  ["Juan D'Arienzo", "Milonga vieja milonga", 1937, null, "milonga"],
  ["Juan D'Arienzo", "Valsecito de antes", 1937, null, "vals"],
  ["Juan D'Arienzo", "Indiferencia", 1938, "Alberto Echagüe", "tango"],
  ["Juan D'Arienzo", "Unión cívica", 1938, "", "tango"],
  ["Juan D'Arienzo", "Pensalo bien", 1938, "Alberto Echagüe", "tango"],
  ["Juan D'Arienzo", "Champagne tango", 1938, "", "tango"],
  ["Juan D'Arienzo", "Nada más", 1938, "Alberto Echagüe", "tango"],
  ["Juan D'Arienzo", "La bruja", 1938, "Alberto Echagüe", "tango"],
  ["Juan D'Arienzo", "El temblor", 1938, "Alberto Echagüe", "milonga"],
  ["Juan D'Arienzo", "Milonga del corazón", 1938, "Alberto Echagüe", "milonga"],
  ["Juan D'Arienzo", "Derecho viejo", 1939, "", "tango"],
  ["Juan D'Arienzo", "Tierrita", 1941, "Héctor Mauré", "tango"],
  ["Juan D'Arienzo", "Humillación", 1941, "Héctor Mauré", "tango"],
  ["Juan D'Arienzo", "Cuatro palabras", 1941, "Héctor Mauré", "vals"],
  ["Juan D'Arienzo", "El porteño", 1941, "Héctor Mauré", "milonga"],
  ["Juan D'Arienzo", "Loca", 1942, "", "tango"],
  ["Juan D'Arienzo", "Don Juan", 1950, "", "tango"],
  ["Juan D'Arienzo", "Canaro en París", 1950, "", "tango"],
  ["Juan D'Arienzo", "Nueve de julio", 1950, "", "tango"],
  ["Juan D'Arienzo", "Bien pulenta", 1950, "Alberto Echagüe", "tango"],
  ["Juan D'Arienzo", "La puñalada", 1951, "", "milonga"],
  ["Juan D'Arienzo", "El puntazo", 1952, "", "tango"],

  // Carlos Di Sarli
  ["Carlos Di Sarli", "Corazón", 1939, "Roberto Rufino", "tango"],
  ["Carlos Di Sarli", "Milonguero viejo", 1940, "", "tango"],
  ["Carlos Di Sarli", "El pollo Ricardo", 1940, "", "tango"],
  ["Carlos Di Sarli", "Junto a tu corazón", 1942, "Alberto Podestá", "tango"],
  ["Carlos Di Sarli", "Verdemar", 1943, "Roberto Rufino", "tango"],
  ["Carlos Di Sarli", "Champagne tango", 1944, "", "tango"],
  ["Carlos Di Sarli", "Tú... el cielo y tú", 1944, "Alberto Podestá", "tango"],
  ["Carlos Di Sarli", "Tinta verde", 1945, "", "tango"],
  ["Carlos Di Sarli", "A la gran muñeca", 1954, "", "tango"],
  ["Carlos Di Sarli", "Organito de la tarde", 1954, "", "tango"],
  ["Carlos Di Sarli", "El amanecer", 1954, "", "tango"],
  ["Carlos Di Sarli", "Don Juan", 1955, "", "tango"],
  ["Carlos Di Sarli", "Comme il faut", 1955, "", "tango"],
  ["Carlos Di Sarli", "El ingeniero", 1955, "", "tango"],
  ["Carlos Di Sarli", "Germaine", 1955, "", "tango"],
  ["Carlos Di Sarli", "Rodríguez Peña", 1956, "", "tango"],
  ["Carlos Di Sarli", "Nueve puntos", 1956, "", "tango"],
  ["Carlos Di Sarli", "El jagüel", 1956, "", "tango"],
  ["Carlos Di Sarli", "Viviani", 1956, "", "tango"],
  ["Carlos Di Sarli", "Bahía Blanca", 1957, "", "tango"],
  ["Carlos Di Sarli", "Indio manso", 1958, "", "tango"],

  // Osvaldo Pugliese
  ["Osvaldo Pugliese", "Mala junta", 1943, "", "tango"],
  ["Osvaldo Pugliese", "Recuerdo", 1944, "", "tango"],
  ["Osvaldo Pugliese", "Corrientes y Esmeralda", 1944, "Roberto Chanel", "tango"],
  ["Osvaldo Pugliese", "La yumba", 1946, "", "tango"],
  ["Osvaldo Pugliese", "Negracha", 1948, "", "tango"],
  ["Osvaldo Pugliese", "Malandraca", 1949, "", "tango"],
  ["Osvaldo Pugliese", "Emancipación", 1955, "", "tango"],
  ["Osvaldo Pugliese", "Gallo ciego", 1959, "", "tango"],

  // Aníbal Troilo
  ["Aníbal Troilo", "Comme il faut", 1938, "", "tango"],
  ["Aníbal Troilo", "C.T.V.", 1941, "", "tango"],
  ["Aníbal Troilo", "Toda mi vida", 1941, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Te aconsejo que me olvides", 1941, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Pájaro ciego", 1941, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "En esta tarde gris", 1941, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Barrio de tango", 1942, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Pa' que bailen los muchachos", 1942, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Uno", 1943, "Alberto Marino", "tango"],
  ["Aníbal Troilo", "Quejas de bandoneón", 1944, "", "tango"],

  // Miguel Caló
  ["Miguel Caló", "Bajo un cielo de estrellas", 1941, "Alberto Podestá", "vals"],
  ["Miguel Caló", "Al compás del corazón", 1942, "Raúl Berón", "tango"],
  ["Miguel Caló", "Jamás retornarás", 1942, "Raúl Berón", "tango"],
  ["Miguel Caló", "Qué falta que me hacés", 1943, "Raúl Iriarte", "tango"],

  // Francisco Canaro
  ["Francisco Canaro", "Milonga sentimental", 1933, "Ernesto Famá", "milonga"],
  ["Francisco Canaro", "Poema", 1935, "Roberto Maida", "tango"],
  ["Francisco Canaro", "Milonga criolla", null, "Roberto Maida", "milonga"],
  ["Francisco Canaro", "Corazón de oro", 1938, null, "vals"],
  ["Francisco Canaro", "Bajo el cielo azul", 1941, "Francisco Amor", "vals"],

  // Ricardo Tanturi
  ["Ricardo Tanturi", "Recuerdo malevo", 1941, "Alberto Castillo", "tango"],
  ["Ricardo Tanturi", "Así se baila el tango", 1942, "Alberto Castillo", "tango"],
  ["Ricardo Tanturi", "Bajo el cono azul", 1942, "Alberto Castillo", "tango"],
  ["Ricardo Tanturi", "Una emoción", 1943, "Enrique Campos", "tango"],

  // Pedro Laurenz
  ["Pedro Laurenz", "Abandono", 1937, "Héctor Farrel", "tango"],
  ["Pedro Laurenz", "Arrabal", 1937, "", "tango"],
  ["Pedro Laurenz", "Milonga de mis amores", 1937, "", "milonga"],
  ["Pedro Laurenz", "No me extraña", 1940, "Juan Carlos Casas", "tango"],

  // Lucio Demare
  ["Lucio Demare", "Malena", 1942, "Raúl Berón", "tango"],
  ["Lucio Demare", "Sorbos amargos", 1942, "Raúl Berón", "tango"],
  ["Lucio Demare", "Mañana zarpa un barco", 1942, "Juan Carlos Miranda", "tango"],

  // Ángel D'Agostino
  ["Ángel D'Agostino", "Tres esquinas", 1941, "Ángel Vargas", "tango"],
  ["Ángel D'Agostino", "Café Domínguez", 1955, "", "tango"],

  // Osvaldo Fresedo
  ["Osvaldo Fresedo", "Vida mía", 1933, "Roberto Ray", "tango"],
  ["Osvaldo Fresedo", "Arrabalero", 1939, "", "tango"],

  // Rodolfo Biagi
  ["Rodolfo Biagi", "Gólgota", 1938, "Teófilo Ibáñez", "tango"],

  // Edgardo Donato
  ["Edgardo Donato", "Carnaval de mi barrio", 1939, null, "milonga"],

  // Enrique Rodríguez
  ["Enrique Rodríguez", "Llorar por una mujer", 1941, "Armando Moreno", "tango"]
];

/* Orchester mit Suchbegriffen für Spotify und für den Playlist-Import (Namen dort sind oft lang,
   z. B. „Juan D'Arienzo y su Orquesta Típica“). */
const ORCHESTRAS = [
  { name: "Juan D'Arienzo", keys: ["arienzo"] },
  { name: "Carlos Di Sarli", keys: ["di sarli", "disarli"] },
  { name: "Osvaldo Pugliese", keys: ["pugliese"] },
  { name: "Aníbal Troilo", keys: ["troilo"] },
  { name: "Miguel Caló", keys: ["calo"] },
  { name: "Francisco Canaro", keys: ["canaro"] },
  { name: "Ricardo Tanturi", keys: ["tanturi"] },
  { name: "Pedro Laurenz", keys: ["laurenz"] },
  { name: "Lucio Demare", keys: ["demare"] },
  { name: "Ángel D'Agostino", keys: ["agostino"] },
  { name: "Osvaldo Fresedo", keys: ["fresedo"] },
  { name: "Rodolfo Biagi", keys: ["biagi"] },
  { name: "Edgardo Donato", keys: ["donato"] },
  { name: "Enrique Rodríguez", keys: ["enrique rodriguez"] },
  { name: "Alfredo De Angelis", keys: ["de angelis"] },
  { name: "Francisco Lomuto", keys: ["lomuto"] },
  { name: "Orquesta Típica Victor", keys: ["tipica victor"] },
  { name: "Juan de Dios Filiberto", keys: ["filiberto"] },
  { name: "Héctor Varela", keys: ["hector varela"] },
  { name: "José García", keys: ["jose garcia"] },
  { name: "Domingo Federico", keys: ["domingo federico"] },
  { name: "Alfredo Gobbi", keys: ["gobbi"] },
  { name: "Horacio Salgán", keys: ["salgan"] },
  { name: "Julio De Caro", keys: ["de caro"] },
  { name: "Florindo Sassone", keys: ["sassone"] },
  { name: "Juan Canaro", keys: ["juan canaro"] },
  { name: "Roberto Firpo", keys: ["firpo"] },
  { name: "Astor Piazzolla", keys: ["piazzolla"] }
];
