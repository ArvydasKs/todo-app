# Užduočių tvarkyklė

Programa, leidžianti vartotojui kurti bei valdyti asmenines užduotis.

## Funkcijos

- Užduočių kūrimas, šalinimas
- Užduočių terminų, prioritetų nustatymas
- Užduočių pažymėjimas kaip atliktų
- Kategorijų kūrimas, šalinimas
- Užduočių priskyrimas kategorijoms
- Užduočių filtravimas ir rūšiavimas
- Užduočių vaizdavimas kalendoriuje
- Įspėjimų apie artėjančius terminus išsiuntimas el. paštu (nepabaigta funkcija)

## Kaip paleisti

1. Nusiklonuokite repozitoriją:

   ```bash
   git clone https://github.com/ArvydasKs/todo-app.git
   cd todo-app
   ```
   
   Patikrinkite, ar esate develop šakoje.
   
   ```bash
   git branch
   git checkout develop
   ```

2. Paleiskite programą konteineryje per Docker Desktop:

   ```bash
   docker-compose up --build
   ```

   Naujesnėse Docker versijose galima naudoti ir:

   ```bash
   docker compose up --build
   ```

3. Kai konteineriai pasileis, atidarykite programą naršyklėje:

   ```
   http://localhost:8000
   ```

## Sustabdymas

- Sustabdyti programą: `Ctrl + C` terminale, kuriame ji veikia.
- Sustabdyti ir pašalinti konteinerius:

  ```bash
  docker-compose down
  ```
