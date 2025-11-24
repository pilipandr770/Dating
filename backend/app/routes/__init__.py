from flask import Blueprint

auth_bp = Blueprint('auth', __name__)
user_bp = Blueprint('user', __name__)
match_bp = Blueprint('match', __name__)
chat_bp = Blueprint('chat', __name__)
payment_bp = Blueprint('payment', __name__)

@auth_bp.route('/test', methods=['GET'])
def test():
    return {'message': 'API works!'}
