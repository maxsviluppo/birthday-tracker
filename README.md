# 🎂 Birthday Tracker

Una web app moderna e bellissima per non dimenticare mai i compleanni delle persone care! Con grafica 3D, animazioni fluide e calcolo automatico dell'età.

![Birthday Tracker](https://img.shields.io/badge/Status-Live-success)
![Supabase](https://img.shields.io/badge/Database-Supabase-green)

## ✨ Caratteristiche

- 🎨 **Design 3D Spettacolare** - Card con effetti 3D, glassmorphism e animazioni fluide
- 🎉 **Particelle Animate** - Coriandoli e blob animati sullo sfondo
- 📅 **Gestione Completa** - Aggiungi, modifica ed elimina compleanni
- 🎯 **Calcolo Automatico**:
  - Età attuale della persona
  - Prossima età (quanti anni farà)
  - Giorni mancanti al compleanno
- ⭐ **Highlight Speciali**:
  - Glow dorato per compleanni entro 7 giorni
  - Animazione speciale per compleanni di oggi
- 📊 **Ordinamento Smart** - Lista ordinata per compleanni più vicini
- 🔐 **Autenticazione Sicura** - Login/Signup con Supabase
- 📱 **Responsive** - Funziona perfettamente su tutti i dispositivi

## 🚀 Demo Live

**[Prova l'app qui →](https://tuousername.github.io/birthday-tracker/)**

## 🛠️ Tecnologie

- **Frontend**: HTML5, CSS3 (3D Transforms), JavaScript ES6+
- **Database**: Supabase (PostgreSQL)
- **Autenticazione**: Supabase Auth
- **Hosting**: GitHub Pages
- **Font**: Poppins (Google Fonts)
- **Icons**: Font Awesome 6

## 📦 Setup Locale

1. **Clona il repository**
   ```bash
   git clone https://github.com/tuousername/birthday-tracker.git
   cd birthday-tracker
   ```

2. **Configura Supabase**
   - Vai su [supabase.com](https://supabase.com) e accedi
   - Usa il progetto esistente o creane uno nuovo
   - Esegui l'SQL per creare la tabella (vedi sotto)
   - Aggiorna `supabase-config.js` con le tue credenziali

3. **Apri l'app**
   ```bash
   # Apri index.html nel browser
   # Oppure usa un server locale
   npx serve
   ```

## 🗄️ Setup Database

Esegui questo SQL nel **SQL Editor** di Supabase:

```sql
-- Crea la tabella birthdays
CREATE TABLE birthdays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Abilita Row Level Security
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo i propri compleanni
CREATE POLICY "Users can view their own birthdays"
  ON birthdays FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire solo i propri compleanni
CREATE POLICY "Users can insert their own birthdays"
  ON birthdays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare solo i propri compleanni
CREATE POLICY "Users can update their own birthdays"
  ON birthdays FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare solo i propri compleanni
CREATE POLICY "Users can delete their own birthdays"
  ON birthdays FOR DELETE
  USING (auth.uid() = user_id);

-- Indice per performance
CREATE INDEX idx_birthdays_user_id ON birthdays(user_id);
```

## 🎨 Features Speciali

### Calcoli Automatici
- **Età Attuale**: Calcolo preciso considerando mese e giorno
- **Prossima Età**: Età che la persona farà al prossimo compleanno
- **Countdown**: Giorni mancanti al prossimo compleanno
- **Ordinamento**: Lista ordinata per compleanni più vicini

### Effetti Visivi 3D
- **Card 3D**: Effetto hover con rotazione e elevazione
- **Glassmorphism**: Sfondo sfocato con trasparenza
- **Glow Effects**: Bagliori colorati su hover
- **Particelle**: Coriandoli animati sullo sfondo
- **Gradient Animati**: Blob colorati in movimento
- **Smooth Transitions**: Animazioni fluide su ogni interazione

### Stati Speciali
- 🎉 **Compleanno Oggi**: Animazione celebrativa
- ⭐ **Prossimi 7 Giorni**: Glow dorato
- 📅 **Altri**: Design standard elegante

## 📱 Come Usare

1. **Registrati** con email e password
2. **Aggiungi compleanni** inserendo nome e data di nascita
3. **Visualizza** età attuale, prossima età e giorni mancanti
4. **Modifica** compleanni esistenti cliccando "Modifica"
5. **Elimina** compleanni non più necessari

## 🎯 Personalizzazione

Modifica le variabili CSS in `style.css`:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #ff6b9d 0%, #c471ed 100%);
    --secondary-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --gold: #ffd700;
    /* ... altre variabili */
}
```

## 📄 Licenza

MIT License - Usa liberamente!

## 🤝 Contributi

Pull request benvenute! Per modifiche importanti, apri prima un issue.

---

⭐ Se ti piace questo progetto, lascia una stella su GitHub!
