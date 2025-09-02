from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.cron.tasks.stock import decrease_stock
from app.utils.logging import log_backend

# Instance du scheduler APScheduler
scheduler = BackgroundScheduler()

def run_scheduler():
    try:
        # Configuration du cron pour test à 13:52
        scheduler.add_job(
            decrease_stock,
            CronTrigger(hour=0, minute=0),  # Test à 00:00
            id='daily_stock_decrease',
            name='Diminution quotidienne des stocks',
            max_instances=1,  # Empêche les exécutions multiples
            replace_existing=True
        )
        
        # Démarrer le scheduler
        scheduler.start()
        
        log_backend.info("APScheduler cron initialisé avec succès", {
            "origin": "CRON",
            "code": "APSCHEDULER_INIT_SUCCESS"
        })
        
    except Exception as e:
        log_backend.error("Erreur dans APScheduler", {
            "origin": "CRON",
            "code": "APSCHEDULER_ERROR",
            "error": str(e)
        })

def start_cron():
    run_scheduler()

def stop_cron():
    if scheduler.running:
        scheduler.shutdown()
        log_backend.info("APScheduler arrêté", {
            "origin": "CRON",
            "code": "APSCHEDULER_STOPPED"
        })
