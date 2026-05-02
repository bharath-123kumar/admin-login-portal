from flask import Blueprint, request, jsonify, current_app
from models import db, Admin
import jwt
import datetime
from functools import wraps
import secrets

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = Admin.query.get(data['user_id'])
        except:
            return jsonify({'error': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    # Validations
    required = ['full_name', 'email', 'password', 'confirm_password']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
            
    if data['password'] != data['confirm_password']:
        return jsonify({'error': 'Passwords do not match'}), 400
        
    if len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
    if Admin.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
        
    new_admin = Admin(full_name=data['full_name'], email=data['email'])
    new_admin.set_password(data['password'])
    
    db.session.add(new_admin)
    db.session.commit()
    
    return jsonify({'message': 'Admin created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
        
    admin = Admin.query.filter_by(email=data['email']).first()
    
    if not admin or not admin.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
        
    # Generate JWT
    token = jwt.encode({
        'user_id': admin.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['JWT_SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {
            'id': admin.id,
            'full_name': admin.full_name,
            'email': admin.email
        }
    })

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
        
    admin = Admin.query.filter_by(email=email).first()
    if admin:
        token = secrets.token_urlsafe(32)
        admin.reset_token = token
        admin.reset_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        db.session.commit()
        
        # Log to console as per requirement
        print(f"\n[DEBUG] Password reset link for {email}: http://localhost:5173/reset-password?token={token}\n")
        
    # Return success regardless of whether email exists for security
    return jsonify({'message': 'If the email exists, a reset link has been generated.'})
