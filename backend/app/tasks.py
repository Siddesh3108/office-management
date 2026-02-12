from .worker import celery_app
from .database import SessionLocal
from .models import Subscription
import os
import re
from pypdf import PdfReader

@celery_app.task(name="scan_invoice")
def scan_invoice(file_path: str, user_id: int):
    """
    Parses a PDF invoice to detect software names and costs.
    """
    db = SessionLocal()
    print(f"--- WORKER: Processing Invoice {file_path} for User {user_id} ---")
    
    extracted_text = ""
    try:
        # Check if file exists (thanks to shared volume)
        if not os.path.exists(file_path):
            print(f"[WORKER] Error: File not found at {file_path}")
            return "File missing"

        # 1. READ PDF
        reader = PdfReader(file_path)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        
        print(f"[WORKER] Extracted {len(extracted_text)} characters.")

        # 2. PATTERN MATCHING (Shadow IT Detection)
        # Simple dictionary mapping Tool Name -> Category
        keywords = {
            "Zoom": "Communication",
            "Slack": "Communication",
            "Salesforce": "CRM",
            "GitHub": "DevTools",
            "Adobe": "Design",
            "AWS": "Cloud",
            "DigitalOcean": "Cloud",
            "Figma": "Design",
            "Notion": "Productivity"
        }
        
        found_apps = []
        
        # Regex to find currency (e.g., $14.99, $ 20.00, 15.50 USD)
        # This is a basic regex, production would use stronger patterns
        price_pattern = r'\$\s?(\d+\.\d{2})'
        
        for app_name, category in keywords.items():
            if app_name.lower() in extracted_text.lower():
                # Try to find a price nearby, or default to 0
                prices = re.findall(price_pattern, extracted_text)
                cost = 0.0
                if prices:
                    # Heuristic: Take the highest value found in the doc as the total
                    cost = max([float(p) for p in prices])
                
                found_apps.append({
                    "name": app_name, 
                    "cost": cost, 
                    "category": category
                })

        # 3. SAVE TO DB
        if not found_apps:
            return "Scan complete. No known apps detected."

        count = 0
        for app in found_apps:
            # Prevent duplicates
            exists = db.query(Subscription).filter(
                Subscription.owner_id == user_id,
                Subscription.name == app["name"]
            ).first()
            
            if not exists:
                new_sub = Subscription(
                    name=app["name"],
                    cost=app["cost"],
                    category=app["category"],
                    owner_id=user_id,
                    custom_attributes={"source": "invoice_scan", "original_file": os.path.basename(file_path)}
                )
                db.add(new_sub)
                count += 1
        
        db.commit()
        return f"Success: Added {count} new subscriptions from invoice."

    except Exception as e:
        print(f"[WORKER] Crash: {e}")
        return f"Error: {str(e)}"
    finally:
        # Cleanup: Delete the temp file
        if os.path.exists(file_path):
            os.remove(file_path)
        db.close()