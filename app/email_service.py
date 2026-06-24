import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY")


def send_overdue_notification(email: str, task_title: str):
    resend.Emails.send({
        "from": "noreply@mytodolist.online",
        "to": email,
        "subject": f"Užduotis vėluoja: {task_title}",
        "html": f"""
        <h2>Užduotis vėluoja!</h2>
        <p>Jūsų užduotis <strong>{task_title}</strong> jau praėjo terminą ir nėra atlikta.</p>
        <p>Prisijunkite prie <a href="https://mytodolist.online">mytodolist.online</a> ir atlikite užduotį.</p>
        """
    })


def send_upcoming_notification(email: str, task_title: str, due_date: str):
    resend.Emails.send({
        "from": "noreply@mytodolist.online",
        "to": email,
        "subject": f"Artėjantis užduoties terminas: {task_title}",
        "html": f"""
        <h2>Artėjantis terminas!</h2>
        <p>Jūsų užduoties <strong>{task_title}</strong> terminas yra <strong>{due_date}</strong>.</p>
        <p>Liko mažiau nei 1 valanda!</p>
        <p>Prisijunkite prie <a href="https://mytodolist.online">mytodolist.online</a> ir atlikite užduotį.</p>
        """
    })