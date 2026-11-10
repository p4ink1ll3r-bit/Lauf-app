// Texte für Datenschutz und Impressum (Einstellungen und eigene Seiten datenschutz.html / impressum.html). Nur hier ändern.
const LEGAL_STAND = "10.11.2026";
const LEGAL_NAME = "Simon Pichl - Race Hunt";
const LEGAL_ADRESSE = "c/o Autorenglück #99586<br>Albert-Einstein-Str. 47<br>02977 Hoyerswerda";
const LEGAL = {
Datenschutz: `
<h3>1. Wer ist verantwortlich?</h3>
<p>${LEGAL_NAME}<br>${LEGAL_ADRESSE}<br>Deutschland<br>E-Mail: pace.hunt@web.de<br>(Dieselben Angaben stehen im Impressum.)</p>

<h3>2. Das Wichtigste vorweg</h3>
<ul>
<li><b>Race Hunt</b> braucht kein Konto, keine Anmeldung und keine Registrierung. Du kannst die App ohne Angaben zu deiner Person nutzen.</li>
<li>Wir setzen <b>keine Cookies</b>, <b>kein Tracking</b>, <b>keine Statistik-Dienste</b> und <b>keine Werbung</b> ein.</li>
<li>Deine gemerkten Läufe, dein Startpunkt und deine Einstellungen bleiben <b>auf deinem Gerät</b>. Wir bekommen sie nicht.</li>
<li>Nur wenn du selbst eine <b>Meldung oder ein Feedback absendest</b>, gelangt der Text, den du schreibst, zu uns (siehe Punkt 8).</li>
<li>Beim Öffnen der App, bei der Wetteranzeige und beim Absenden einer Meldung verbindet sich dein Gerät mit den unten genannten Diensten. Dabei wird deine <b>IP-Adresse</b> übertragen. Das lässt sich technisch nicht vermeiden. Alle Verbindungen der App sind verschlüsselt (HTTPS).</li>
</ul>

<h3>3. Bereitstellung der App (Hosting bei GitHub Pages)</h3>
<p>Die App liegt auf GitHub Pages. Anbieter ist GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Wenn du die App aufrufst, verarbeitet GitHub technisch notwendige Daten, zum Beispiel deine IP-Adresse, Datum und Uhrzeit, die aufgerufene Datei und Angaben zu deinem Browser. GitHub kann diese Daten in sogenannten Server-Logdateien speichern. Auf diese Logdateien haben wir keinen Zugriff und keine Auswertung.</p>
<ul>
<li><b>Zweck:</b> Die App sicher und stabil ausliefern.</li>
<li><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und effizienten Betrieb).</li>
<li><b>Datenübermittlung in die USA:</b> GitHub erklärt in seiner Datenschutzerklärung, dass es nach dem EU-US Data Privacy Framework zertifiziert ist, und stützt Übermittlungen daneben auf die Standardvertragsklauseln der EU-Kommission. Verantwortlich sind laut GitHub „GitHub, Inc. oder GitHub B.V.“ (Prins Bernhardplein 200, 1097 JB Amsterdam, Niederlande).</li>
<li>Mehr dazu: <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">GitHub-Datenschutzerklärung</a></li>
</ul>

<h3>4. Daten, die auf deinem Gerät gespeichert werden</h3>
<p>Die App speichert im Browser deines Geräts (Local Storage) folgende Angaben, damit sie beim nächsten Öffnen wieder da sind:</p>
<ul>
<li>dein Startpunkt (Ort oder Koordinaten), der Umkreis und deine gewählten Strecken</li>
<li>gemerkte und als „angemeldet“ markierte Läufe und deine Häkchen in der Packliste</li>
<li>Einstellungen wie Hell/Dunkel, Startseite beim Öffnen, Erinnerungen und der zuletzt gewählte Bereich</li>
<li>welche Fristen du in der Glocke („Bald dran“) schon gesehen hast</li>
</ul>
<p>Diese Angaben verlassen dein Gerät nicht. Wir können sie nicht einsehen. Du löschst sie, indem du in den Einstellungen „Alles zurücksetzen“ wählst, die Website-Daten der App im Browser löschst oder die App entfernst.</p>
<p>Mit „Gemerkte Läufe sichern“ erzeugt die App einen Code aus diesen Angaben. Er wird nur auf deinem Gerät erzeugt und nirgends gespeichert oder gesendet. Wo du ihn ablegst, entscheidest du.</p>
<p>Die Erinnerungen („Bald dran“, Glocke) werden in der App auf deinem Gerät berechnet. Es werden keine Mitteilungen über einen Server an dein Gerät gesendet. Die Kalenderdateien (.ics) enthalten nur Angaben zum Lauf, keine Angaben zu dir.</p>
<p>Zusätzlich legt die App Dateien (Programm, Laufdaten, Ortsliste) für die Offline-Nutzung im Zwischenspeicher deines Geräts ab.</p>
<p><b>Rechtsgrundlage:</b> § 25 Abs. 2 Nr. 2 TDDDG (technisch erforderlich, damit der von dir gewünschte Dienst funktioniert).</p>

<h3>5. Standort</h3>
<p>Wenn du „Meinen Standort nutzen“ antippst, fragt dein Gerät dich um Erlaubnis. Erst dann bestimmt dein Gerät deinen Standort. Er wird <b>nur in der App auf deinem Gerät</b> verwendet, um die Entfernung zu den Läufen zu berechnen. Er wird nicht an uns oder an Dritte gesendet. Die Orts- und Postleitzahlensuche funktioniert vollständig offline mit einer in der App enthaltenen Liste.</p>
<p>Du kannst die Freigabe jederzeit in den Einstellungen deines Geräts widerrufen. Du kannst die App auch ohne Standort nutzen und stattdessen Ort oder Postleitzahl eingeben.</p>

<h3>6. Wetterdaten (Open-Meteo)</h3>
<p>Wenn du einen Lauf öffnest, ruft die App Wetterdaten für den <b>Ort des Laufs</b> von Open-Meteo (open-meteo.com) ab. Liegt der Lauf in den nächsten Tagen, ist das die Vorhersage. Liegt er weiter in der Zukunft, ruft die App stattdessen <b>Wetterdaten der letzten zehn Jahre für dieselben Tage</b> ab und zeigt daraus typische Werte. Übermittelt werden jeweils die Koordinaten des Laufortes und das Datum, <b>nicht dein Standort</b>. Dein Gerät sendet dabei technisch bedingt seine <b>IP-Adresse</b> an Open-Meteo.</p>
<ul>
<li><b>Zweck:</b> Wettervorhersage bzw. typisches Wetter am Lauftag anzeigen.</li>
<li><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. f DSGVO.</li>
<li><b>Anbieter:</b> OpenMeteo GmbH, Hintere Schilligmatte 6, 6463 Bürglen (UR), Schweiz. Die Schweiz hat einen Angemessenheitsbeschluss der EU.</li>
<li><b>Was Open-Meteo speichert:</b> Laut eigenen Angaben können bei der kostenlosen Schnittstelle technische Daten wie die IP-Adresse und die abgefragten Koordinaten in Server-Logdateien stehen. Diese werden nach 90 Tagen gelöscht.</li>
</ul>

<h3>7. Links zu anderen Diensten</h3>
<p>Die App enthält Verknüpfungen, die erst beim Antippen aktiv werden. Danach gelten die Datenschutzbestimmungen des jeweiligen Anbieters:</p>
<ul>
<li><b>Karten:</b> Google Maps, Apple Karten (Route zum Startort)</li>
<li><b>Kalender:</b> Google Kalender, Outlook (Termin und Meldeschluss eintragen). Dabei werden Name, Datum und Ort des Laufs an den Anbieter übertragen.</li>
<li><b>Teilen:</b> WhatsApp oder die Teilen-Funktion deines Geräts</li>
<li><b>Wetter:</b> meteoblue (ausführliche Vorhersage)</li>
<li><b>Veranstalter:</b> Webseiten und Anmeldeportale der Läufe</li>
</ul>
<p>Auf diese Seiten haben wir keinen Einfluss.</p>

<h3>8. Meldungen („Lauf fehlt“, „Fehler melden“)</h3>
<p>Du kannst über Formulare einen fehlenden Lauf oder einen Fehler melden oder Feedback geben. Diese Meldungen werden erst gesendet, wenn du auf „Absenden“ tippst.</p>
<ul>
<li><b>Welche Daten:</b> Nur das, was du in das Formular schreibst (zum Beispiel Name und Ort des Laufs, Datum, Link, dein Text), dazu die Art der Meldung, der betroffene Lauf und Datum und Uhrzeit. Es gibt <b>keine Pflichtangabe zu dir</b>. Gib in den Freitextfeldern bitte <b>keine persönlichen Daten</b> an (zum Beispiel Name, Telefonnummer oder E-Mail-Adresse), wir brauchen sie nicht.</li>
<li><b>Wo gespeichert:</b> In einer Datenbank beim Dienstleister <b>Supabase</b> (Server in Frankfurt am Main, EU). Dein Gerät sendet dabei technisch bedingt seine <b>IP-Adresse</b> an Supabase. Wir speichern sie nicht in unserer Meldungstabelle. Die Daten werden in der von uns gewählten Region (Frankfurt) gespeichert und dort hauptsächlich verarbeitet; Supabase und seine Unterauftragnehmer können sie in Ausnahmefällen auch anderswo verarbeiten. Vertragspartner ist Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapur 049513; Übermittlungen in Länder außerhalb der EU sichert Supabase über die EU-Standardvertragsklauseln ab. <a href="https://supabase.com/legal/customer-resources/subprocessor-list" target="_blank" rel="noopener">Liste der Unterauftragnehmer</a></li>
<li><b>Sicherung:</b> Jede Nacht kopiert eine automatische Prüfung (GitHub Actions) alle Meldungen in eine <b>nicht öffentliche</b> Sicherungsdatei bei GitHub. Sie wird nach 90 Tagen von GitHub gelöscht.</li>
<li><b>Wer sieht sie:</b> Nur wir. Es gibt keine Weitergabe, und die Meldungen sind für andere Nutzer nicht lesbar.</li>
<li><b>Zweck:</b> Läufe und Angaben in der App berichtigen oder ergänzen und die App verbessern.</li>
<li><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer korrekten App). Wer etwas einreicht, tut das freiwillig.</li>
<li><b>Wie lange:</b> Bis die Meldung bearbeitet ist, danach löschen wir sie spätestens nach 12 Monaten.</li>
</ul>

<h3>9. Kontakt per E-Mail</h3>
<p>Wenn du uns eine E-Mail schreibst (pace.hunt@web.de), verarbeiten wir deine E-Mail-Adresse, deinen Namen, falls du ihn angibst, und den Inhalt deiner Nachricht, um dir zu antworten.</p>
<ul>
<li><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, Anfragen zu beantworten).</li>
<li><b>Wo gespeichert:</b> im E-Mail-Postfach bei unserem E-Mail-Anbieter WEB.DE (1&amp;1 Mail &amp; Media GmbH, Brauerstr. 48, 76135 Karlsruhe, Deutschland).</li>
<li><b>Wie lange:</b> Wir löschen die Nachricht, wenn deine Anfrage erledigt ist und keine gesetzliche Aufbewahrungspflicht besteht.</li>
</ul>

<h3>10. Schriftarten</h3>
<p>Die verwendeten Schriften sind in die App eingebunden und werden nicht von externen Servern geladen.</p>

<h3>11. Herkunft der Laufdaten</h3>
<p>Die Angaben zu den Läufen (Termine, Preise, Fristen) stammen aus öffentlichen Laufkalendern und von den Webseiten der Veranstalter. Sie betreffen Veranstaltungen, keine Privatpersonen.</p>

<h3>12. Deine Rechte</h3>
<p>Du hast gegenüber uns das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Außer Meldungen und E-Mails, die du uns selbst schickst, speichern wir keine Daten zu dir. Schreib uns trotzdem gern an die oben genannte Adresse.</p>
<p><b>Widerspruchsrecht:</b> Soweit wir Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) verarbeiten, kannst du dieser Verarbeitung aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit widersprechen (Art. 21 DSGVO). Eine formlose Nachricht an die oben genannte E-Mail-Adresse genügt.</p>
<p>Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Für uns zuständig ist: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>.</p>

<h3>13. Keine automatisierte Entscheidung</h3>
<p>Es findet keine automatisierte Entscheidungsfindung oder Profilbildung statt.</p>

<h3>14. Änderungen</h3>
<p>Wenn sich die App ändert, zum Beispiel durch Mitteilungen aufs Handy, eine Fassung in den App-Stores, Konten oder Partnerlinks, passen wir diese Erklärung an. Es gilt die jeweils aktuelle Fassung.</p>
<p>Stand: ${LEGAL_STAND}</p>`,

Impressum: `
<h3>Angaben gemäß § 5 DDG</h3>
<p>${LEGAL_NAME}<br>${LEGAL_ADRESSE}<br>Deutschland</p>

<h3>Kontakt</h3>
<p>E-Mail: pace.hunt@web.de<br>Außerdem erreichst du uns über „Feedback geben“ in den Einstellungen der App.</p>

<h3>Angaben zu den Läufen</h3>
<p>Die Angaben zu Terminen, Preisen und Fristen stammen aus öffentlichen Laufkalendern und von den Webseiten der Veranstalter und werden regelmäßig geprüft. Trotzdem kann sich etwas geändert haben. <b>Verbindlich sind immer die Angaben des Veranstalters.</b> Für Vollständigkeit und Richtigkeit übernehmen wir keine Gewähr. Fehler bitte über „Fehler melden“ in der App oder per E-Mail an uns.</p>

<h3>Haftung für Links</h3>
<p>Die App enthält Links zu Webseiten der Veranstalter und anderer Anbieter. Auf deren Inhalte haben wir keinen Einfluss. Für die verlinkten Seiten ist der jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Wenn wir von Verstößen erfahren, entfernen wir den Link.</p>

<h3>Urheberrecht</h3>
<p>Die Inhalte der App (Texte, Gestaltung, Logo) unterliegen dem deutschen Urheberrecht. Die Laufdaten (Fakten wie Termin, Preis, Frist) sind frei; die Quelle ist beim jeweiligen Lauf verlinkt. Fotos oder Texte der Veranstalter werden nicht übernommen.</p>

<p>Stand: ${LEGAL_STAND}</p>`
};
