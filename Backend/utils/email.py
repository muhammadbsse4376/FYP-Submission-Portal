from flask_mail import Message
from extensions import mail
import traceback


def send_approval_email(student, sender_email=None):
    """Send an email to the student with their login credentials."""
    print(f"[EMAIL] Attempting to send approval email to: {student.email}")
    print(f"[EMAIL] Sender: {sender_email}")
    
    try:
        msg = Message(
            subject="FYP Portal - Account Approved",
            recipients=[student.email],
            sender=sender_email,
            reply_to=sender_email,
        )
        msg.html = f"""
        <h2>Welcome to FYP Portal!</h2>
        <p>Dear <strong>{student.name}</strong>,</p>
        <p>Your registration has been approved by the admin. You can now log in with the following credentials:</p>
        <table style="border-collapse:collapse; margin:16px 0;">
            <tr><td style="padding:6px 12px; font-weight:bold;">Email:</td><td style="padding:6px 12px;">{student.email}</td></tr>
            <tr><td style="padding:6px 12px; font-weight:bold;">Password:</td><td style="padding:6px 12px;">{student.plain_password}</td></tr>
        </table>
        <p>Best regards,<br>FYP Portal Admin</p>
        """
        mail.send(msg)
        print(f"[EMAIL] SUCCESS - Email sent to {student.email}")
    except Exception as e:
        print(f"[EMAIL] FAILED - Error: {e}")
        print(f"[EMAIL] Traceback: {traceback.format_exc()}")
        raise  # Re-raise to let caller handle


def send_test_email(recipient_email, sender_email, admin_name):
    """Send a plain SMTP test email so admin can verify mail settings quickly."""
    msg = Message(
        subject="FYP Portal — SMTP Test Email",
        recipients=[recipient_email],
        sender=sender_email,
        reply_to=sender_email,
    )
    msg.html = f"""
    <h3>SMTP Test Successful</h3>
    <p>This is a test email from FYP Portal.</p>
    <p><strong>Sender:</strong> {sender_email}</p>
    <p><strong>Triggered by admin:</strong> {admin_name}</p>
    <p>If you received this, your SMTP setup is working.</p>
    """
    mail.send(msg)
