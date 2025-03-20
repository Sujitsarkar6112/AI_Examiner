import bcrypt
try:
    import jwt
except ImportError:
    import PyJWT as jwt
import uuid
import datetime
import os
from functools import wraps
from flask import request, jsonify
from database import users_collection
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_EXPIRATION = int(os.getenv("JWT_EXPIRATION", 186400))  # 24 hours by default


def create_user(username, password, email, role="user"):
    """Create a new user in the database"""
    # Check if user already exists
    if users_collection.find_one({"username": username}):
        raise ValueError(f"Username {username} already exists")
    
    if users_collection.find_one({"email": email}):
        raise ValueError(f"Email {email} already exists")
    
    # Hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    # Create user document
    user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password": hashed_password.decode('utf-8'),
        "email": email,
        "role": role,
        "created_at": datetime.datetime.now(),
        "last_login": None
    }
    
    # Insert user into database
    result = users_collection.insert_one(user)
    if not result.acknowledged:
        raise Exception("Failed to create user")
    
    # Return user without password
    user.pop("password")
    return user


def create_admin_user():
    """Create the default admin user if it doesn't exist"""
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        
        return create_user(admin_username, admin_password, admin_email, role="admin")
    except ValueError as e:
        # If admin user already exists, just log it
        logger.info(f"Admin user creation: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")
        raise


def authenticate_user(username, password):
    """Authenticate a user and generate JWT token"""
    user = users_collection.find_one({"username": username})
    
    if not user:
        return None
    
    # Check password
    if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
        # Update last login time
        users_collection.update_one(
            {"username": username},
            {"$set": {"last_login": datetime.datetime.now()}}
        )
        
        # Generate JWT token - fix for PyJWT compatibility
        payload = {
            'id': user["id"],
            'username': user["username"],
            'role': user["role"],
            'exp': datetime.datetime.now() + datetime.timedelta(seconds=JWT_EXPIRATION)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        
        # Handle string vs bytes output for different PyJWT versions
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"]
            }
        }
    
    return None


def token_required(f):
    """Decorator to require JWT token for API endpoints"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in headers
        auth_header = request.headers.get('Authorization')
        logger.info(f"Authorization header: {auth_header}")
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            logger.info(f"Token extracted: {token[:10]}...")
        
        if not token:
            logger.warning("No token provided")
            return jsonify({"error": "Authentication token is missing"}), 401
        
        try:
            # Decode and validate token
            logger.info(f"Attempting to decode token with secret key: {JWT_SECRET[:5]}...")
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            logger.info(f"Token decoded successfully. User ID: {data.get('id')}")
            
            current_user = users_collection.find_one({"id": data["id"]})
            
            if not current_user:
                logger.warning(f"User not found for ID: {data.get('id')}")
                return jsonify({"error": "Invalid authentication token - user not found"}), 401
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return jsonify({"error": "Authentication token has expired"}), 401
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {str(e)}")
            return jsonify({"error": f"Invalid authentication token: {str(e)}"}), 401
        except Exception as e:
            logger.error(f"Unexpected error validating token: {str(e)}")
            return jsonify({"error": f"Authentication error: {str(e)}"}), 401
        
        # Pass the current user to the route
        return f(current_user, *args, **kwargs)
    
    return decorated


def admin_required(f):
    """Decorator to require admin role for API endpoints"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user["role"] != "admin":
            return jsonify({"error": "Admin privileges required"}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated
