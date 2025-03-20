"""
MongoDB database connection and utility functions
"""
import os
import logging
from dotenv import load_dotenv
from pymongo import MongoClient, errors
import uuid
from datetime import datetime
import bcrypt

# Setup logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a console handler
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
logger.addHandler(handler)

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://sarkarsujit9052:Amazing1@productioncluster.gbf9m.mongodb.net/")
# If no connection string is provided, use a local MongoDB instance
if not MONGO_URI:
    MONGO_URI = "mongodb://localhost:27017"

DB_NAME = os.getenv("DB_NAME", "LMS_APP")

# Global variables to hold database and collection references
db = None
client = None

# Collections (will be properly initialized in init_db)
users_collection = None
extracted_texts_collection = None
question_papers_collection = None
evaluations_collection = None

# Simple password hashing function to avoid circular imports
def hash_password(password):
    """Hash a password for storing"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(stored_password, provided_password):
    """Verify a stored password against one provided by user"""
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))

def init_db():
    """Initialize database connection and collection references"""
    global client, db
    global users_collection, extracted_texts_collection, question_papers_collection, evaluations_collection
    
    logger.info(f"Attempting to connect to MongoDB at: {MONGO_URI}")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test connection by getting server info
        client.admin.command('ping')
        
        # Connection successful, set up collections
        db = client[DB_NAME]
        
        users_collection = db.users
        extracted_texts_collection = db.extracted_texts
        question_papers_collection = db.question_papers
        evaluations_collection = db.evaluations
        
        # Create indexes
        try:
            users_collection.create_index("username", unique=True)
            users_collection.create_index("email", unique=True)
        except Exception as index_error:
            logger.error(f"Failed to create indexes: {str(index_error)}")
        
        logger.info("Successfully connected to MongoDB")
            
    except (errors.ServerSelectionTimeoutError, errors.ConnectionFailure) as e:
        logger.error(f"MongoDB connection error: {str(e)}")
        raise Exception("MongoDB server not available. Please ensure MongoDB is running and accessible.")
    except errors.OperationFailure as e:
        # Log the error and re-raise it
        if "auth" in str(e).lower():
            logger.error(f"MongoDB authentication error: {str(e)}")
        else:
            logger.error(f"MongoDB operation failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        raise
