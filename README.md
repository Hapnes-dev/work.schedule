# 📅 Work Schedule to ICS Converter

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fhapnes-dev.github.io%2Fwork.schedule%2F&label=Live%20Demo&logo=google-chrome&logoColor=white)](https://hapnes-dev.github.io/work.schedule/) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Convert your work schedule into a calendar file (`.ics`) you can import into Google Calendar, Outlook or Apple Calendar.  

---

## ✨ Features
- Paste your duty list in table format  
- Specify the person in charge (“Vaktansvarlig”)  
- Generate `.ics` calendar file in browser  
- Reads 12-hour times exported without AM/PM (`03:00_11:15` is 15:00-23:15) and shows every shift for checking before download  
- Supports overnight shifts (end time past midnight)  

---

## 🚀 How to Use

1. Visit the site: https://hapnes-dev.github.io/work.schedule/  
2. Enter “Person Name (Vaktansvarlig)”  
3. Paste your schedule data  
4. Check the times in the list that appears; a yellow row needs your choice  
5. Click **Generate ICS Calendar File**  
6. Download and import into your calendar app  

---

## 📋 Example Input

```bash
No	Date	Work Time	Location
1	05.08.2025	06:30-14:00	0092 Extra Grilstad
2	06.08.2025	13:00-20:00	0092 Extra Grilstad
3	07.08.2025	08:00-15:00	0092 Extra Grilstad
```


