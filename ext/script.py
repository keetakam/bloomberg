"""
Forex Factory Calendar Scraper
ดึงข้อมูล Economic Calendar พร้อมระดับ Impact (High/Medium/Low)
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.forexfactory.com/",
}

IMPACT_MAP = {
    "icon--ff-impact-red":    "🔴 High",
    "icon--ff-impact-ora":    "🟠 Medium",
    "icon--ff-impact-yel":    "🟡 Low",
    "icon--ff-impact-gra":    "⚪ Holiday",
}


def get_calendar(filter_impact=None):
    """
    ดึง Forex Factory Calendar
    
    filter_impact: list ของ impact ที่ต้องการ เช่น ["High", "Medium"]
                   ถ้า None = ดึงทั้งหมด
    """
    url = "https://www.forexfactory.com/calendar"
    
    try:
        res = requests.get(url, headers=HEADERS, timeout=15)
        res.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"❌ ดึงข้อมูลไม่ได้: {e}")
        return []

    soup = BeautifulSoup(res.text, "html.parser")
    rows = soup.select("tr.calendar__row")

    events = []
    current_time = ""
    current_date = ""

    for row in rows:
        # ดึงวันที่
        date_cell = row.select_one(".calendar__date")
        if date_cell and date_cell.get_text(strip=True):
            current_date = date_cell.get_text(strip=True)

        # ดึงเวลา
        time_cell = row.select_one(".calendar__time")
        if time_cell and time_cell.get_text(strip=True):
            current_time = time_cell.get_text(strip=True)

        # ดึง Impact
        impact_cell = row.select_one(".calendar__impact span")
        impact = "Unknown"
        if impact_cell:
            classes = impact_cell.get("class", [])
            for cls in classes:
                if cls in IMPACT_MAP:
                    impact = IMPACT_MAP[cls]
                    break

        # กรองตาม impact ที่ต้องการ
        if filter_impact:
            match = any(f.lower() in impact.lower() for f in filter_impact)
            if not match:
                continue

        # ดึงชื่อเหตุการณ์
        event_cell = row.select_one(".calendar__event")
        event_name = event_cell.get_text(strip=True) if event_cell else ""

        # ดึงสกุลเงิน
        currency_cell = row.select_one(".calendar__currency")
        currency = currency_cell.get_text(strip=True) if currency_cell else ""

        # ดึงค่า Actual / Forecast / Previous
        actual   = row.select_one(".calendar__actual")
        forecast = row.select_one(".calendar__forecast")
        previous = row.select_one(".calendar__previous")

        if event_name:
            events.append({
                "date":     current_date,
                "time":     current_time,
                "currency": currency,
                "impact":   impact,
                "event":    event_name,
                "actual":   actual.get_text(strip=True) if actual else "-",
                "forecast": forecast.get_text(strip=True) if forecast else "-",
                "previous": previous.get_text(strip=True) if previous else "-",
            })

    return events


def print_table(events):
    if not events:
        print("ไม่พบข้อมูล")
        return

    print(f"\n{'='*90}")
    print(f"{'วันที่':<12} {'เวลา':<8} {'สกุล':<6} {'Impact':<12} {'Event':<35} {'Actual':<8} {'Forecast':<10} {'Previous'}")
    print(f"{'='*90}")

    for e in events:
        print(f"{e['date']:<12} {e['time']:<8} {e['currency']:<6} {e['impact']:<12} {e['event'][:33]:<35} {e['actual']:<8} {e['forecast']:<10} {e['previous']}")

    print(f"{'='*90}")
    print(f"รวม {len(events)} รายการ\n")


if __name__ == "__main__":
    print("📅 กำลังดึง Forex Factory Calendar...")
    print(f"🕐 เวลาปัจจุบัน: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # ตัวอย่าง 1: ดึงเฉพาะ High Impact
    print("🔴 HIGH IMPACT EVENTS:")
    events_high = get_calendar(filter_impact=["High"])
    print_table(events_high)

    # ตัวอย่าง 2: ดึง High + Medium
    # events = get_calendar(filter_impact=["High", "Medium"])

    # ตัวอย่าง 3: ดึงทั้งหมด
    # events = get_calendar()

    # บันทึกเป็น JSON
    if events_high:
        with open("calendar_output.json", "w", encoding="utf-8") as f:
            json.dump(events_high, f, ensure_ascii=False, indent=2)
        print("💾 บันทึกไฟล์ calendar_output.json แล้ว")