from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from models import db, Admin, Opportunity
from werkzeug.security import generate_password_hash
import secrets

auth_bp = Blueprint('auth', __name__)
opportunity_bp = Blueprint('opportunity', __name__)
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('admin.html')

# --- Authentication Routes ---

@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    if not all([full_name, email, password, confirm_password]):
        return jsonify({'error': 'All fields are required'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    if Admin.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    new_admin = Admin(full_name=full_name, email=email)
    new_admin.set_password(password)
    db.session.add(new_admin)
    db.session.commit()

    return jsonify({'message': 'Account created successfully'}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    remember = data.get('remember', False)

    admin = Admin.query.filter_by(email=email).first()

    if not admin or not admin.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    login_user(admin, remember=remember)
    return jsonify({'message': 'Login successful', 'user': {'full_name': admin.full_name, 'email': admin.email}}), 200

@auth_bp.route('/api/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    # US-1.3: Always return success message
    admin = Admin.query.filter_by(email=email).first()
    if admin:
        token = secrets.token_urlsafe(32)
        # In a real app, save token and send email. Here we just log it.
        print(f"DEBUG: Password reset link for {email}: http://localhost:5000/reset-password/{token}")
    
    return jsonify({'message': 'If your email is registered, a reset link has been sent.'}), 200

# --- Opportunity Management Routes ---

@opportunity_bp.route('/api/opportunities', methods=['GET'])
@login_required
def get_opportunities():
    opportunities = Opportunity.query.filter_by(admin_id=current_user.id).all()
    return jsonify([op.to_dict() for op in opportunities]), 200

@opportunity_bp.route('/api/opportunities', methods=['POST'])
@login_required
def create_opportunity():
    data = request.get_json()
    required_fields = ['name', 'duration', 'start_date', 'description', 'skills', 'category', 'future_opportunities']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Field {field} is required'}), 400

    new_op = Opportunity(
        name=data['name'],
        duration=data['duration'],
        start_date=data['start_date'],
        description=data['description'],
        skills=data['skills'],
        category=data['category'],
        future_opportunities=data['future_opportunities'],
        max_applicants=data.get('max_applicants'),
        admin_id=current_user.id
    )
    
    db.session.add(new_op)
    db.session.commit()
    
    return jsonify(new_op.to_dict()), 201

@opportunity_bp.route('/api/opportunities/<int:id>', methods=['GET'])
@login_required
def get_opportunity(id):
    opportunity = Opportunity.query.filter_by(id=id, admin_id=current_user.id).first()
    if not opportunity:
        return jsonify({'error': 'Opportunity not found'}), 404
    return jsonify(opportunity.to_dict()), 200

@opportunity_bp.route('/api/opportunities/<int:id>', methods=['PUT', 'POST'])
@login_required
def update_opportunity(id):
    opportunity = Opportunity.query.filter_by(id=id, admin_id=current_user.id).first()
    if not opportunity:
        return jsonify({'error': 'Opportunity not found'}), 404
    
    data = request.get_json()
    opportunity.name = data.get('name', opportunity.name)
    opportunity.duration = data.get('duration', opportunity.duration)
    opportunity.start_date = data.get('start_date', opportunity.start_date)
    opportunity.description = data.get('description', opportunity.description)
    opportunity.skills = data.get('skills', opportunity.skills)
    opportunity.category = data.get('category', opportunity.category)
    opportunity.future_opportunities = data.get('future_opportunities', opportunity.future_opportunities)
    opportunity.max_applicants = data.get('max_applicants', opportunity.max_applicants)
    
    db.session.commit()
    return jsonify(opportunity.to_dict()), 200

@opportunity_bp.route('/api/opportunities/<int:id>', methods=['DELETE'])
@login_required
def delete_opportunity(id):
    opportunity = Opportunity.query.filter_by(id=id, admin_id=current_user.id).first()
    if not opportunity:
        return jsonify({'error': 'Opportunity not found'}), 404
    
    db.session.delete(opportunity)
    db.session.commit()
    return jsonify({'message': 'Opportunity deleted successfully'}), 200
