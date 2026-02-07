from .worker import celery_app
from .database import SessionLocal
from .models import Subscription
import time
import random

@celery_app.task(name="scan_emails")
def scan_emails(user_id: int):
    """
    Simulates a background scan finding new apps.
    """
    db = SessionLocal()
    print(f"--- WORKER: Scanning for User {user_id} ---")
    time.sleep(3) 
    
    detected_apps = [
        {"name": "Salesforce", "cost": 150.00, "cat": "CRM"},
        {"name": "Zoom Pro", "cost": 14.99, "cat": "Communication"},
        {"name": "GitHub Copilot", "cost": 10.00, "cat": "DevTools"},
        {"name": "Linear", "cost": 8.00, "cat": "Project Mgmt"}
    ]
    
    app_data = random.choice(detected_apps)
    
    # Check duplicate
    exists = db.query(Subscription).filter(
        Subscription.owner_id == user_id, 
        Subscription.name == app_data["name"]
    ).first()
    
    if not exists:
        new_sub = Subscription(
            name=app_data["name"],
            cost=app_data["cost"],
            category=app_data["cat"],
            owner_id=user_id,
            # NEW: Forecast Logic - Add random 5% increase prediction
            custom_attributes={"forecast_increase": 1.05} 
        )
        db.add(new_sub)
        db.commit()
        return f"Found {app_data['name']}"
    
    db.close()
    return "No new apps found."