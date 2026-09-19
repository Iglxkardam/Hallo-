import type { Vocab } from '@/types'

/**
 * Fachwortschatz — Robotics, AI and Mechatronik.
 *
 * Not part of the day-by-day course and not needed for the Goethe A1 exam. It is
 * a separate word set for the learner's own goals (Ausbildung als Mechatroniker,
 * Master in Robotics & AI). Example sentences stay at A1: present tense, verb in
 * position 2, patterns already taught (als … arbeiten, bei + Firma, in + Land).
 */
export const DOMAIN_VOCAB: Vocab[] = [
  // ── Robotics & technology ──
  { de: 'der Roboter', hi: 'रोबोट', en: 'robot', type: 'noun', gender: 'm', pl: 'die Roboter', ex: 'Der Roboter arbeitet in der Fabrik.', exHi: 'The robot works in the factory.' },
  { de: 'die Robotik', hi: 'रोबोटिक्स', en: 'robotics', type: 'noun', gender: 'f', ex: 'Ich lerne Robotik.', exHi: 'I am learning robotics.' },
  { de: 'die Maschine', hi: 'मशीन', en: 'machine', type: 'noun', gender: 'f', pl: 'die Maschinen', ex: 'Die Maschine ist neu.', exHi: 'The machine is new.' },
  { de: 'der Motor', hi: 'मोटर, इंजन', en: 'motor, engine', type: 'noun', gender: 'm', pl: 'die Motoren', ex: 'Der Roboter hat einen Motor.', exHi: 'The robot has a motor.' },
  { de: 'der Sensor', hi: 'सेंसर', en: 'sensor', type: 'noun', gender: 'm', pl: 'die Sensoren', ex: 'Der Roboter hat einen Sensor.', exHi: 'The robot has a sensor.' },
  { de: 'die Kamera', hi: 'कैमरा', en: 'camera', type: 'noun', gender: 'f', pl: 'die Kameras', ex: 'Der Roboter hat eine Kamera.', exHi: 'The robot has a camera.' },
  { de: 'die Automatisierung', hi: 'स्वचालन (ऑटोमेशन)', en: 'automation', type: 'noun', gender: 'f', ex: 'Ich lerne Automatisierung.', exHi: 'I am learning automation.' },
  { de: 'das System', hi: 'सिस्टम', en: 'system', type: 'noun', gender: 'n', pl: 'die Systeme', ex: 'Das System ist neu.', exHi: 'The system is new.' },
  { de: 'der Strom', hi: 'बिजली', en: 'electricity, current', type: 'noun', gender: 'm', pl: 'die Ströme', ex: 'Die Maschine braucht Strom.', exHi: 'The machine needs electricity.' },
  { de: 'das Werkzeug', hi: 'औज़ार', en: 'tool', type: 'noun', gender: 'n', pl: 'die Werkzeuge', ex: 'Ich brauche ein Werkzeug.', exHi: 'I need a tool.' },
  { de: 'die Werkstatt', hi: 'वर्कशॉप', en: 'workshop', type: 'noun', gender: 'f', pl: 'die Werkstätten', ex: 'Ich arbeite in der Werkstatt.', exHi: 'I work in the workshop.' },
  { de: 'die Fabrik', hi: 'फ़ैक्टरी', en: 'factory', type: 'noun', gender: 'f', pl: 'die Fabriken', ex: 'Die Fabrik ist groß.', exHi: 'The factory is big.' },
  { de: 'die Technik', hi: 'तकनीक', en: 'technology, engineering', type: 'noun', gender: 'f', ex: 'Ich lerne Technik.', exHi: 'I am learning engineering.' },
  { de: 'die Elektronik', hi: 'इलेक्ट्रॉनिक्स', en: 'electronics', type: 'noun', gender: 'f', ex: 'Ich lerne Elektronik.', exHi: 'I am learning electronics.' },
  { de: 'die Mechanik', hi: 'यांत्रिकी', en: 'mechanics', type: 'noun', gender: 'f', ex: 'Mechanik ist interessant.', exHi: 'Mechanics is interesting.' },
  { de: 'die Mechatronik', hi: 'मेकाट्रॉनिक्स', en: 'mechatronics', type: 'noun', gender: 'f', ex: 'Mechatronik ist Mechanik, Elektronik und Software.', exHi: 'Mechatronics is mechanics, electronics and software.' },

  // ── Computers & AI ──
  { de: 'das Programm', hi: 'प्रोग्राम', en: 'program', type: 'noun', gender: 'n', pl: 'die Programme', ex: 'Das Programm ist neu.', exHi: 'The program is new.' },
  { de: 'die Software', hi: 'सॉफ़्टवेयर', en: 'software', type: 'noun', gender: 'f', ex: 'Die Software ist gut.', exHi: 'The software is good.' },
  { de: 'die Daten', hi: 'डेटा', en: 'data', type: 'noun', gender: 'pl', ex: 'Der Computer hat viele Daten.', exHi: 'The computer has a lot of data.' },
  { de: 'die KI', hi: 'कृत्रिम बुद्धिमत्ता (एआई)', en: 'AI (short for künstliche Intelligenz)', type: 'noun', gender: 'f', ex: 'Die KI spricht Deutsch und Englisch.', exHi: 'The AI speaks German and English.' },
  { de: 'die Informatik', hi: 'कंप्यूटर विज्ञान', en: 'computer science', type: 'noun', gender: 'f', ex: 'Ich lerne Informatik.', exHi: 'I am learning computer science.' },
  { de: 'der Informatiker', hi: 'कंप्यूटर वैज्ञानिक', en: 'computer scientist (male)', type: 'noun', gender: 'm', pl: 'die Informatiker', forms: 'f: die Informatikerin', ex: 'Sie ist Informatikerin.', exHi: 'She is a computer scientist.' },
  { de: 'das Projekt', hi: 'प्रोजेक्ट', en: 'project', type: 'noun', gender: 'n', pl: 'die Projekte', ex: 'Wir haben ein Projekt.', exHi: 'We have a project.' },

  // ── Ausbildung, Studium, Bewerbung ──
  { de: 'die Ausbildung', hi: 'व्यावसायिक प्रशिक्षण (अप्रेंटिसशिप)', en: 'vocational training, apprenticeship', type: 'noun', gender: 'f', pl: 'die Ausbildungen', ex: 'Ich mache eine Ausbildung.', exHi: 'I am doing an apprenticeship.' },
  { de: 'der Fachinformatiker', hi: 'आईटी विशेषज्ञ (अप्रेंटिसशिप)', en: 'IT specialist (a vocational training career)', type: 'noun', gender: 'm', pl: 'die Fachinformatiker', forms: 'f: die Fachinformatikerin', ex: 'Er macht eine Ausbildung als Fachinformatiker.', exHi: 'He is doing an apprenticeship as an IT specialist.' },
  { de: 'der Mechatroniker', hi: 'मेकाट्रॉनिक्स तकनीशियन', en: 'mechatronics technician (male)', type: 'noun', gender: 'm', pl: 'die Mechatroniker', forms: 'f: die Mechatronikerin', ex: 'Er arbeitet als Mechatroniker bei Siemens.', exHi: 'He works as a mechatronics technician at Siemens.' },
  { de: 'das Praktikum', hi: 'इंटर्नशिप', en: 'internship', type: 'noun', gender: 'n', pl: 'die Praktika', ex: 'Ich mache ein Praktikum bei Siemens.', exHi: 'I am doing an internship at Siemens.' },
  { de: 'das Studium', hi: 'विश्वविद्यालय की पढ़ाई', en: 'university studies', type: 'noun', gender: 'n', ex: 'Das Studium dauert zwei Jahre.', exHi: 'The degree takes two years.' },
  { de: 'der Studiengang', hi: 'पाठ्यक्रम (डिग्री प्रोग्राम)', en: 'degree programme', type: 'noun', gender: 'm', pl: 'die Studiengänge', ex: 'Der Studiengang heißt Robotik und KI.', exHi: 'The degree programme is called Robotics and AI.' },
  { de: 'der Bachelor', hi: 'बैचलर डिग्री', en: "bachelor's degree", type: 'noun', gender: 'm', ex: 'Ich habe einen Bachelor.', exHi: "I have a bachelor's degree." },
  { de: 'der Master', hi: 'मास्टर डिग्री', en: "master's degree", type: 'noun', gender: 'm', ex: 'Ich mache einen Master in Robotik und KI.', exHi: "I am doing a master's in robotics and AI." },
  { de: 'die Bewerbung', hi: 'आवेदन', en: 'application (for a job or course)', type: 'noun', gender: 'f', pl: 'die Bewerbungen', ex: 'Ich schreibe eine Bewerbung.', exHi: 'I am writing an application.' },
  { de: 'der Lebenslauf', hi: 'सीवी, बायोडाटा', en: 'CV, résumé', type: 'noun', gender: 'm', pl: 'die Lebensläufe', ex: 'Mein Lebenslauf ist kurz.', exHi: 'My CV is short.' },

  // ── Verbs ──
  { de: 'studieren', hi: 'विश्वविद्यालय में पढ़ना', en: 'to study (at university)', type: 'verb', ex: 'Ich studiere Robotik in Deutschland.', exHi: 'I study robotics in Germany.' },
  { de: 'programmieren', hi: 'प्रोग्राम करना', en: 'to program, to code', type: 'verb', ex: 'Ich programmiere gern.', exHi: 'I like programming.' },
  { de: 'bauen', hi: 'बनाना', en: 'to build', type: 'verb', ex: 'Wir bauen einen Roboter.', exHi: 'We are building a robot.' },
  { de: 'reparieren', hi: 'मरम्मत करना', en: 'to repair', type: 'verb', ex: 'Er repariert die Maschine.', exHi: 'He repairs the machine.' },
  { de: 'entwickeln', hi: 'विकसित करना', en: 'to develop', type: 'verb', forms: 'ich entwickle · du entwickelst · er entwickelt', ex: 'Sie entwickeln eine Software.', exHi: 'They are developing software.' },
  { de: 'steuern', hi: 'नियंत्रित करना', en: 'to control, to steer', type: 'verb', ex: 'Das Programm steuert den Roboter.', exHi: 'The program controls the robot.' },
  { de: 'testen', hi: 'परीक्षण करना', en: 'to test', type: 'verb', ex: 'Wir testen das Programm.', exHi: 'We are testing the program.' },

  // ── Adjectives ──
  { de: 'technisch', hi: 'तकनीकी', en: 'technical', type: 'adj', ex: 'Mechatronik ist sehr technisch.', exHi: 'Mechatronics is very technical.' },
  { de: 'elektrisch', hi: 'इलेक्ट्रिक', en: 'electric', type: 'adj', ex: 'Der Motor ist elektrisch.', exHi: 'The motor is electric.' },
  { de: 'automatisch', hi: 'स्वचालित', en: 'automatic', type: 'adj', ex: 'Der Roboter ist automatisch.', exHi: 'The robot is automatic.' },
  { de: 'digital', hi: 'डिजिटल', en: 'digital', type: 'adj', ex: 'Das Gerät ist digital.', exHi: 'The device is digital.' },
  { de: 'intelligent', hi: 'बुद्धिमान', en: 'intelligent', type: 'adj', ex: 'Die KI ist intelligent.', exHi: 'The AI is intelligent.' },

  // ── Useful phrases for your plan ──
  { de: 'eine Ausbildung machen', hi: 'ट्रेनिंग/अप्रेंटिसशिप करना', en: 'to do an apprenticeship', type: 'phrase', ex: 'Sie macht eine Ausbildung bei Siemens.', exHi: 'She is doing an apprenticeship at Siemens.' },
  { de: 'einen Master machen', hi: 'मास्टर डिग्री करना', en: "to do a master's", type: 'phrase', ex: 'Er macht einen Master in Robotik.', exHi: "He is doing a master's in robotics." },
  { de: 'Ingenieur für Robotik', hi: 'रोबोटिक्स इंजीनियर', en: 'robotics engineer', type: 'phrase', ex: 'Sie arbeitet als Ingenieurin für Robotik.', exHi: 'She works as a robotics engineer.' },
  { de: 'als Mechatroniker arbeiten', hi: 'मेकाट्रॉनिक्स तकनीशियन के रूप में काम करना', en: 'to work as a mechatronics technician', type: 'phrase', ex: 'Ich arbeite als Mechatroniker.', exHi: 'I work as a mechatronics technician.' },
]
