import os
import requests
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# ==================== CONFIG ====================
CONFIG = {
    "exchanges": ["NYSE", "NASDAQ", "AMEX"],
    "output_dir": "./data",
    "latest_output": "../ext/nasdaq_all_latest.csv",  # อ่านโดย lib/nasdaq-sectors.ts
    "keep_days": 30,
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ==================== HELPERS ====================

def get_date_str() -> str:
    return datetime.today().strftime("%Y-%m-%d")

def ensure_dir(directory: str) -> None:
    Path(directory).mkdir(parents=True, exist_ok=True)
    print(f"📁 Output dir: {directory}")

def clean_old_files(directory: str, keep_days: int) -> None:
    cutoff = datetime.now() - timedelta(days=keep_days)
    for file in Path(directory).glob("*.csv"):
        if datetime.fromtimestamp(file.stat().st_mtime) < cutoff:
            file.unlink()
            print(f"🗑️  Deleted old file: {file.name}")

# ==================== CORE FUNCTIONS ====================

def download_nasdaq_csv(exchange: str, output_dir: str) -> str | None:
    date = get_date_str()
    filename = f"nasdaq_{exchange.lower()}_{date}.csv"
    filepath = os.path.join(output_dir, filename)

    # ถ้าโหลดวันนี้แล้ว ข้ามได้เลย
    if os.path.exists(filepath):
        print(f"✅ Already downloaded today: {filename}")
        return filepath

    url = (
        f"https://api.nasdaq.com/api/screener/stocks"
        f"?tableonly=true&exchange={exchange}&download=true"
    )

    print(f"⬇️  Downloading {exchange}...")
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()

        # Nasdaq API ส่งกลับ JSON ที่มี CSV ข้างใน
        data = response.json()
        rows = data.get("data", {}).get("rows", [])
        headers_list = data.get("data", {}).get("headers", {})

        if not rows:
            print(f"⚠️  No data for {exchange}")
            return None

        df = pd.DataFrame(rows)
        df.to_csv(filepath, index=False)
        print(f"✅ Saved: {filename} ({len(df)} stocks)")
        return filepath

    except requests.RequestException as e:
        print(f"❌ Failed to download {exchange}: {e}")
        return None
    except Exception as e:
        print(f"❌ Error processing {exchange}: {e}")
        return None


def merge_files(files: list[str]) -> pd.DataFrame:
    dfs = []
    for file in files:
        try:
            df = pd.read_csv(file)
            dfs.append(df)
        except Exception as e:
            print(f"⚠️  Could not read {file}: {e}")

    if not dfs:
        return pd.DataFrame()

    merged = pd.concat(dfs, ignore_index=True)

    # ลบ duplicate
    if "symbol" in merged.columns:
        merged = merged.drop_duplicates(subset="symbol")

    print(f"🔀 Merged: {len(merged)} total stocks")
    return merged


def filter_stocks(
    df: pd.DataFrame,
    sector: str | None = None,
    min_market_cap: float | None = None,
    country: str | None = None,
) -> pd.DataFrame:
    result = df.copy()

    if sector and "sector" in result.columns:
        result = result[result["sector"].str.lower() == sector.lower()]

    if min_market_cap and "marketCap" in result.columns:
        result["marketCap"] = pd.to_numeric(result["marketCap"], errors="coerce")
        result = result[result["marketCap"] >= min_market_cap]

    if country and "country" in result.columns:
        result = result[result["country"].str.lower() == country.lower()]

    return result


def save_csv(df: pd.DataFrame, filename: str, output_dir: str) -> str:
    if df.empty:
        print("⚠️  No records to save")
        return ""
    filepath = os.path.join(output_dir, filename)
    df.to_csv(filepath, index=False)
    print(f"💾 Saved: {filename} ({len(df)} stocks)")
    return filepath


def print_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No data to summarize")
        return

    print("\n📊 Summary:")
    print(f"   Total stocks: {len(df)}")

    if "sector" in df.columns:
        print("\n   By Sector:")
        sector_counts = df["sector"].value_counts()
        for sector, count in sector_counts.items():
            print(f"     {str(sector):<30} {count}")

    if "marketCap" in df.columns:
        df["marketCap"] = pd.to_numeric(df["marketCap"], errors="coerce")
        with_cap = df["marketCap"].notna().sum()
        print(f"\n   With market cap data: {with_cap}")


# ==================== MAIN ====================

def main():
    print("🚀 Nasdaq Stock Downloader (Python)")
    print(f"📅 Date: {get_date_str()}\n")

    ensure_dir(CONFIG["output_dir"])

    # 1. Download ทุก Exchange
    downloaded_files = []
    for exchange in CONFIG["exchanges"]:
        filepath = download_nasdaq_csv(exchange, CONFIG["output_dir"])
        if filepath:
            downloaded_files.append(filepath)

    if not downloaded_files:
        print("❌ No files downloaded")
        return

    # 2. Merge ทั้งหมด
    print("\n🔀 Merging all exchanges...")
    all_stocks = merge_files(downloaded_files)
    save_csv(all_stocks, f"all_stocks_{get_date_str()}.csv", CONFIG["output_dir"])

    # บันทึก latest สำหรับ Next.js app
    if not all_stocks.empty:
        all_stocks.to_csv(CONFIG["latest_output"], index=False)
        print(f"✅ Updated: {CONFIG['latest_output']} ({len(all_stocks)} stocks)")

    # 3. กรอง Technology
    print("\n🔍 Filtering: Technology sector...")
    tech_stocks = filter_stocks(all_stocks, sector="Technology", min_market_cap=1_000_000_000)
    save_csv(tech_stocks, f"tech_largecap_{get_date_str()}.csv", CONFIG["output_dir"])

    # 4. สรุป
    print_summary(all_stocks)

    # 5. ลบไฟล์เก่า
    print("\n🧹 Cleaning old files...")
    clean_old_files(CONFIG["output_dir"], CONFIG["keep_days"])

    print("\n✅ Done!")


if __name__ == "__main__":
    main()