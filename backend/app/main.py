from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import redis
import json
import pandas as pd
import io
import shutil
import os
import re # Added for filename sanitization

from . import models, schemas, auth, database, worker
from .middleware import RBACMiddleware 

# Initialize Database Schema
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="OfficeWatch API")

# 1. REGISTER RBAC MIDDLEWARE
app.add_middleware(RBACMiddleware)

# Setup Redis
try:
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
except Exception as e:
    print(f"Warning: Redis connection failed: {e}")
    redis_client = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def invalidate_user_cache(user_id: int):
    if redis_client:
        key = f"subs_{user_id}"
        redis_client.delete(key)
        print(f"[CACHE] Invalidated key: {key}")

# --- AUTH ---
@app.post("/signup", response_model=schemas.UserOut)
def signup(user: schemas.UserCreate, role: str = "employee", db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_pw, role=role)
    db.add(new_user)
    db.commit()
    return new_user

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")
    token = auth.create_access_token(data={"sub": user.username, "role": user.role}) 
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# --- REQUESTS ---
@app.get("/requests", response_model=List[schemas.RequestOut])
def get_requests(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "admin":
        return db.query(models.Request).all()
    return db.query(models.Request).filter(models.Request.requester_id == current_user.id).all()

@app.post("/requests")
def create_request(req: schemas.RequestCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_req = models.Request(type=req.type, details=req.details, requester_id=current_user.id)
    db.add(db_req)
    db.commit()
    return db_req

@app.put("/requests/{req_id}/{action}")
def manage_request(
    req_id: int, 
    action: str, 
    note: Optional[str] = None, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    req = db.query(models.Request).filter(models.Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if action == "approve":
        req.status = "Approved"
        if req.type == 'software':
            new_sub = models.Subscription(
                name=req.details.get('name'), 
                cost=req.details.get('cost'), 
                category="Approved Request", 
                owner_id=req.requester_id,
                status="Active"
            )
            db.add(new_sub)
            invalidate_user_cache(req.requester_id)
            
    elif action == "reject":
        req.status = "Rejected"
        req.admin_note = note
        
    db.commit()
    return {"message": f"Request {action}d successfully"}

# --- SUBSCRIPTIONS ---
@app.get("/subscriptions", response_model=List[schemas.SubscriptionOut])
def get_subs(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if redis_client:
        cache_key = f"subs_{current_user.id}"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

    subs = current_user.subscriptions
    
    if redis_client:
        subs_json = []
        for s in subs:
            s_dict = {
                "id": s.id, "name": s.name, "cost": s.cost, "category": s.category,
                "status": s.status, "renewal_date": s.renewal_date.isoformat(),
                "custom_attributes": s.custom_attributes
            }
            subs_json.append(s_dict)
        redis_client.setex(cache_key, 60, json.dumps(subs_json))
    
    return subs

@app.post("/subscriptions", response_model=schemas.SubscriptionOut)
def create_sub(sub: schemas.SubscriptionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_sub = models.Subscription(**sub.dict(), owner_id=current_user.id)
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    invalidate_user_cache(current_user.id)
    return db_sub

@app.put("/subscriptions/{sub_id}", response_model=schemas.SubscriptionOut)
def update_sub(sub_id: int, sub: schemas.SubscriptionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    db_sub.name = sub.name
    db_sub.cost = sub.cost
    db_sub.category = sub.category
    if sub.renewal_date:
        db_sub.renewal_date = sub.renewal_date
    
    db.commit()
    db.refresh(db_sub)
    invalidate_user_cache(current_user.id)
    return db_sub

@app.delete("/subscriptions/{sub_id}")
def delete_sub(sub_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    db.delete(db_sub)
    db.commit()
    invalidate_user_cache(current_user.id)
    return {"message": "Deleted successfully"}

# --- INVOICE SCANNING ---
@app.post("/upload-invoice")
async def upload_invoice(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(auth.get_current_user)
):
    upload_dir = "/app/temp_uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Sanitize filename (Replace spaces/weird chars with underscores)
    safe_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)
    file_path = f"{upload_dir}/{current_user.id}_{safe_filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    task = worker.celery_app.send_task("scan_invoice", args=[file_path, current_user.id])
    
    return {"message": "Invoice uploaded. Processing started in background.", "task_id": task.id}

# --- EXPORT / CHAT ---
@app.get("/export")
def export_csv(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    subs = current_user.subscriptions
    data = [{"Name": s.name, "Cost": s.cost, "Category": s.category, "Status": s.status, "Renewal": s.renewal_date} for s in subs]
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=license_report.csv"
    return response

@app.post("/chat")
def chat_with_ai(chat_req: schemas.ChatRequest):
    prompt = chat_req.message.lower()
    if "cancel" in prompt:
        return {"response": f"To cancel {chat_req.context or 'this service'}, log in to the admin portal, go to Billing > Plan, and select 'Downgrade'. Be sure to export your data first."}
    elif "negotiate" in prompt:
        return {"response": "Template: 'Hi Team, we are reviewing our stack. We would love to stay if we can discuss a 15% discount for an annual commitment.'"}
    else:
        return {"response": "I am your OfficeWatch AI. Ask me how to cancel a tool or negotiate a contract."}