from app import app
from extensions import db
from models.user import User

ADMINS = [
    {"name": "Tayyab Qadri", "email": "tayyabqadri@iiu.edu.pk", "password": "Admin@1234"},
]

SUPERVISORS = [
    {"name": "Niaz Muhammad",  "email": "niaz.muhammad@iiu.edu.pk",  "password": "Niaz@1234"},
    {"name": "Sanaullah",      "email": "sanaullah@iiu.edu.pk",      "password": "Sana@1234"},
    {"name": "Shakir Rasheed", "email": "shakir.rasheed@iiu.edu.pk", "password": "Shakir@1234"},
]

with app.app_context():
    for a in ADMINS:
        if not User.query.filter_by(email=a["email"]).first():
            u = User(name=a["name"], email=a["email"], role="admin")
            u.set_password(a["password"])
            db.session.add(u)
            print(f"  Created admin  : {a['email']}")

    for s in SUPERVISORS:
        if not User.query.filter_by(email=s["email"]).first():
            u = User(name=s["name"], email=s["email"], role="supervisor")
            u.set_password(s["password"])
            db.session.add(u)
            print(f"  Created supervisor: {s['email']}")

    db.session.commit()
    print("\nSeeding complete.")
    print("\n--- Credentials ---")
    print("Admins      : tayyabqadri@iiu.edu.pk / Admin@1234")
    print("Supervisors : niaz.muhammad@iiu.edu.pk / Niaz@1234  |  sanaullah@iiu.edu.pk / Sana@1234  |  shakir.rasheed@iiu.edu.pk / Shakir@1234")
    print("Students    : register via /api/auth/register-student, then admin approves")