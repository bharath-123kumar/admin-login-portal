from flask import Flask
from flask_cors import CORS
from models import db
from config import Config
from routes.auth import auth_bp
from routes.opportunities import opp_bp
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(opp_bp, url_prefix='/api/opportunities')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
