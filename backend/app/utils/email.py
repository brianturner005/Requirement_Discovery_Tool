import httpx

from app.config import settings


async def send_status_notification(
    req_id: str,
    title: str,
    from_status: str,
    to_status: str,
    changed_by: str | None = None,
) -> None:
    if not settings.resend_api_key or not settings.notification_emails:
        return

    recipients = [e.strip() for e in settings.notification_emails.split(",") if e.strip()]
    if not recipients:
        return

    subject = f"[Req Discovery] {req_id} status changed to {to_status}"
    body = f"""Requirement status update

ID:     {req_id}
Title:  {title}
Change: {from_status} → {to_status}
By:     {changed_by or 'System'}

View: https://brianturner005.vercel.app/requirements/{req_id}
"""

    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.from_email,
                    "to": recipients,
                    "subject": subject,
                    "text": body,
                },
                timeout=10,
            )
        except Exception:
            pass
