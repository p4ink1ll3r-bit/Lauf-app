# Race Hunt als iPhone-App bauen (Mac mit Xcode)

Die App selbst liegt in `app/`. Capacitor packt sie in ein iPhone-Projekt (`ios/`). Laufdaten, Teilen-Links und Kalenderdateien holt die iPhone-App von der Website (https://p4ink1ll3r-bit.github.io/Lauf-app/); ohne Netz zeigt sie die mitgelieferte Kopie.

## Einmalig auf dem Mac einrichten

1. **Node.js** installieren (LTS-Version von https://nodejs.org).
2. **Xcode** öffnen, einmal starten lassen (installiert Zusatzkomponenten), unter *Xcode → Settings → Accounts* mit der Apple-ID anmelden, die im Apple Developer Program ist.
3. **Projekt holen** im Terminal:
   ```
   git clone https://github.com/p4ink1ll3r-bit/Lauf-app.git
   cd Lauf-app
   npm install
   ```

## Jedes Mal, wenn eine neue Fassung in den Store soll

1. Im Terminal im Ordner `Lauf-app`:
   ```
   git pull
   npm run ios
   npm run ios:oeffnen
   ```
   `npm run ios` kopiert die aktuellen Laufdaten in die App und überträgt alles ins Xcode-Projekt. `npm run ios:oeffnen` öffnet Xcode.
2. In Xcode links **App** anklicken → Reiter **Signing & Capabilities** → bei *Team* dein Entwicklerkonto wählen. Die *Bundle Identifier* ist `de.racehunt.app` (nur beim ersten Mal nötig).
3. Reiter **General**: *Version* (z. B. 1.0) und *Build* (jedes Hochladen eine Zahl höher: 1, 2, 3 …) setzen.
4. Oben als Ziel **Any iOS Device (arm64)** wählen, dann Menü **Product → Archive**.
5. Wenn das Archiv fertig ist, öffnet sich der *Organizer*: **Distribute App → App Store Connect → Upload**.
6. In **App Store Connect** (https://appstoreconnect.apple.com) erscheint der Build nach etwa 15–30 Minuten unter *TestFlight*. Dort kannst du ihn auf deinem iPhone testen (App „TestFlight“), bevor du ihn zur Prüfung einreichst.

## Zum Ausprobieren ohne Hochladen

In Xcode oben ein iPhone-Simulator (z. B. „iPhone 16“) auswählen und auf ▶ klicken. Oder dein iPhone per Kabel anschließen und als Ziel wählen (beim ersten Mal auf dem iPhone unter *Einstellungen → Datenschutz → Entwicklermodus* einschalten).

## Für den Store-Eintrag (App Store Connect)

- Name: Race Hunt · Untertitel: „find your next race“
- Kategorie: Sport (zweite: Gesundheit & Fitness oder Reisen)
- Datenschutz-URL: https://p4ink1ll3r-bit.github.io/Lauf-app/datenschutz.html
- Support-URL: https://p4ink1ll3r-bit.github.io/Lauf-app/impressum.html
- App-Datenschutz („Datenschutzangaben“): keine Erfassung für Tracking; erfasst werden nur Texte, die Nutzer in Meldungen/Feedback selbst schreiben („Sonstige vom Nutzer erstellte Inhalte“, nicht mit der Person verknüpft, Zweck: App-Funktionalität)
- Händlerangaben (EU, Digital Services Act): Anschrift, Telefonnummer, E-Mail – werden öffentlich angezeigt
- Screenshots: 6,9-Zoll-iPhone (z. B. iPhone 16 Pro Max im Simulator, Cmd+S speichert ein Bildschirmfoto)
