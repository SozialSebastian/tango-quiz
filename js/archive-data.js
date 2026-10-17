/* Orquesta – Standard-Archiv: bekannte Aufnahmen der Época de Oro
   Jede Zeile: [Orchester, Titel, Jahr, Sänger, Art]
   Sänger: "" = instrumental, null = nicht hinterlegt. Art: tango | vals | milonga
   Neue Songs unten anhängen und ARCHIVE_VERSION erhöhen – sie kommen dann bei allen dazu,
   eigene Änderungen im Archiv bleiben erhalten. */
"use strict";

const ARCHIVE_VERSION = 3;

// Einträge früherer Archiv-Stände, die durch korrigierte ersetzt wurden (alte ID → neue Zeile mit Jahr)
const ARCHIVE_REPLACED = ["rodolfo-biagi-racing-club", "rodolfo-biagi-union-civica", "rodolfo-biagi-lagrimas-y-sonrisas", "rodolfo-biagi-campo-afuera", "rodolfo-biagi-paloma"];

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
  ["Enrique Rodríguez", "Llorar por una mujer", 1941, "Armando Moreno", "tango"],
  /* ===== Ergänzung (Archiv-Stand 2): weitere bekannte Aufnahmen ===== */
  // Juan D'Arienzo (Daten aus der D'Arienzo-Diskografie)
  ["Juan D'Arienzo", "Pabellón de las rosas", 1935, null, "vals"],
  ["Juan D'Arienzo", "Orillas del Plata", 1935, null, "vals"],
  ["Juan D'Arienzo", "Una lágrima", 1936, null, "vals"],
  ["Juan D'Arienzo", "Visión celeste", 1936, null, "vals"],
  ["Juan D'Arienzo", "Silueta porteña", 1936, "Walter Cabral", "milonga"],
  ["Juan D'Arienzo", "Mentías", 1937, null, "vals"],
  ["Juan D'Arienzo", "Valsecito criollo", 1937, null, "vals"],
  ["Juan D'Arienzo", "No mientas", 1938, "Alberto Echagüe", "tango"],
  ["Juan D'Arienzo", "Milonga querida", 1938, "Alberto Echagüe", "milonga"],
  ["Juan D'Arienzo", "Estampa de varón", 1938, "Alberto Echagüe", "milonga"],
  ["Juan D'Arienzo", "Felicia", 1939, "", "tango"],
  ["Juan D'Arienzo", "El Marne", 1939, "", "tango"],
  ["Juan D'Arienzo", "Castigo", 1939, "Alberto Echagüe", "vals"],
  ["Juan D'Arienzo", "Ay Aurora", 1939, "Alberto Echagüe", "vals"],
  ["Juan D'Arienzo", "Meta fierro", 1939, "Alberto Echagüe", "milonga"],
  ["Juan D'Arienzo", "De antaño", 1939, "Alberto Echagüe", "milonga"],
  ["Juan D'Arienzo", "La cicatriz", 1939, "Alberto Echagüe", "milonga"],
  ["Juan D'Arienzo", "Salí de perdedor", 1940, "Alberto Reynal", "milonga"],
  ["Juan D'Arienzo", "Flor del mal", 1940, "Héctor Mauré", "vals"],
  ["Juan D'Arienzo", "Adiós querida", 1941, "Héctor Mauré", "vals"],
  ["Juan D'Arienzo", "El vals de los abuelos", 1941, "Héctor Mauré", "vals"],
  ["Juan D'Arienzo", "Tirando a matar", 1942, "Héctor Mauré", "milonga"],
  ["Juan D'Arienzo", "Cortada de San Ignacio", 1942, "Héctor Mauré", "milonga"],
  ["Juan D'Arienzo", "Tu pañuelo", 1942, "Héctor Mauré", "vals"],
  ["Juan D'Arienzo", "Pampa", 1951, "", "tango"],
  ["Juan D'Arienzo", "Independencia", null, "", "tango"],
  ["Juan D'Arienzo", "El internado", null, "", "tango"],
  ["Juan D'Arienzo", "El entrerriano", null, "", "tango"],

  // Carlos Di Sarli
  ["Carlos Di Sarli", "Mi refugio", 1941, "", "tango"],
  ["Carlos Di Sarli", "Tierra negra", 1943, "", "tango"],
  ["Carlos Di Sarli", "Ojos negros", 1945, "", "tango"],
  ["Carlos Di Sarli", "El caburé", 1946, "", "tango"],
  ["Carlos Di Sarli", "El pollito", 1947, "", "tango"],
  ["Carlos Di Sarli", "El once", 1954, "", "tango"],
  ["Carlos Di Sarli", "La cumparsita", 1955, "", "tango"],
  ["Carlos Di Sarli", "Cascabelito", null, "Roberto Rufino", "tango"],
  ["Carlos Di Sarli", "Charlemos", null, "Roberto Rufino", "tango"],
  ["Carlos Di Sarli", "Griseta", null, "Roberto Rufino", "tango"],
  ["Carlos Di Sarli", "Rosamel", null, "Roberto Rufino", "vals"],
  ["Carlos Di Sarli", "Alma mía", null, "Roberto Rufino", "vals"],
  ["Carlos Di Sarli", "Pena mulata", null, "Roberto Rufino", "milonga"],
  ["Carlos Di Sarli", "La capilla blanca", null, "Alberto Podestá", "tango"],
  ["Carlos Di Sarli", "Nada", null, "Alberto Podestá", "tango"],
  ["Carlos Di Sarli", "Porteño y bailarín", null, "Jorge Durán", "tango"],
  ["Carlos Di Sarli", "Patotero sentimental", null, "Mario Pomar", "tango"],

  // Osvaldo Pugliese
  ["Osvaldo Pugliese", "Farol", null, "Roberto Chanel", "tango"],
  ["Osvaldo Pugliese", "La beba", null, "", "tango"],
  ["Osvaldo Pugliese", "La rayuela", null, "", "tango"],
  ["Osvaldo Pugliese", "El rodeo", null, "", "tango"],
  ["Osvaldo Pugliese", "Pata ancha", null, "", "tango"],
  ["Osvaldo Pugliese", "Desde el alma", null, "", "vals"],
  ["Osvaldo Pugliese", "Nochero soy", null, "Alberto Morán", "tango"],
  ["Osvaldo Pugliese", "Remembranza", null, "Alberto Morán", "tango"],

  // Aníbal Troilo
  ["Aníbal Troilo", "Yo soy el tango", 1941, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Tinta roja", 1941, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Malena", 1942, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Gricel", 1942, "Francisco Fiorentino", "tango"],
  ["Aníbal Troilo", "Cachirulo", null, "", "tango"],
  ["Aníbal Troilo", "Romance de barrio", 1947, "Floreal Ruiz", "vals"],

  // Miguel Caló
  ["Miguel Caló", "Yo soy el tango", null, "Alberto Podestá", "tango"],
  ["Miguel Caló", "Lejos de Buenos Aires", null, "Raúl Berón", "tango"],
  ["Miguel Caló", "Trasnochando", null, "Raúl Berón", "tango"],
  ["Miguel Caló", "Dos fracasos", null, "Raúl Iriarte", "tango"],
  ["Miguel Caló", "Flor de lino", null, "Raúl Iriarte", "vals"],

  // Francisco Canaro
  ["Francisco Canaro", "Desde el alma", null, "Nelly Omar", "vals"],
  ["Francisco Canaro", "El llorón", null, "Ernesto Famá", "milonga"],
  ["Francisco Canaro", "Parque Patricios", null, "Ernesto Famá", "milonga"],
  ["Francisco Canaro", "Reliquias porteñas", null, "", "milonga"],
  ["Francisco Canaro", "Milonga de mis amores", null, "Roberto Maida", "milonga"],
  ["Francisco Canaro", "Retintín", null, "Roberto Maida", "vals"],

  // Ricardo Tanturi
  ["Ricardo Tanturi", "Pocas palabras", null, "Alberto Castillo", "tango"],
  ["Ricardo Tanturi", "La vida es corta", null, "Alberto Castillo", "tango"],
  ["Ricardo Tanturi", "Cuatro compases", null, "Alberto Castillo", "tango"],
  ["Ricardo Tanturi", "Oigo tu voz", null, "Enrique Campos", "tango"],
  ["Ricardo Tanturi", "Encuentro", null, "Enrique Campos", "tango"],

  // Pedro Laurenz
  ["Pedro Laurenz", "Desconsuelo", null, "Juan Carlos Casas", "tango"],
  ["Pedro Laurenz", "Orgullo criollo", null, "", "tango"],
  ["Pedro Laurenz", "Garúa", null, "Alberto Podestá", "tango"],
  ["Pedro Laurenz", "Paisaje", null, "Alberto Podestá", "vals"],

  // Ángel D'Agostino
  ["Ángel D'Agostino", "No aflojés", null, "Ángel Vargas", "tango"],
  ["Ángel D'Agostino", "Muchacho", null, "Ángel Vargas", "tango"],

  // Rodolfo Biagi (Archiv-Stand 3, Daten aus Biagi-Diskografien)
  ["Rodolfo Biagi", "Unión cívica", 1938, "", "tango"],
  ["Rodolfo Biagi", "El incendio", 1938, "", "tango"],
  ["Rodolfo Biagi", "Una pena", 1938, "Teófilo Ibáñez", "tango"],
  ["Rodolfo Biagi", "Lejos de ti", 1938, "Teófilo Ibáñez", "vals"],
  ["Rodolfo Biagi", "Loca de amor", 1938, "Teófilo Ibáñez", "vals"],
  ["Rodolfo Biagi", "Viejo portón", 1938, null, "vals"],
  ["Rodolfo Biagi", "Campo afuera", 1939, "Teófilo Ibáñez", "milonga"],
  ["Rodolfo Biagi", "Pura clase", 1939, "", "tango"],
  ["Rodolfo Biagi", "La maleva", 1939, "", "tango"],
  ["Rodolfo Biagi", "Alma de bohemio", 1939, "Teófilo Ibáñez", "tango"],
  ["Rodolfo Biagi", "Son cosas del bandoneón", 1939, "Andrés Falgás", "tango"],
  ["Rodolfo Biagi", "Queja indiana", 1939, "Andrés Falgás", "tango"],
  ["Rodolfo Biagi", "Dichas que viví", 1939, "Andrés Falgás", "vals"],
  ["Rodolfo Biagi", "A mí no me interesa", 1940, "Andrés Falgás", "tango"],
  ["Rodolfo Biagi", "Cicatrices", 1940, "Andrés Falgás", "tango"],
  ["Rodolfo Biagi", "El estribo", 1940, "", "tango"],
  ["Rodolfo Biagi", "Todo te nombra", 1940, "Jorge Ortiz", "tango"],
  ["Rodolfo Biagi", "Por un beso de amor", 1940, "Jorge Ortiz", "vals"],
  ["Rodolfo Biagi", "Humillación", 1941, "Jorge Ortiz", "tango"],
  ["Rodolfo Biagi", "Pájaro ciego", 1941, "Jorge Ortiz", "tango"],
  ["Rodolfo Biagi", "Zaraza", 1941, "Jorge Ortiz", "tango"],
  ["Rodolfo Biagi", "Quejas de bandoneón", 1941, "", "tango"],
  ["Rodolfo Biagi", "Didi", 1941, "", "tango"],
  ["Rodolfo Biagi", "El entrerriano", 1941, "", "tango"],
  ["Rodolfo Biagi", "Lágrimas y sonrisas", 1941, "", "vals"],
  ["Rodolfo Biagi", "Cuatro palabras", 1941, "Jorge Ortiz", "vals"],
  ["Rodolfo Biagi", "Marcheta", 1941, "", "vals"],
  ["Rodolfo Biagi", "Picante", 1941, "", "milonga"],
  ["Rodolfo Biagi", "Bélgica", 1942, "", "tango"],
  ["Rodolfo Biagi", "Indiferencia", 1942, "Jorge Ortiz", "tango"],
  ["Rodolfo Biagi", "Amor y vals", 1942, "Alberto Lago", "vals"],
  ["Rodolfo Biagi", "Magdala", 1945, "Jorge Ortiz", "tango"],
  ["Rodolfo Biagi", "Tus labios me dirán", 1945, "Alberto Amor", "tango"],
  ["Rodolfo Biagi", "Paloma", 1945, "Alberto Amor", "vals"],
  ["Rodolfo Biagi", "Flor de Monserrat", 1945, "Alberto Amor", "milonga"],
  ["Rodolfo Biagi", "Racing Club", 1950, "", "tango"],

  // Alfredo De Angelis
  ["Alfredo De Angelis", "Pavadita", null, "", "tango"],
  ["Alfredo De Angelis", "Pregonera", null, "Carlos Dante", "tango"],

  // Osvaldo Fresedo
  ["Osvaldo Fresedo", "Sollozos", null, "Roberto Ray", "tango"],

  // Enrique Rodríguez
  ["Enrique Rodríguez", "Cómo has cambiado pebeta", null, "Armando Moreno", "tango"],

  // Orquesta Típica Victor
  ["Orquesta Típica Victor", "Pato", null, "", "tango"],
  ["Orquesta Típica Victor", "Puente Alsina", null, "", "tango"]
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
