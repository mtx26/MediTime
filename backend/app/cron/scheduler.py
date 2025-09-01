import schedule
import time
from threading import Thread
from app.cron.tasks.stock import decrease_stock
from app.utils.logging import log_backend

def run_scheduler():
    try:
        # toute les semaines le lundi a 00:00
        # schedule.every().monday.at("00:00").do(decrease_stock)
        # toute les jours a 00:00
        schedule.every(1).day.at("00:00").do(decrease_stock)
        # toute les 10 secondes
        #schedule.every(10).seconds.do(decrease_stock)

        log_backend.info("⏳ Cron toutes les jours initialisé", {
            "origin": "CRON",
            "code": "CRON_DAILY_INIT_SUCCESS"
        })

        while True:
            schedule.run_pending()
            time.sleep(1)
    
    except Exception as e:
        log_backend.error("Erreur dans le cron", {
            "origin": "CRON",
            "code": "CRON_ERROR",
            "error": str(e)
        })

def start_cron():
    t = Thread(target=run_scheduler)
    t.daemon = True
    t.start()
