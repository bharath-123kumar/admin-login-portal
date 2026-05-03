from flask import Blueprint, request, jsonify
from models import db, Opportunity
from .auth import token_required

opp_bp = Blueprint('opportunities', __name__)

@opp_bp.route('', methods=['GET'])
@token_required
def get_all(current_user):
    opps = Opportunity.query.filter_by(admin_id=current_user.id).all()
    return jsonify([op.to_dict() for op in opps])

@opp_bp.route('', methods=['POST'])
@token_required
def create(current_user):
    data = request.get_json()
    
    required = ['name', 'category', 'duration', 'start_date', 'description', 'skills', 'future_opportunities']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
            
    new_opp = Opportunity(
        name=data['name'],
        category=data['category'],
        duration=data['duration'],
        start_date=data['start_date'],
        description=data['description'],
        skills=data['skills'],
        future_opportunities=data['future_opportunities'],
        max_applicants=data.get('max_applicants'),
        admin_id=current_user.id
    )
    
    db.session.add(new_opp)
    db.session.commit()
    
    return jsonify(new_opp.to_dict()), 201

@opp_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_one(current_user, id):
    opp = db.get_or_404(Opportunity, id)
    if opp.admin_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(opp.to_dict())

@opp_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update(current_user, id):
    opp = db.get_or_404(Opportunity, id)
    if opp.admin_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    opp.name = data.get('name', opp.name)
    opp.category = data.get('category', opp.category)
    opp.duration = data.get('duration', opp.duration)
    opp.start_date = data.get('start_date', opp.start_date)
    opp.description = data.get('description', opp.description)
    opp.skills = data.get('skills', opp.skills)
    opp.future_opportunities = data.get('future_opportunities', opp.future_opportunities)
    opp.max_applicants = data.get('max_applicants', opp.max_applicants)
    
    db.session.commit()
    return jsonify(opp.to_dict())

@opp_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete(current_user, id):
    opp = db.get_or_404(Opportunity, id)
    if opp.admin_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    db.session.delete(opp)
    db.session.commit()
    return jsonify({'message': 'Opportunity deleted'})
