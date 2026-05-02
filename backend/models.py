from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    
    opportunities = db.relationship('Opportunity', backref='owner', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Opportunity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    skills = db.Column(db.String(500), nullable=False) # comma separated
    future_opportunities = db.Column(db.Text, nullable=False)
    max_applicants = db.Column(db.Integer, nullable=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'duration': self.duration,
            'start_date': self.start_date,
            'description': self.description,
            'skills': self.skills,
            'future_opportunities': self.future_opportunities,
            'max_applicants': self.max_applicants
        }
