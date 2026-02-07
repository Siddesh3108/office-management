from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import redis
import json
import pandas as pd
import io
from . import models, schemas, auth, database, worker

# Initialize Database Schema
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="OfficeWatch API")

# Setup Redis Connection for Caching
# We use a try-except block so the app still works even if Redis is down
try:
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
except Exception as e:
    print(f"Warning: Redis connection failed: {e}")
    redis_client = None

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HELPER: CACHE INVALIDATION ---
def invalidate_user_cache(user_id: int):
    """
    Deletes the cached subscription list for a specific user.
    This ensures the user sees fresh data immediately after an update.
    """
    if redis_client:
        key = f"subs_{user_id}"
        redis_client.delete(key)
        print(f"[CACHE] Invalidated key: {key}")

# --- AUTHENTICATION ROUTES ---

@app.post("/signup", response_model=schemas.UserOut)
def signup(user: schemas.UserCreate, role: str = "employee", db: Session = Depends(database.get_db)):
    # Check if username already exists
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_pw = auth.get_password_hash(user.password)
    # Create new user with the specified role
    new_user = models.User(username=user.username, hashed_password=hashed_pw, role=role)
    db.add(new_user)
    db.commit()
    print(f"[AUTH] Created new user: {user.username} as {role}")
    return new_user

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # Debug log to verify data arrival
    print(f"[AUTH] Login attempt for user: {form_data.username}")
    
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user:
        print(f"[AUTH] Failed: User {form_data.username} not found")
        raise HTTPException(status_code=400, detail="Incorrect credentials")
        
    if not auth.verify_password(form_data.password, user.hashed_password):
        print(f"[AUTH] Failed: Password mismatch for {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect credentials")
    
    # Create JWT Token
    token = auth.create_access_token(data={"sub": user.username})
    print(f"[AUTH] Success: Token generated for {form_data.username}")
    
    # Return token along with role for frontend routing
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# --- OFFICE REQUESTS ROUTES (Approval Workflow) ---

@app.get("/requests", response_model=List[schemas.RequestOut])
def get_requests(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Logic: Admins see ALL requests. Employees see ONLY THEIR OWN.
    if current_user.role == "admin":
        return db.query(models.Request).all()
    return db.query(models.Request).filter(models.Request.requester_id == current_user.id).all()

@app.post("/requests")
def create_request(req: schemas.RequestCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_req = models.Request(
        type=req.type,
        details=req.details,
        requester_id=current_user.id
    )
    db.add(db_req)
    db.commit()
    return db_req

@app.put("/requests/{req_id}/{action}")
def manage_request(
    req_id: int, 
    action: str, 
    note: str = None, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_admin) # Security: Only Admins
):
    req = db.query(models.Request).filter(models.Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if action == "approve":
        req.status = "Approved"
        # Business Logic: Automatically add Software requests to Inventory upon approval
        if req.type == 'software':
            new_sub = models.Subscription(
                name=req.details.get('name'), 
                cost=req.details.get('cost'), 
                category="Approved Request", 
                owner_id=req.requester_id,
                status="Active"
            )
            db.add(new_sub)
            invalidate_user_cache(req.requester_id) # Update the requester's cache
            
    elif action == "reject":
        req.status = "Rejected"
        req.admin_note = note
        
    db.commit()
    return {"message": f"Request {action}d successfully"}

# --- INVENTORY / SUBSCRIPTION ROUTES (CRUD + Caching) ---

@app.get("/subscriptions", response_model=List[schemas.SubscriptionOut])
def get_subs(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # 1. Attempt to retrieve data from Redis Cache
    if redis_client:
        cache_key = f"subs_{current_user.id}"
        cached_data = redis_client.get(cache_key)
        
        if cached_data:
            print("[CACHE] HIT: Serving data from Redis")
            return json.loads(cached_data)

    # 2. Cache Miss: Retrieve from Database
    print("[CACHE] MISS: Querying Database")
    subs = current_user.subscriptions
    
    # 3. Write to Cache (Read-Through Pattern)
    if redis_client:
        subs_json = []
        for s in subs:
            s_dict = {
                "id": s.id, "name": s.name, "cost": s.cost, "category": s.category,
                "status": s.status, "renewal_date": s.renewal_date.isoformat(),
                "custom_attributes": s.custom_attributes
            }
            subs_json.append(s_dict)
            
        # Set cache with 60-second expiration
        redis_client.setex(cache_key, 60, json.dumps(subs_json))
    
    return subs

@app.post("/subscriptions", response_model=schemas.SubscriptionOut)
def create_sub(sub: schemas.SubscriptionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_sub = models.Subscription(**sub.dict(), owner_id=current_user.id)
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    invalidate_user_cache(current_user.id) # Clear cache
    return db_sub

@app.put("/subscriptions/{sub_id}", response_model=schemas.SubscriptionOut)
def update_sub(sub_id: int, sub: schemas.SubscriptionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Update fields
    db_sub.name = sub.name
    db_sub.cost = sub.cost
    db_sub.category = sub.category
    if sub.renewal_date:
        db_sub.renewal_date = sub.renewal_date
    
    db.commit()
    db.refresh(db_sub)
    invalidate_user_cache(current_user.id) # Clear cache
    return db_sub

@app.delete("/subscriptions/{sub_id}")
def delete_sub(sub_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    db.delete(db_sub)
    db.commit()
    invalidate_user_cache(current_user.id) # Clear cache
    return {"message": "Deleted successfully"}

# --- EXTRA FEATURES ---

@app.post("/scan")
def trigger_scan(current_user: models.User = Depends(auth.get_current_user)):
    # Asynchronous task dispatch
    task = worker.celery_app.send_task("scan_emails", args=[current_user.id])
    return {"message": "Scan started", "task_id": task.id}

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
    # Simulated AI logic
    prompt = chat_req.message.lower()
    if "cancel" in prompt:
        return {"response": f"To cancel {chat_req.context or 'this service'}, log in to the admin portal, go to Billing > Plan, and select 'Downgrade'. Be sure to export your data first."}
    elif "negotiate" in prompt:
        return {"response": "Template: 'Hi Team, we are reviewing our stack. We would love to stay if we can discuss a 15% discount for an annual commitment.'"}
    else:
        return {"response": "I am your OfficeWatch AI. Ask me how to cancel a tool or negotiate a contract."}