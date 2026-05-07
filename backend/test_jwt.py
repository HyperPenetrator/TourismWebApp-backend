import pytest
from datetime import timedelta
import time
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError

# Import the actual functions and constants from the backend codebase
from auth import create_access_token, SECRET_KEY, ALGORITHM

# Mocking a basic token payload
VALID_PAYLOAD = {"sub": "test_artisan"}

def test_valid_token_creation_and_decoding():
    """Test that a valid token can be created and successfully decoded."""
    # Create token valid for 15 minutes
    token = create_access_token(data=VALID_PAYLOAD, expires_delta=timedelta(minutes=15))
    
    # Decode token
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    # Validate payload contents
    assert payload.get("sub") == "test_artisan"
    assert "exp" in payload

def test_expired_token():
    """Test that decoding an expired token raises the appropriate error."""
    # Create token that expired 1 second ago
    token = create_access_token(data=VALID_PAYLOAD, expires_delta=timedelta(seconds=-1))
    
    # Attempting to decode should throw an ExpiredSignatureError
    with pytest.raises(ExpiredSignatureError):
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def test_invalid_signature_token():
    """Test that a token signed with the wrong key fails validation."""
    # Create a valid token
    token = create_access_token(data=VALID_PAYLOAD, expires_delta=timedelta(minutes=15))
    
    # Attempt to decode with a wrong secret key
    WRONG_SECRET = "wrong_secret_key_12345"
    
    with pytest.raises(JWTError):
        jwt.decode(token, WRONG_SECRET, algorithms=[ALGORITHM])

def test_malformed_token():
    """Test that a completely malformed token fails validation."""
    malformed_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload"
    
    with pytest.raises(JWTError):
        jwt.decode(malformed_token, SECRET_KEY, algorithms=[ALGORITHM])
